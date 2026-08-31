import { createServer } from "vite";
import { writeFileSync } from "node:fs";

const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});
const recipesMod = await server.ssrLoadModule("/src/lib/recipes.ts");
const cookMod = await server.ssrLoadModule("/src/lib/cook-steps.ts");
const cuisineMod = await server.ssrLoadModule("/src/lib/cuisine.ts");
const formatMod = await server.ssrLoadModule("/src/lib/format.ts");
await server.close();

const recipes = recipesMod.RECIPES;
const { scaleMethodSteps } = cookMod;
const { scaleQty } = cuisineMod;
const { prettyFrac, formatQty } = formatMod;

const FRAC = { "⅛": 0.125, "¼": 0.25, "⅓": 1 / 3, "½": 0.5, "⅔": 2 / 3, "¾": 0.75 };
const UNIT =
  "tablespoons?|teaspoons?|cups?|ounces?|pounds?|tbsp|tsp|oz|lb|cloves?|cans?|pints?|quarts?|pinches?|dashes?|slices?|sprigs?|bunches?|sticks?|grams?|ml";
const QTY = String.raw`\d+\s+\d+\s*/\s*\d+|\d+\s*/\s*\d+|\d+(?:\.\d+)?|[⅛¼⅓½⅔¾]|\d+[⅛¼⅓½⅔¾]`;
const AMT = new RegExp(`(?:the\\s+)?(${QTY})\\s+(${UNIT})(?:\\s+of)?(?:\\s+the)?\\s+([a-z][a-z0-9' -]{1,48})`, "gi");

function parseQty(raw) {
  const t = String(raw).trim().replace(/\s+/g, " ");
  if (FRAC[t] != null) return FRAC[t];
  const mixedUni = t.match(/^(\d+)([⅛¼⅓½⅔¾])$/);
  if (mixedUni) return Number(mixedUni[1]) + (FRAC[mixedUni[2]] ?? 0);
  const mixedAscii = t.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixedAscii) return Number(mixedAscii[1]) + Number(mixedAscii[2]) / Number(mixedAscii[3]);
  const ascii = t.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (ascii && Number(ascii[2]) > 0) return Number(ascii[1]) / Number(ascii[2]);
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}
function normUnit(u) {
  const x = String(u || "").toLowerCase().replace(/s$/, "");
  if (/^(tbsp|tablespoon)$/.test(x)) return "tbsp";
  if (/^(tsp|teaspoon)$/.test(x)) return "tsp";
  if (/^(oz|ounce)$/.test(x)) return "oz";
  if (/^(lb|pound)$/.test(x)) return "lb";
  return x;
}
function close(a, b) {
  return Math.abs(a - b) <= 0.12;
}
const STOP = new Set(["the", "and", "with", "into", "from", "over", "hot", "pan", "rest", "reserved", "remaining", "melted"]);
function findIng(ings, named) {
  const n = named.toLowerCase().replace(/[.,;:]+$/, "").trim();
  const exact = ings.find((i) => i.name.toLowerCase() === n);
  if (exact) return exact;
  const starts = ings.filter((i) => i.name.toLowerCase().startsWith(n) || n.startsWith(i.name.toLowerCase()));
  if (starts.length === 1) return starts[0];
  const tok = n.split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
  const hits = ings.filter((i) => tok.some((w) => i.name.toLowerCase().includes(w)));
  if (hits.length === 1) return hits[0];
  return null;
}

const PERSON = [
  [/\bthe the\b/i, "the the"],
  [/\bremaining the\b/i, "remaining the"],
  [/\bthe can of the\b/i, "the can of the"],
  [/\bthe slice of the\b/i, "the slice of the"],
  [/\bboiling the\b/i, "boiling the"],
  [/\bHot the\b/, "Hot the"],
  [/\bdrained the \d/i, "drained the QTY"],
  [/\b1 minutes\b/i, "1 minutes"],
  [/\b1 cups\b/i, "1 cups"],
  [/\b1 eggs\b/i, "1 eggs"],
  [/\b1 tablespoons\b/i, "1 tablespoons"],
  [/\b¼ tablespoon\b/i, "¼ tablespoon (awkward)"],
  [/\b½ eggs\b/i, "½ eggs"],
  [/\b¾ apples\b/i, "¾ apples"],
  [/\b1¼ \w+ fillets\b/i, "fractional fillets"],
  [/\bgravy from the drippings\.?$/i, "gravy stub"],
  [/\btaste for salt\.?$/i, "taste-for-salt stub"],
  [/\bingredients on the list\b/i, "ingredients on the list"],
  [/\blet the fat get hot\b/i, "let the fat get hot"],
  [/\ba little oil\b/i, "a little oil"],
  [/\ba splash of (?!pasta )/i, "a splash of"],
  [/\bEat cold until the sauce\b/i, "eat cold until sauce"],
  [/\bAdd the get\b/i, "Add the get"],
  [/\bstir in the and\b/i, "stir in the and"],
  [/\bpotatos\b/i, "potatos"],
  [/\bleafs\b/i, "leafs"],
  [/\bmain ingredient\b/i, "main ingredient"],
  [/\buntil you can plate it\b/i, "child phrase"],
];

const lines = [];
const complaints = [];
const watch = [];

const KEY = [
  "ky-hot-brown", "ok-chicken-fried-steak", "af-corn", "pk-oats", "hd-hot-cocoa",
  "so-egg-nog", "so-cole-slaw", "so-corn-fritters", "so-grits", "so-flounder",
  "so-roe-herring", "romesco", "ut-funeral-potatoes", "affogato", "it-affogato",
  "hp-chicken-prep", "lemon-pepper-chicken", "pk-hummus", "so-curds-cream",
  "so-hoe-cake", "md-crab-cakes", "ca-fish-tacos", "mt-bison-skillet",
  "tn-hot-chicken", "vh-ww2-cornmeal-mush", "ar-ff-welsh-rarebit",
  "gf-poke", "cc-yogurt-berries", "so-onion-au-gratin", "il-italian-beef",
];

for (const r of recipes) {
  const servings = r.servings || 4;
  const hh2 = scaleMethodSteps(r.steps, r.ingredients, 2, servings);
  const hh1 = scaleMethodSteps(r.steps, r.ingredients, 1, servings);
  const list2 = r.ingredients.map((i) => `${formatQty(scaleQty(i.qty, 2, servings), i.unit)} ${i.name}`);

  const blob2 = hh2.join(" ");
  const notes = [];
  for (const [re, label] of PERSON) {
    if (re.test(blob2) || re.test(r.steps.join(" "))) notes.push(label);
  }
  // consecutive duplicate steps
  for (let i = 1; i < hh2.length; i++) {
    if (hh2[i].toLowerCase() === hh2[i - 1].toLowerCase()) notes.push("duplicate step");
  }
  if (hh2.length < 3) notes.push("thin");
  if (hh2.some((s) => s.trim().length < 20)) notes.push("short card");

  AMT.lastIndex = 0;
  let m;
  const mismatches = [];
  while ((m = AMT.exec(blob2))) {
    const q = parseQty(m[1]);
    if (q == null) continue;
    const named = m[3].replace(/\b(and|then|until|into|in|on|to|for|with|of)\b.*/i, "").trim();
    if (!named || named.length < 2) continue;
    const ing = findIng(r.ingredients, named);
    if (!ing || !ing.unit) continue;
    if (normUnit(ing.unit) !== normUnit(m[2])) continue;
    const want = scaleQty(ing.qty, 2, servings);
    if (close(q, want)) continue;
    if (q < want * 0.45) continue; // likely a true partial
    mismatches.push(`${prettyFrac(q)} ${m[2]} ${named} vs list ${formatQty(want, ing.unit)} ${ing.name}`);
  }

  if (notes.length || mismatches.length) {
    complaints.push({
      id: r.id,
      name: r.name,
      notes,
      mismatches,
      list: list2,
      steps: hh2,
    });
  }

  if (KEY.includes(r.id) || /hot brown|affogato|egg nog|cole slaw|overnight|hummus|hoe cake|crab cake|corn fritter|grits|flounder|funeral/i.test(`${r.id} ${r.name}`)) {
    watch.push({
      id: r.id,
      name: r.name,
      servings,
      list4: r.ingredients.map((i) => `${formatQty(i.qty, i.unit)} ${i.name}`),
      list2,
      list1: r.ingredients.map((i) => `${formatQty(scaleQty(i.qty, 1, servings), i.unit)} ${i.name}`),
      steps4: r.steps,
      steps2: hh2,
      steps1: hh1,
    });
  }

  lines.push(`\n## ${r.id}  ${r.name}  (${r.minutes} min, serves ${servings} → shown for 2)`);
  lines.push(`LIST: ${list2.join(" · ")}`);
  hh2.forEach((s, i) => lines.push(`  ${i + 1}. ${s}`));
}

writeFileSync("/tmp/human-catalog.txt", lines.join("\n"));
writeFileSync("/tmp/human-complaints.json", JSON.stringify(complaints, null, 2));
writeFileSync("/tmp/human-watch.json", JSON.stringify(watch, null, 2));

console.log("recipes", recipes.length);
console.log("catalog chars", lines.join("\n").length);
console.log("person-complaint recipes", complaints.length);
console.log("watch", watch.length);
console.log("\n=== COMPLAINTS ===");
for (const c of complaints) {
  console.log(`\n${c.id}  ${c.name}`);
  if (c.notes.length) console.log("  notes:", c.notes.join(" | "));
  if (c.mismatches.length) console.log("  amt:", c.mismatches.join(" ; "));
  console.log("  ", c.steps.join(" / ").slice(0, 280));
}
