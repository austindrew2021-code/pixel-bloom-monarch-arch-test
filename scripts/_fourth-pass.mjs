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

const STOP = new Set(["the", "and", "with", "into", "from", "over", "hot", "pan", "rest", "reserved", "remaining"]);

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

const GARBLED =
  /\b(the the|remaining the|splash more the|fold in the gently|add the fold|add the lay|add the assemble|cook 500|stir in the and|the and the|so everything is ready so everything is ready|so the mix is set so the mix is set|1 minutes\b|ingredients on the list|rest of the list|leafs\b|potatos\b|bunchs\b|main ingredient|any remaining vegetables|gravy from the drippings|taste for salt\.?$|until you can plate it|taking care the pieces stay even|Eat cold until the sauce|Add the get out)\b/i;

const VERB =
  /\b(heat|warm|preheat|toast|mix|stir|whisk|beat|fold|bake|roast|simmer|boil|brown|sear|saute|sauté|fry|grill|chop|dice|slice|cut|mince|add|pour|drain|pat|salt|season|cover|uncover|rest|serve|plate|spoon|spread|brush|toss|combine|blend|mash|roll|knead|steam|rub|stuff|fill|layer|top|finish|grate|squeeze|taste|remove|return|transfer|flip|turn|chill|soak|marinate|reduce|sprinkle|dust|coat|broil|blanch|peel|rinse|set|put|place|drop|press|shape|cook|melt|wrap|scatter|drizzle|whip|sift|carve|glaze|steep|frost|juice|zest|pull|lock|flatten|score|tie|baste|ladle|dot|wilt|bloom|crack|halve|cube|discard|skewer|poach|dredge|dip|grind|sweat|strain|nestle|pack|line|lift|prick|thread|blot|swirl|unmold|dollop|smash|wipe|loosen|crisp|reheat|keep|scramble|paint|char|puree|purée|dissolve|cream|scald|truss|core|trim|wash|thaw|freeze|skim|adjust|deglaze|thicken|crumble|form|joint|try|lay|let|assemble|garnish|divide|cool|make|shake|eat|fluff|refrigerate|air-?fry|shred|open|break|scoop|pipe|invert|work|get|moisten|lower|separate|griddle|flake)\b/i;

function tokens(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

function mentioned(blob, ing) {
  const t = blob.toLowerCase();
  const n = ing.name.toLowerCase();
  if (t.includes(n)) return true;
  const toks = tokens(ing.name);
  if (toks.some((w) => w.length > 3 && new RegExp(`\\b${w}s?\\b`).test(t))) return true;
  if (/kale|chard|spinach|collard/.test(n) && /\bgreens?\b/.test(t)) return true;
  if (/sourdough|baguette|ciabatta|bread|toast/.test(n) && /\b(toast|bread|bun|crouton)\b/.test(t)) return true;
  if (/chicken thigh|chicken breast|chicken/.test(n) && /\b(chicken|thigh|breast|bird|broiler)\b/.test(t)) return true;
  if (/ground (beef|turkey|pork)/.test(n) && /\b(beef|turkey|pork|meat)\b/.test(t)) return true;
  if (/\beggs?\b/.test(n) && /\b(yolk|white|meringue|egg)\b/.test(t)) return true;
  if (/bourbon|whiskey|whisky/.test(n) && /\b(whiskey|whisky|bourbon)\b/.test(t)) return true;
  if (/parmesan|cheddar|cheese/.test(n) && /\b(cheese|parmesan|cheddar)\b/.test(t)) return true;
  if (/breadcrumb|crumbs/.test(n) && /\bcrumb/.test(t)) return true;
  if (/jam/.test(n) && /\bjam\b/.test(t)) return true;
  if (/neutral oil|oil/.test(n) && /\boil\b/.test(t)) return true;
  return false;
}

function isSkipIng(n) {
  return /^(kosher salt|salt|black pepper|pepper|oil|olive oil|water|ice|crushed ice)$/i.test(n);
}

const mismatches = [];
const garbled = [];
const thin = [];
const unused2 = [];
const stubs = [];
const hotBrown = [];

for (const r of recipes) {
  const servings = r.servings || 4;
  const blob = r.steps.join(" ");
  if (GARBLED.test(blob)) garbled.push({ id: r.id, name: r.name, hit: blob.match(GARBLED)?.[0], steps: r.steps });
  if (r.steps.length < 3) thin.push({ id: r.id, name: r.name, n: r.steps.length, steps: r.steps });
  const unused = r.ingredients.filter((i) => !isSkipIng(i.name) && !mentioned(blob, i)).map((i) => i.name);
  if (unused.length >= 2) unused2.push({ id: r.id, name: r.name, unused, steps: r.steps });
  const stubHits = r.steps.filter((s) => s.trim().length < 24 && !/^Heat the oven to \d{3}°F/i.test(s));
  if (stubHits.length) stubs.push({ id: r.id, name: r.name, stubHits });

  for (const household of [1, 2, 6]) {
    const scaledSteps = scaleMethodSteps(r.steps, r.ingredients, household, servings);
    const hits = [];
    const joined = scaledSteps.join(" ");
    AMT.lastIndex = 0;
    let m;
    while ((m = AMT.exec(joined))) {
      const q = parseQty(m[1]);
      if (q == null) continue;
      const named = m[3].replace(/\b(and|then|until|into|in|on|to|for|with|of)\b.*/i, "").trim();
      if (!named || named.length < 2) continue;
      const ing = findIng(r.ingredients, named);
      if (!ing || !ing.unit) continue;
      if (normUnit(ing.unit) !== normUnit(m[2])) continue;
      const want = scaleQty(ing.qty, household, servings);
      if (close(q, want)) continue;
      if (q < want * 0.4 - 0.05) continue;
      hits.push({
        named,
        stepAmt: `${prettyFrac(q)} ${m[2]}`,
        listAmt: formatQty(want, ing.unit),
        listName: ing.name,
        household,
      });
    }
    if (hits.length) {
      mismatches.push({
        id: r.id,
        name: r.name,
        household,
        servings,
        hits: hits.slice(0, 6),
        list: r.ingredients.map((i) => `${formatQty(scaleQty(i.qty, household, servings), i.unit)} ${i.name}`),
        steps: scaledSteps,
      });
    }
  }

  if (r.id === "ky-hot-brown") {
    for (const household of [1, 2, 4]) {
      hotBrown.push({
        household,
        list: r.ingredients.map((i) => `${formatQty(scaleQty(i.qty, household, servings), i.unit)} ${i.name}`),
        steps: scaleMethodSteps(r.steps, r.ingredients, household, servings),
      });
    }
  }
}

const result = {
  total: recipes.length,
  mismatchCount: mismatches.length,
  garbled: garbled.length,
  thin: thin.length,
  unused2: unused2.length,
  stubs: stubs.length,
  hotBrown,
  mismatches: mismatches.slice(0, 60),
  garbledAll: garbled,
  thinAll: thin.slice(0, 40),
  unusedSample: unused2.slice(0, 30),
  stubSample: stubs.slice(0, 20),
};

writeFileSync("/tmp/fourth-pass.json", JSON.stringify(result, null, 2));

console.log("total", recipes.length);
console.log("amount mismatches (hh 1/2/6, excluding clear partials)", mismatches.length);
console.log("garbled", garbled.length);
console.log("thin", thin.length);
console.log("unused2", unused2.length);
console.log("stubs", stubs.length);
console.log("\n=== HOT BROWN ===");
console.log(JSON.stringify(hotBrown, null, 2));
console.log("\n=== GARBLED ===");
for (const g of garbled.slice(0, 20)) console.log(g.id, g.name, "→", g.hit);
console.log("\n=== FIRST 30 AMOUNT MISMATCHES ===");
for (const f of mismatches.slice(0, 30)) {
  console.log(`\n${f.id}  ${f.name}  hh=${f.household}`);
  for (const h of f.hits) console.log(`  STEP ${h.stepAmt} ${h.named}  vs LIST ${h.listAmt} ${h.listName}`);
}
console.log("\n=== UNUSED (sample) ===");
for (const u of unused2.slice(0, 15)) console.log(u.id, u.name, "→", u.unused.join(", "));
console.log("\n=== THIN ===");
for (const t of thin.slice(0, 15)) console.log(t.id, t.name, t.n, t.steps.join(" / ").slice(0, 160));
