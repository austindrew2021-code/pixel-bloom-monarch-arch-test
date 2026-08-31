import { createServer } from "vite";
import { writeFileSync } from "node:fs";

const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});
const recipesMod = await server.ssrLoadModule("/src/lib/recipes.ts");
await server.close();
const recipes = recipesMod.RECIPES;

const VERB =
  /\b(heat|warm|preheat|toast|mix|stir|whisk|beat|fold|bake|roast|simmer|boil|brown|sear|saute|sauté|fry|grill|chop|dice|slice|cut|mince|add|pour|drain|pat|salt|season|cover|uncover|rest|serve|plate|spoon|spread|brush|toss|combine|blend|mash|roll|knead|steam|rub|stuff|fill|layer|top|finish|grate|squeeze|taste|remove|return|transfer|flip|turn|chill|soak|marinate|reduce|sprinkle|dust|coat|broil|blanch|peel|rinse|set|put|place|drop|press|shape|cook|melt|wrap|scatter|drizzle|whip|sift|carve|glaze|steep|frost|juice|zest|pull|lock|flatten|score|tie|baste|ladle|dot|wilt|bloom|crack|halve|cube|discard|skewer|poach|dredge|dip|grind|sweat|strain|nestle|pack|line|lift|prick|thread|blot|swirl|unmold|dollop|smash|wipe|loosen|crisp|reheat|keep|scramble|paint|char|puree|purée|dissolve|cream|scald|truss|core|trim|wash|thaw|freeze|skim|adjust|deglaze|thicken|crumble|form|joint|try|lay|let|assemble|garnish|divide|cool|make|shake|eat|fluff|refrigerate|air-?fry|shred|open|break|scoop|pipe|bloom|invert|air.fry)\b/i;

const GARBLED =
  /\b(the the|remaining the|splash more the|fold in the gently|add the fold|add the lay|cook 500|stir in the and|the and the|so everything is ready so everything is ready|so the mix is set so the mix is set|1 minutes\b|ingredients on the list|rest of the list|leafs\b|potatos\b|bunchs\b|main ingredient|any remaining vegetables|gravy from the drippings|taste for salt\.?$|until the sauce is even so the mix|Eat cold until the sauce)\b/i;

const SKILLET_TELL = /\b(set a wide skillet|let the fat get hot|browned in spots and tender|taste a piece: it should be tender with browned edges)\b/i;

function isOvernightOrCold(r) {
  const n = `${r.name} ${(r.tags ?? []).join(" ")} ${r.id}`.toLowerCase();
  return /overnight|parfait|bircher|muesli|hummus|yogurt bowl|yogurt breakfast|cottage bowl|eat cold|oat jar/.test(n);
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
  if (/sourdough|baguette|ciabatta/.test(n) && /\b(toast|bread|bun)\b/.test(t)) return true;
  if (/chicken thigh|chicken breast|chicken/.test(n) && /\b(chicken|thigh|breast|bird)\b/.test(t)) return true;
  if (/ground (beef|turkey|pork)/.test(n) && /\b(beef|turkey|pork|meat)\b/.test(t)) return true;
  return false;
}
function isSkipIng(n) {
  return /^(kosher salt|salt|black pepper|pepper|oil|olive oil|water|ice|crushed ice)$/i.test(n);
}

const flags = [];
const tallies = {
  total: recipes.length,
  garbled: 0,
  wrongAppliance: 0,
  thin: 0,
  unused2: 0,
  noVerb: 0,
  dupPhrase: 0,
  stub: 0,
  usableOk: 0,
};

for (const r of recipes) {
  const problems = [];
  const blob = r.steps.join("\n");
  const notes = [];

  if (GARBLED.test(blob) || /\b(\w+) \1\b/i.test(blob.replace(/\b(the|a|and|of|in|to|for|with)\b/gi, " "))) {
    const hit = blob.match(GARBLED);
    if (hit) {
      problems.push("garbled");
      notes.push(`garbled: ${hit[0]}`);
      tallies.garbled++;
    }
  }
  if (/so (everything is ready|the mix is set).{0,8}so \1/i.test(blob) || /so everything is ready so everything is ready/i.test(blob)) {
    problems.push("dup-phrase");
    tallies.dupPhrase++;
  }

  const wrong =
    (isOvernightOrCold(r) && SKILLET_TELL.test(blob)) ||
    (isDrink(r) && SKILLET_TELL.test(blob) && !/mulled|toddy|hot buttered/.test(r.name.toLowerCase())) ||
    (isAirFry(r) && /set a wide skillet/i.test(blob) && !/air-?fry/i.test(blob)) ||
    (isSlow(r) && SKILLET_TELL.test(blob) && !/slow cook|crock|cooker/i.test(blob)) ||
    (isPressure(r) && SKILLET_TELL.test(blob) && !/instant pot|pressure/i.test(blob)) ||
    (isSandwich(r) && /pat the .+ dry\. salt both sides\. set a wide skillet/i.test(blob));
  if (wrong) {
    problems.push("wrong-appliance");
    notes.push("wrong appliance template");
    tallies.wrongAppliance++;
  }

  if (r.steps.length < 3) {
    problems.push("thin");
    tallies.thin++;
  }
  const stubs = r.steps.filter((s) => {
    const t = s.trim();
    if (t.length >= 28 && VERB.test(t)) return false;
    if (/^heat the oven to \d{3}°F/i.test(t)) return false;
    if (/^(chill|rest|soak|cover)\b/i.test(t) && t.length >= 24) return false;
    return t.length < 24 || !VERB.test(t);
  });
  if (stubs.length) {
    problems.push("stub");
    notes.push(`stub: ${stubs.slice(0, 2).join(" | ")}`);
    tallies.stub++;
  }
  const verbless = r.steps.filter((s) => s.length >= 28 && !VERB.test(s));
  if (verbless.length) {
    problems.push("no-verb");
    notes.push(`no-verb: ${verbless.slice(0, 2).join(" | ")}`);
    tallies.noVerb++;
  }
  const unused = r.ingredients
    .filter((i) => !isSkipIng(i.name) && !mentioned(blob, i))
    .map((i) => `${i.qty} ${i.unit} ${i.name}`.trim());
  if (unused.length >= 2) {
    problems.push("unused");
    notes.push(`unused: ${unused.slice(0, 6).join("; ")}`);
    tallies.unused2++;
  }

  const usable = r.steps.filter((s) => s.length >= 28 && VERB.test(s)).length;
  if (usable >= 3 && !problems.includes("garbled") && !problems.includes("wrong-appliance") && !problems.includes("dup-phrase")) {
    tallies.usableOk++;
  }
  if (problems.length) {
    flags.push({
      id: r.id,
      name: r.name,
      pack: r.pack,
      plate: r.plate,
      tags: (r.tags ?? []).slice(0, 6),
      problems,
      notes,
      unused: unused.slice(0, 6),
      stubs: stubs.slice(0, 4),
      verbless: verbless.slice(0, 4),
      steps: r.steps,
    });
  }
}

const byProblem = {};
const byPrefix = {};
for (const f of flags) {
  for (const p of f.problems) byProblem[p] = (byProblem[p] ?? 0) + 1;
  const p = (f.id || "").split("-")[0];
  byPrefix[p] = (byPrefix[p] ?? 0) + 1;
}

writeFileSync("/tmp/launch-third.json", JSON.stringify({ tallies, byProblem, byPrefix, flags }, null, 2));
console.log(JSON.stringify({ tallies, byProblem, flagCount: flags.length }, null, 2));

function dump(label, pred, n = 25) {
  const rows = flags.filter(pred).slice(0, n);
  if (!rows.length) return;
  console.log(`\n=== ${label} (${rows.length} shown) ===`);
  for (const f of rows) {
    console.log(`\n${f.id}  ${f.name}  [${f.problems.join(",")}]`);
    if (f.notes.length) console.log("  NOTE", f.notes.join(" | "));
    console.log("  ", f.steps.join(" / ").slice(0, 320));
  }
}

dump("WRONG APPLIANCE", (f) => f.problems.includes("wrong-appliance"), 40);
dump("GARBLED", (f) => f.problems.includes("garbled"), 30);
dump("DUP PHRASE", (f) => f.problems.includes("dup-phrase"), 15);
dump("THIN", (f) => f.problems.includes("thin"), 20);
dump("UNUSED", (f) => f.problems.includes("unused") && !f.problems.includes("wrong-appliance"), 20);
dump("STUB (non-so, first)", (f) => f.problems.includes("stub") && !f.id.startsWith("so-") && !f.problems.includes("wrong-appliance"), 20);
dump("NO-VERB (non false-ish)", (f) => f.problems.includes("no-verb") && !f.problems.includes("wrong-appliance"), 20);
