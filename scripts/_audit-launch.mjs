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
  /\b(heat|warm|preheat|toast|mix|stir|whisk|beat|fold|bake|roast|simmer|boil|brown|sear|saute|sauté|fry|grill|chop|dice|slice|cut|mince|add|pour|drain|pat|salt|season|cover|rest|serve|plate|spoon|spread|brush|toss|combine|blend|mash|roll|knead|steam|rub|stuff|fill|layer|top|finish|grate|squeeze|taste|remove|return|transfer|flip|turn|strain|chill|soak|marinate|reduce|sprinkle|coat|dip|broil|blanch|peel|rinse|set|put|place|drop|press|shape|form|cook|melt|wrap|scatter|drizzle|reheat|keep|pack|line|lift|discard|prick|dissolve|cream|sift|whip|baste|carve|glaze|steep|frost|juice|zest|halve|pull|flatten|score|tie|lock|nestle|deglaze|thicken|dredge|skewer|simmer)\b/i;

const STOP = new Set([
  "fresh","ground","dried","white","black","green","whole","juice","kosher",
  "large","small","hot","cold","chopped","sliced","minced","cooked","raw",
  "unsalted","salted","extra","virgin","olive","the","and","or","of","a","an",
]);

function tokens(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

const flags = [];
let shortStep = 0;
let thin = 0;
let noVerb = 0;
let unused2 = 0;
let vague = 0;
let junkPhrase = 0;
let noFood = 0;

for (const r of recipes) {
  const problems = [];
  const short = r.steps.filter((s) => s.length < 36);
  const noV = r.steps.filter((s) => !VERB.test(s));
  if (short.length) {
    problems.push("short-step");
    shortStep++;
  }
  if (r.steps.length < 3) {
    problems.push("thin");
    thin++;
  }
  if (noV.length) {
    problems.push("no-verb");
    noVerb++;
  }
  const blob = r.steps.join(" ");
  if (/\b(the the|main ingredient|gravy from the drippings|^potatoes\.?$|taste for salt\.?$)/i.test(blob)) {
    problems.push("junk-phrase");
    junkPhrase++;
  }
  if (/\b(a splash of|a little|a bit of)\b/i.test(blob) && r.ingredients.some((i) => /cup|tbsp|tsp|oz|lb/.test(i.unit || "") && Number(i.qty) >= 0.25 && /water|milk|broth|stock|oil/.test(i.name))) {
    const splashOfListed = r.ingredients.some((i) => {
      const t = tokens(i.name)[0];
      return t && new RegExp(`(splash|a little|a bit of)\\s+(?:of\\s+)?(?:the\\s+)?${t}`, "i").test(blob);
    });
    if (splashOfListed) {
      problems.push("vague-qty");
      vague++;
    }
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
  const foodHit = r.ingredients.some((i) => {
    const n = i.name.toLowerCase();
    const toks = tokens(i.name);
    return blob.toLowerCase().includes(n) || toks.some((t) => t.length > 3 && blob.toLowerCase().includes(t));
  });
  if (!foodHit) {
    problems.push("no-food");
    noFood++;
  }
  if (problems.length) {
    flags.push({
      id: r.id,
      name: r.name,
      pack: r.pack,
      tags: (r.tags ?? []).slice(0, 6),
      problems,
      unused: unused.slice(0, 6),
      short,
      noV,
      ings: r.ingredients.map((i) => `${i.qty} ${i.unit} ${i.name}`.trim()),
      steps: r.steps,
    });
  }
}

const byProblem = {};
for (const f of flags) {
  for (const p of f.problems) {
    byProblem[p] = (byProblem[p] || 0) + 1;
  }
}

writeFileSync("/tmp/launch-flags.json", JSON.stringify({ total: recipes.length, flagged: flags.length, byProblem, flags }, null, 2));

console.log("total", recipes.length);
console.log("flagged", flags.length);
console.log("byProblem", JSON.stringify(byProblem));
console.log("\n=== SHORT / NO-VERB / THIN (first 60) ===");
const broken = flags.filter((f) => f.problems.some((p) => ["short-step", "no-verb", "thin", "junk-phrase", "no-food"].includes(p)));
console.log("broken count", broken.length);
for (const f of broken.slice(0, 60)) {
  console.log(`\n${f.id}  ${f.name}  [${f.problems.join(",")}]`);
  console.log("  STP", f.steps.map((s) => s.length < 80 ? s : s.slice(0, 77) + "…").join(" / "));
}
