import { createServer } from "vite";
import { readFileSync, writeFileSync } from "node:fs";

const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});
const recipesMod = await server.ssrLoadModule("/src/lib/recipes.ts");
const cookMod = await server.ssrLoadModule("/src/lib/cook-steps.ts");
const cuisineMod = await server.ssrLoadModule("/src/lib/cuisine.ts");
const formatMod = await server.ssrLoadModule("/src/lib/format.ts");
const i18nMod = await server.ssrLoadModule("/src/lib/i18n.ts");
await server.close();

const recipes = recipesMod.RECIPES;
const { scaleMethodSteps } = cookMod;
const { scaleQty } = cuisineMod;
const { formatQty } = formatMod;
const { t } = i18nMod;

const VERB =
  /\b(heat|warm|preheat|toast|mix|stir|whisk|beat|fold|bake|roast|simmer|boil|brown|sear|saute|sauté|fry|grill|chop|dice|slice|cut|mince|add|pour|drain|pat|salt|season|cover|uncover|rest|serve|plate|spoon|spread|brush|toss|combine|blend|mash|roll|knead|steam|rub|stuff|fill|layer|top|finish|grate|squeeze|taste|remove|return|transfer|flip|turn|chill|soak|marinate|reduce|sprinkle|dust|coat|broil|blanch|peel|rinse|set|put|place|drop|press|shape|cook|melt|wrap|scatter|drizzle|whip|sift|carve|glaze|steep|frost|juice|zest|pull|lock|flatten|score|tie|baste|ladle|dot|wilt|bloom|crack|halve|cube|discard|skewer|poach|dredge|dip|grind|sweat|strain|nestle|pack|line|lift|prick|thread|blot|swirl|unmold|dollop|smash|wipe|loosen|crisp|reheat|keep|scramble|paint|char|puree|purée|dissolve|cream|scald|truss|core|trim|wash|thaw|freeze|skim|adjust|deglaze|thicken|crumble|form|joint|try|lay|let|assemble|garnish|divide|cool|make|shake|eat|fluff|refrigerate|air-?fry|shred|open|break|scoop|pipe|invert|work|get|moisten|lower|separate|griddle|flake)\b/i;

const GARBLED =
  /\b(the the|remaining the|splash more the|fold in the gently|add the fold|add the lay|add the assemble|cook 500|stir in the and|the and the|so everything is ready so everything is ready|so the mix is set so the mix is set|1 minutes\b|ingredients on the list|rest of the list|leafs\b|potatos\b|bunchs\b|main ingredient|any remaining vegetables|gravy from the drippings|taste for salt\.?$|until you can plate it|taking care the pieces stay even|Eat cold until the sauce)\b/i;

const CHILD =
  /\b(until you can plate it|taking care the pieces stay even|use the ingredients|the rest of the list)\b/i;

const SKILLET_TELL = /\b(set a wide skillet|let the fat get hot|browned in spots and tender)\b/i;

function isOvernightOrCold(r) {
  const n = `${r.name} ${(r.tags ?? []).join(" ")} ${r.id}`.toLowerCase();
  return /overnight|parfait|bircher|muesli|hummus|yogurt bowl|yogurt breakfast|cottage bowl|eat cold|oat jar|nice cream/.test(n);
}
function isDrink(r) {
  const n = `${r.name} ${(r.tags ?? []).join(" ")}`.toLowerCase();
  return (r.tags ?? []).includes("drink") || /nog|punch|cocktail|smoothie|lassi|lemonade|iced tea|cocoa|hot chocolate/.test(n);
}
function isAirFry(r) {
  return (r.tags ?? []).includes("air-fryer") || /air-?fryer/.test(r.name);
}
function isSlow(r) {
  return (r.tags ?? []).includes("slow-cooker") || /slow-?cooker|crockpot/.test(r.name);
}
function isPressure(r) {
  return (r.tags ?? []).includes("instant-pot") || /instant-?pot|pressure cooker/.test(r.name);
}
function isSandwich(r) {
  return (r.tags ?? []).includes("sandwich") || /quesadilla|panini|reuben|\bcuban\b|club sandwich/.test(r.name.toLowerCase());
}

const STOP = new Set([
  "fresh", "ground", "dried", "white", "black", "green", "whole", "juice", "kosher",
  "large", "small", "hot", "cold", "chopped", "sliced", "minced", "cooked", "raw",
  "unsalted", "salted", "extra", "virgin", "olive", "the", "and", "or", "of", "ripe", "mixed",
]);
function tokens(name) {
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
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

const sweep1 = []; // language
const sweep2 = []; // ingredients vs steps
const sweep3 = []; // followable + appliance
const uiFlags = [];

for (const r of recipes) {
  const blob = r.steps.join("\n");
  const notes1 = [];
  const notes2 = [];
  const notes3 = [];

  const g = blob.match(GARBLED);
  if (g) notes1.push(`garbled: ${g[0]}`);
  if (CHILD.test(blob)) notes1.push("child-made");
  if (r.steps.some((s) => /^[A-Z][a-z]{2,12}\.$/.test(s.trim()))) notes1.push("fragment");
  if (/\b1 minutes\b/i.test(blob)) notes1.push("1 minutes");
  if (/\b1 cups\b|\b1 eggs\b|\b1 tablespoons\b/i.test(blob)) notes1.push("plural-1");

  const unused = r.ingredients
    .filter((i) => !isSkipIng(i.name) && !mentioned(blob, i))
    .map((i) => `${i.qty} ${i.unit} ${i.name}`.trim());
  if (unused.length >= 2) notes2.push(`unused: ${unused.slice(0, 6).join("; ")}`);

  const splash = /\b(a splash of|a little|a bit of)\b/i.test(blob) &&
    r.ingredients.some((i) => /cup|tbsp|tsp|oz|lb/.test(i.unit || "") && Number(i.qty) >= 0.25 && /water|milk|broth|stock|oil/.test(i.name));
  if (splash) {
    const hit = r.ingredients.some((i) => {
      if (!/water|milk|broth|stock|oil/.test(i.name)) return false;
      const tok = tokens(i.name).filter((w) => /water|milk|broth|stock|oil/.test(w))[0] ?? tokens(i.name)[0];
      return tok && new RegExp(`(splash|a little|a bit of)\\s+(?:of\\s+)?(?:the\\s+)?${tok}\\b`, "i").test(blob);
    });
    if (hit) notes2.push("vague-qty");
  }

  const household = 2;
  const servings = r.servings || 4;
  if (household !== servings) {
    const list = r.ingredients.map((i) => formatQty(scaleQty(i.qty, household, servings), i.unit));
    const badList = list.filter((s) => /^(?:1|⅛|¼|⅓|½|⅔|¾) (cups|eggs|tablespoons|teaspoons)\b/.test(s));
    if (badList.length) notes2.push(`list-plural: ${badList.slice(0, 3).join("; ")}`);
  }

  if (r.steps.length < 3) notes3.push("thin");
  const stubs = r.steps.filter((s) => {
    const t = s.trim();
    if (t.length >= 28 && VERB.test(t)) return false;
    if (/^heat the oven to \d{3}°F/i.test(t)) return false;
    if (/^(chill|rest|soak|cover)\b/i.test(t) && t.length >= 24) return false;
    return t.length < 24 || !VERB.test(t);
  });
  if (stubs.length) notes3.push(`stub: ${stubs.slice(0, 2).join(" | ")}`);

  const wrong =
    (isOvernightOrCold(r) && SKILLET_TELL.test(blob)) ||
    (isDrink(r) && SKILLET_TELL.test(blob) && !/mulled|toddy|hot buttered/.test(r.name.toLowerCase())) ||
    (isAirFry(r) && /set a wide skillet/i.test(blob) && !/air-?fry/i.test(blob)) ||
    (isSlow(r) && SKILLET_TELL.test(blob) && !/slow cook|crock|cooker/i.test(blob)) ||
    (isPressure(r) && SKILLET_TELL.test(blob) && !/instant pot|pressure/i.test(blob)) ||
    (isSandwich(r) && /pat the .+ dry\. salt both sides\. set a wide skillet/i.test(blob));
  if (wrong) notes3.push("wrong-appliance");

  if (/cole slaw|yogurt and berries|sugared grapes/.test(r.name.toLowerCase()) && /serve hot|plate and serve hot/i.test(blob)) {
    notes3.push("served-hot-should-be-cold");
  }

  if (notes1.length) sweep1.push({ id: r.id, name: r.name, notes: notes1, steps: r.steps });
  if (notes2.length) sweep2.push({ id: r.id, name: r.name, notes: notes2, steps: r.steps });
  if (notes3.length) sweep3.push({ id: r.id, name: r.name, notes: notes3, steps: r.steps });
}

const EN_KEYS = [
  "plan","recipes","snap","sauces","desserts","shop","fuel","extras","people","simple","nextGen",
  "bodySync","autoPlate","servings","cookNow","addGrocery","tonight",
];
for (const loc of ["en", "fr", "es"]) {
  for (const k of EN_KEYS) {
    const v = t(loc, k);
    if (!v || v === k) uiFlags.push(`i18n missing ${loc}.${k}`);
  }
}

const uiFiles = [
  "src/components/store-view.tsx",
  "src/components/onboarding.tsx",
  "src/components/fit-view.tsx",
  "src/components/people-view.tsx",
  "src/components/plan-view.tsx",
  "src/components/cook-view.tsx",
  "src/lib/recipes.ts",
  "src/lib/body.ts",
];
for (const f of uiFiles) {
  let src = "";
  try { src = readFileSync(f, "utf8"); } catch { continue; }
  if (/\bgrok\.me\b/i.test(src) && !/preview-host|tester|auth/.test(f)) uiFlags.push(`grok brand in ${f}`);
  if (/\$8\.99/.test(src)) uiFlags.push(`old $8.99 price in ${f}`);
  if (/macros\b/.test(src) && /onboarding|fit-view/.test(f) && /Calories and protein/.test(src) === false) {
    /* macros as a user-facing word is confusing; allowed in code */
  }
}

const result = {
  total: recipes.length,
  sweep1: { name: "language", flags: sweep1.length, sample: sweep1.slice(0, 20) },
  sweep2: { name: "ingredients", flags: sweep2.length, sample: sweep2.slice(0, 20) },
  sweep3: { name: "followable", flags: sweep3.length, sample: sweep3.slice(0, 20) },
  ui: { flags: uiFlags.length, sample: uiFlags.slice(0, 20) },
  pass: sweep1.length === 0 && sweep2.length === 0 && sweep3.length === 0 && uiFlags.length === 0,
};

writeFileSync("/tmp/triple-sweep.json", JSON.stringify({
  ...result,
  sweep1All: sweep1,
  sweep2All: sweep2,
  sweep3All: sweep3,
  uiFlags,
}, null, 2));

console.log(JSON.stringify({
  total: result.total,
  sweep1: result.sweep1.flags,
  sweep2: result.sweep2.flags,
  sweep3: result.sweep3.flags,
  ui: result.ui.flags,
  pass: result.pass,
}, null, 2));

function dump(title, flags) {
  console.log(`\n=== ${title} (${flags.length}) ===`);
  for (const f of flags.slice(0, 25)) {
    console.log(`\n${f.id}  ${f.name}`);
    console.log("  ", (f.notes || []).join(" | "));
    if (f.steps) console.log("  ", f.steps.join(" / ").slice(0, 220));
  }
}
if (sweep1.length) dump("SWEEP 1 language", sweep1);
if (sweep2.length) dump("SWEEP 2 ingredients", sweep2);
if (sweep3.length) dump("SWEEP 3 followable", sweep3);
if (uiFlags.length) {
  console.log("\n=== UI ===");
  for (const u of uiFlags) console.log(" ", u);
}

if (!result.pass) process.exitCode = 1;
