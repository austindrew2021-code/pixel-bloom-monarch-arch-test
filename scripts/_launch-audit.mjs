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
  /\b(heat|warm|preheat|toast|mix|stir|whisk|beat|fold|bake|roast|simmer|boil|brown|sear|saute|sauté|fry|grill|chop|dice|slice|cut|mince|add|pour|drain|pat|salt|season|cover|rest|serve|plate|spoon|spread|brush|toss|combine|blend|mash|roll|knead|steam|rub|stuff|fill|layer|top|finish|grate|squeeze|taste|remove|return|transfer|flip|turn|chill|soak|marinate|reduce|sprinkle|dust|coat|broil|blanch|peel|rinse|set|put|place|drop|press|shape|cook|melt|wrap|scatter|drizzle|whip|sift|carve|glaze|steep|frost|juice|zest|pull|lock|flatten|score|tie|baste|ladle|dot|wilt|bloom|crack|halve|cube|discard|skewer|simmer|poach|dredge|mash|simmer)\b/i;

const GARBLED =
  /\b(the the|main ingredient|any remaining vegetables|add the fold|cook 500|serve with egg|gravy from the drippings|^potatoes\.?$|flip \d+ with|taste for salt\.?$|the the )\b/i;

const STOP = new Set([
  "fresh", "ground", "dried", "white", "black", "green", "whole", "juice", "kosher",
  "large", "small", "hot", "cold", "chopped", "sliced", "minced", "cooked", "raw",
  "unsalted", "salted", "extra", "virgin", "olive", "the", "and", "or", "of",
]);

function tokens(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

const flags = [];
let thin = 0;
let shortStep = 0;
let noVerb = 0;
let garbled = 0;
let unused2 = 0;
let usableOk = 0;

for (const r of recipes) {
  const problems = [];
  const blob = r.steps.join("\n");
  const short = r.steps.filter((s) => s.length < 36);
  const verbless = r.steps.filter((s) => s.length >= 12 && !VERB.test(s));
  if (r.steps.length < 3) {
    problems.push("thin");
    thin++;
  }
  if (short.length) {
    problems.push("short-step");
    shortStep++;
  }
  if (verbless.length) {
    problems.push("no-verb");
    noVerb++;
  }
  if (GARBLED.test(blob) || r.steps.some((s) => /^[A-Z][a-z]{2,12}\.$/.test(s.trim()))) {
    problems.push("garbled");
    garbled++;
  }
  const unused = [];
  for (const ing of r.ingredients) {
    const n = ing.name.toLowerCase();
    if (/^(kosher salt|salt|black pepper|pepper|oil|olive oil|water|ice)$/i.test(n)) continue;
    const toks = tokens(ing.name);
    const mentioned = blob.toLowerCase().includes(n) || toks.some((t) => t.length > 3 && blob.toLowerCase().includes(t));
    if (!mentioned) unused.push(`${ing.qty} ${ing.unit} ${ing.name}`.trim());
  }
  if (unused.length >= 2) {
    problems.push("unused-ings");
    unused2++;
  }
  const usable = r.steps.filter((s) => s.length >= 36 && VERB.test(s)).length;
  if (usable >= 3 && !problems.includes("garbled")) usableOk++;
  if (problems.length) {
    flags.push({
      id: r.id,
      name: r.name,
      pack: r.pack,
      plate: r.plate,
      problems,
      unused: unused.slice(0, 6),
      short: short.slice(0, 4),
      verbless: verbless.slice(0, 4),
      steps: r.steps,
    });
  }
}

const byProblem = {};
for (const f of flags) {
  for (const p of f.problems) byProblem[p] = (byProblem[p] ?? 0) + 1;
}

const sample = {
  garbled: flags.filter((f) => f.problems.includes("garbled")).slice(0, 25),
  thin: flags.filter((f) => f.problems.includes("thin")).slice(0, 15),
  short: flags.filter((f) => f.problems.includes("short-step") && !f.problems.includes("garbled")).slice(0, 20),
  unused: flags.filter((f) => f.problems.includes("unused-ings")).slice(0, 15),
};

writeFileSync("/tmp/launch-audit.json", JSON.stringify({ total: recipes.length, usableOk, thin, shortStep, noVerb, garbled, unused2, byProblem, flags }, null, 2));

console.log(JSON.stringify({ total: recipes.length, usableOk, thin, shortStep, noVerb, garbled, unused2, byProblem }, null, 2));
console.log("\n=== GARBLED (first 20) ===");
for (const f of sample.garbled) {
  console.log(`\n${f.id}  ${f.name}`);
  console.log("  ", f.steps.join(" / ").slice(0, 280));
}
console.log("\n=== THIN (first 12) ===");
for (const f of sample.thin) {
  console.log(`${f.id}  ${f.name}  (${f.steps.length} steps)  ${f.steps.join(" / ").slice(0, 160)}`);
}
console.log("\n=== SHORT STEPS not garbled (first 15) ===");
for (const f of sample.short) {
  console.log(`${f.id}  ${f.name}`);
  console.log("  SHORT", f.short.join(" | "));
}
