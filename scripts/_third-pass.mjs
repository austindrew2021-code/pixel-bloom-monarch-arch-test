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
  /\b(heat|warm|preheat|toast|mix|stir|whisk|beat|fold|bake|roast|simmer|boil|brown|sear|saute|sauté|fry|grill|chop|dice|slice|cut|mince|add|pour|drain|pat|salt|season|cover|uncover|rest|serve|plate|spoon|spread|brush|toss|combine|blend|mash|roll|knead|steam|rub|stuff|fill|layer|top|finish|grate|squeeze|taste|remove|return|transfer|flip|turn|chill|soak|marinate|reduce|sprinkle|dust|coat|broil|blanch|peel|rinse|set|put|place|drop|press|shape|cook|melt|wrap|scatter|drizzle|whip|sift|carve|glaze|steep|frost|juice|zest|pull|lock|flatten|score|tie|baste|ladle|dot|wilt|bloom|crack|halve|cube|discard|skewer|poach|dredge|dip|grind|sweat|strain|nestle|pack|line|lift|prick|thread|blot|swirl|unmold|dollop|smash|wipe|loosen|crisp|reheat|keep|scramble|paint|char|puree|purée|dissolve|cream|scald|truss|core|trim|wash|thaw|freeze|skim|adjust|deglaze|thicken|crumble|form|joint|try|blend)\b/i;

const GRAMMAR =
  /\b(the the|remaining the|splash more the|fold in the gently|soft the \d|the \S+ (?:cups?|tablespoons?|teaspoons?) of [Ww]arm (?:milk|water|cream)|main ingredient|any remaining vegetables|add the fold|cook 500|serve with egg|gravy from the drippings|flip \d+ with|thighs is |taste for salt\.?$|the the |ingredients on the list|rest of the list|leafs\b|potatos\b|bunchs\b)\b/i;

const FRAGMENT = /^[A-Z][a-z]{2,14}\.?$/;

const STOP = new Set([
  "fresh", "ground", "dried", "white", "black", "green", "whole", "juice", "kosher",
  "large", "small", "hot", "cold", "chopped", "sliced", "minced", "cooked", "raw",
  "unsalted", "salted", "extra", "virgin", "olive", "the", "and", "or", "of",
  "ripe", "mixed",
]);

const SYN = [
  [/kale|chard|spinach|collard/, /\bgreens?\b/],
  [/sourdough|baguette|ciabatta/, /\b(toast|bread|bun)\b/],
  [/chicken thigh|chicken breast|chicken/, /\b(chicken|thigh|breast|bird)\b/],
  [/ground (beef|turkey|pork)/, /\b(beef|turkey|pork|meat)\b/],
];

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
  for (const [ingRe, stepRe] of SYN) {
    if (ingRe.test(n) && stepRe.test(t)) return true;
  }
  return false;
}

function isSkipIng(n) {
  return /^(kosher salt|salt|black pepper|pepper|oil|olive oil|water|ice|crushed ice)$/i.test(n);
}

const flags = [];
const tallies = {
  total: recipes.length,
  grammar: 0,
  fragment: 0,
  thin: 0,
  shortStub: 0,
  unused2: 0,
  noVerbReal: 0,
  usableOk: 0,
};

for (const r of recipes) {
  const problems = [];
  const blob = r.steps.join("\n");
  const grammarHits = blob.match(GRAMMAR) || [];
  const fragments = r.steps.filter((s) => FRAGMENT.test(s.trim()) || /^(gravy from|potatoes\.?$)/i.test(s.trim()));
  const shortStub = r.steps.filter((s) => {
    const t = s.trim();
    if (t.length >= 36) return false;
    if (/^heat the oven to \d{3}°F/i.test(t)) return false;
    if (/^chill \d/i.test(t) || /^rest \d/i.test(t) || /^soak\b/i.test(t)) return false;
    if (t.length >= 24 && VERB.test(t)) return false;
    return t.length < 24;
  });
  const verbless = r.steps.filter((s) => s.length >= 20 && !VERB.test(s));
  const unused = r.ingredients
    .filter((i) => !isSkipIng(i.name) && !mentioned(blob, i))
    .map((i) => `${i.qty} ${i.unit} ${i.name}`.trim());

  if (grammarHits.length) {
    problems.push("grammar");
    tallies.grammar++;
  }
  if (fragments.length) {
    problems.push("fragment");
    tallies.fragment++;
  }
  if (r.steps.length < 3) {
    problems.push("thin");
    tallies.thin++;
  }
  if (shortStub.length) {
    problems.push("short-stub");
    tallies.shortStub++;
  }
  if (verbless.length) {
    problems.push("no-verb");
    tallies.noVerbReal++;
  }
  if (unused.length >= 2) {
    problems.push("unused");
    tallies.unused2++;
  }
  const usable = r.steps.filter((s) => s.length >= 28 && VERB.test(s)).length;
  if (usable >= 3 && !problems.includes("grammar") && !problems.includes("fragment")) {
    tallies.usableOk++;
  }
  if (problems.length) {
    flags.push({
      id: r.id,
      name: r.name,
      pack: r.pack,
      plate: r.plate,
      problems,
      grammar: grammarHits.slice(0, 4),
      fragments: fragments.slice(0, 4),
      shortStub: shortStub.slice(0, 4),
      verbless: verbless.slice(0, 4),
      unused: unused.slice(0, 6),
      steps: r.steps,
    });
  }
}

const byPrefix = {};
for (const f of flags) {
  const p = (f.id || "").split("-")[0];
  byPrefix[p] = (byPrefix[p] ?? 0) + 1;
}

writeFileSync(
  "/tmp/third-pass.json",
  JSON.stringify({ tallies, byPrefix, flags }, null, 2),
);

console.log(JSON.stringify({ tallies, byPrefix, flagCount: flags.length }, null, 2));
console.log("\n=== GRAMMAR ===");
for (const f of flags.filter((x) => x.problems.includes("grammar")).slice(0, 30)) {
  console.log(`\n${f.id}  ${f.name}`);
  console.log("  HIT", f.grammar.join(" | "));
  console.log("  ", f.steps.join(" / ").slice(0, 260));
}
console.log("\n=== FRAGMENT ===");
for (const f of flags.filter((x) => x.problems.includes("fragment")).slice(0, 20)) {
  console.log(`${f.id}  FRAG ${f.fragments.join(" | ")}`);
}
console.log("\n=== THIN ===");
for (const f of flags.filter((x) => x.problems.includes("thin"))) {
  console.log(`${f.id}  (${f.steps.length})  ${f.steps.join(" / ").slice(0, 180)}`);
}
console.log("\n=== SHORT STUB (first 25) ===");
for (const f of flags.filter((x) => x.problems.includes("short-stub")).slice(0, 25)) {
  console.log(`${f.id}  ${f.shortStub.join(" | ")}`);
}
console.log("\n=== UNUSED non-so (first 20) ===");
for (const f of flags.filter((x) => x.problems.includes("unused") && !x.id.startsWith("so-")).slice(0, 20)) {
  console.log(`${f.id}  ${f.unused.join(" ; ")}`);
}
console.log("\n=== NO-VERB (first 20) ===");
for (const f of flags.filter((x) => x.problems.includes("no-verb")).slice(0, 20)) {
  console.log(`${f.id}  ${f.verbless.join(" | ")}`);
}
