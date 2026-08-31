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

const COOK_COMPLAIN = [
  [/\bthe the\b/i, "the the"],
  [/\bremaining the\b/i, "remaining the"],
  [/\bthe can of the\b/i, "the can of the"],
  [/\bthe slice of the\b/i, "the slice of the"],
  [/\bboiling the\b/i, "boiling the"],
  [/\bHot the\b/, "Hot the"],
  [/\bBlend wraps\b/i, "blend wraps"],
  [/\bBlend .*\bwrap/i, "blend a wrap"],
  [/\bScatter the around\b/i, "scatter the around"],
  [/\bAdd and cook\b/i, "Add and cook"],
  [/\bstir in the and\b/i, "stir in the and"],
  [/\bAdd the get\b/i, "Add the get"],
  [/\bAdd the lay\b/i, "Add the lay"],
  [/\bpotatos\b/i, "potatos"],
  [/\bleafs\b/i, "leafs"],
  [/\bmain ingredient\b/i, "main ingredient"],
  [/\buntil you can plate it\b/i, "child phrase"],
  [/\bingredients on the list\b/i, "ingredients on the list"],
  [/\bEat cold until the sauce\b/i, "eat cold until sauce"],
  [/\bthen the chicken broth, then the chicken broth/i, "broth twice"],
  [/\bthen the ([a-z ]+), then the \1\b/i, "same liquid twice"],
  [/\b1 minutes\b/i, "1 minutes"],
  [/\b1 cups\b/i, "1 cups"],
  [/\b1 eggs\b/i, "1 eggs"],
  [/\b1 tablespoons\b/i, "1 tablespoons"],
  [/\b¼ tablespoon\b/i, "¼ tablespoon"],
  [/\b½ eggs\b/i, "½ eggs"],
  [/\b1 wraps\b/i, "1 wraps"],
  [/\b1½-pounds\b/i, "1½-pounds"],
  [/\bundefined\b/i, "undefined"],
  [/\bnull\b/i, "null"],
  [/\bNaN\b/, "NaN"],
  [/\b\[object /i, "object dump"],
  [/\bTODO\b/, "TODO"],
  [/\bxxx\b/i, "xxx"],
];

const lines = [];
const complaints = [];
const watchIds = [
  "ky-hot-brown", "sw-hummus-veg", "vg-hummus-bowl", "pk-hummus", "md-hummus",
  "af-corn", "md-crab-cakes", "so-egg-nog", "hd-hot-cocoa", "ut-funeral-potatoes",
  "romesco", "so-grits", "so-flounder", "so-roe-herring", "il-italian-beef",
  "sw-falafel-wrap", "tomato-basil-pasta", "ham-pea-pasta", "peanut-noodles",
];
const watch = [];

for (const r of recipes) {
  const servings = r.servings || 4;
  const hh1 = scaleMethodSteps(r.steps, r.ingredients, 1, servings);
  const hh4 = r.steps;
  const list1 = r.ingredients.map((i) => `${formatQty(scaleQty(i.qty, 1, servings), i.unit)} ${i.name}`.trim());
  const list4 = r.ingredients.map((i) => `${formatQty(i.qty, i.unit)} ${i.name}`.trim());
  const blob = `${hh1.join(" ")} ${hh4.join(" ")}`;
  const notes = [];
  for (const [re, label] of COOK_COMPLAIN) {
    if (re.test(blob) || re.test(list1.join(" "))) notes.push(label);
  }
  for (let i = 1; i < hh1.length; i++) {
    if (hh1[i].toLowerCase() === hh1[i - 1].toLowerCase()) notes.push("duplicate step");
  }
  if (hh1.length < 3) notes.push("thin");
  if (hh1.some((s) => s.trim().length < 18)) notes.push("short card");
  if (/\bflour\b/i.test(blob) && /until tender/i.test(blob) && /socca|pajeon|pancake/i.test(r.name)) {
    notes.push("flour until tender");
  }

  AMT.lastIndex = 0;
  let m;
  const mismatches = [];
  while ((m = AMT.exec(hh1.join(" ")))) {
    const q = parseQty(m[1]);
    if (q == null) continue;
    const named = m[3].replace(/\b(and|then|until|into|in|on|to|for|with|of)\b.*/i, "").trim();
    if (!named || named.length < 2) continue;
    const ing = findIng(r.ingredients, named);
    if (!ing || !ing.unit) continue;
    if (normUnit(ing.unit) !== normUnit(m[2])) continue;
    const want = scaleQty(ing.qty, 1, servings);
    if (close(q, want)) continue;
    if (q < want * 0.45) continue;
    mismatches.push(`${prettyFrac(q)} ${m[2]} ${named} vs list ${formatQty(want, ing.unit)} ${ing.name}`);
  }

  if (notes.length || mismatches.length) {
    complaints.push({ id: r.id, name: r.name, notes, mismatches, list: list1, steps: hh1 });
  }
  if (watchIds.includes(r.id)) {
    watch.push({ id: r.id, name: r.name, servings, list4, list1, steps4: hh4, steps1: hh1 });
  }

  lines.push(`\n## ${r.id}  ${r.name}  (${r.minutes} min, serves ${servings})`);
  lines.push(`LIST 4: ${list4.join(" · ")}`);
  lines.push(`LIST 1: ${list1.join(" · ")}`);
  hh4.forEach((s, i) => lines.push(`  4.${i + 1} ${s}`));
  hh1.forEach((s, i) => lines.push(`  1.${i + 1} ${s}`));
}

writeFileSync("/tmp/last-look.txt", lines.join("\n"));
writeFileSync("/tmp/last-look-complaints.json", JSON.stringify(complaints, null, 2));
writeFileSync("/tmp/last-look-watch.json", JSON.stringify(watch, null, 2));

console.log("recipes", recipes.length);
console.log("catalog chars", lines.join("\n").length);
console.log("person-complaint recipes", complaints.length);
const byNote = {};
for (const c of complaints) {
  for (const n of c.notes) byNote[n] = (byNote[n] || 0) + 1;
}
console.log("notes", JSON.stringify(byNote, null, 2));
console.log("mismatches", complaints.filter((c) => c.mismatches.length).length);
console.log("\n=== COMPLAINTS ===");
for (const c of complaints.slice(0, 80)) {
  console.log(`\n${c.id}  ${c.name}`);
  if (c.notes.length) console.log("  notes:", c.notes.join(" | "));
  if (c.mismatches.length) console.log("  amt:", c.mismatches.join(" ; "));
  console.log("  ", c.steps.join(" / ").slice(0, 320));
}
if (complaints.length > 80) console.log(`\n… ${complaints.length - 80} more`);
