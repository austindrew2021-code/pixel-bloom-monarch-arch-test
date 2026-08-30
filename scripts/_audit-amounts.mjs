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
const AMT = new RegExp(`(?:the\\s+)?(${QTY})\\s+(${UNIT})(?:\\s+of)?(?:\\s+the)?\\s+([a-z][a-z0-9' -]{1,40})`, "gi");

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

const STOP = new Set(["the", "and", "with", "into", "from", "over", "hot", "pan", "rest"]);

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

const household = 2;
const mismatches = [];
const pancakeCheck = [];

for (const r of recipes) {
  const servings = r.servings || 4;
  const scaledSteps = scaleMethodSteps(r.steps, r.ingredients, household, servings);
  const blob = scaledSteps.join(" ");
  const list = r.ingredients.map((i) => ({
    ...i,
    shownQty: scaleQty(i.qty, household, servings),
    shown: formatQty(scaleQty(i.qty, household, servings), i.unit),
  }));
  const hits = [];
  let m;
  AMT.lastIndex = 0;
  while ((m = AMT.exec(blob))) {
    const q = parseQty(m[1]);
    if (q == null) continue;
    const named = m[3].replace(/\b(and|then|until|into|in|on|to|for|with)\b.*/i, "").trim();
    if (!named || named.length < 2) continue;
    const ing = findIng(r.ingredients, named);
    if (!ing) continue;
    if (!ing.unit) continue;
    if (normUnit(ing.unit) !== normUnit(m[2])) continue;
    const want = scaleQty(ing.qty, household, servings);
    if (!close(q, want)) {
      hits.push({
        named,
        stepAmt: `${prettyFrac(q)} ${m[2]}`,
        listAmt: formatQty(want, ing.unit),
        listName: ing.name,
      });
    }
  }
  if (hits.length) {
    mismatches.push({
      id: r.id,
      name: r.name,
      servings,
      hits: hits.slice(0, 8),
      list: list.map((i) => `${i.shown} ${i.name}`),
      steps: scaledSteps,
    });
  }
  if (/pancake|crepe|crêpe|hot brown|affogato|coffee|chili|mint tea|chana|lentil pasta|lemon pepper/i.test(`${r.id} ${r.name}`)) {
    pancakeCheck.push({
      id: r.id,
      name: r.name,
      servings,
      list: list.map((i) => `${i.shown} ${i.name}`),
      steps: scaledSteps,
    });
  }
}

const scallion = recipes.find((r) => r.id === "cn-scallion-pancake");
const scallionScaled = scallion
  ? {
      list: scallion.ingredients.map((i) => `${formatQty(scaleQty(i.qty, 2, scallion.servings), i.unit)} ${i.name}`),
      steps: scaleMethodSteps(scallion.steps, scallion.ingredients, 2, scallion.servings),
      rawSteps: scallion.steps,
    }
  : null;

writeFileSync(
  "/tmp/amount-flags.json",
  JSON.stringify({ total: recipes.length, mismatchCount: mismatches.length, mismatches: mismatches.slice(0, 80), scallion: scallionScaled }, null, 2),
);

console.log("total recipes", recipes.length);
console.log("amount mismatches at 2-person household", mismatches.length);
console.log("\n=== SCALLOP PANCAKE / SCALLION ===");
console.log(JSON.stringify(scallionScaled, null, 2));
console.log("\n=== KEY DISHES ===");
for (const p of pancakeCheck) {
  console.log(`\n${p.id}  ${p.name}`);
  console.log("  LIST", p.list.join(" | "));
  console.log("  STEP", p.steps.join(" / "));
}
console.log("\n=== FIRST 25 MISMATCHES ===");
for (const f of mismatches.slice(0, 25)) {
  console.log(`\n${f.id}  ${f.name}`);
  for (const h of f.hits) console.log(`  STEP ${h.stepAmt} ${h.named}  vs LIST ${h.listAmt} ${h.listName}`);
}
