import { createServer } from "vite";
import { writeFileSync } from "node:fs";

const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});
const recipesMod = await server.ssrLoadModule("/src/lib/recipes.ts");
await server.close();
const recipes = recipesMod.RECIPES;

const STOP = new Set([
  "fresh","ground","dried","white","black","green","whole","juice","kosher",
  "large","small","hot","cold","chopped","sliced","minced","cooked","raw",
  "unsalted","salted","extra","virgin","olive","the","and","or","of","a","an",
  "to","for","with","into","in","on","over","from","into","some","half",
]);

function tokens(name) {
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));
}

const vague = /\b(a splash of|a little|a bit of|some water|a dash of|a few)\b/i;
const flags = [];

for (const r of recipes) {
  const blob = r.steps.join(" ").toLowerCase();
  const problems = [];
  const unused = [];
  const vagueHits = [];
  for (const ing of r.ingredients) {
    const n = ing.name.toLowerCase();
    const toks = tokens(ing.name);
    const mentioned = blob.includes(n) || toks.some(t => t.length > 3 && blob.includes(t));
    // water / salt / pepper often implicit
    const skipUnused = /^(kosher salt|salt|black pepper|pepper|oil|olive oil|water|ice)$/i.test(n);
    if (!mentioned && !skipUnused) unused.push(`${ing.qty} ${ing.unit} ${ing.name}`.trim());
    if (mentioned && vague.test(blob)) {
      const unitAmt = `${ing.qty} ${ing.unit}`.trim();
      if (ing.qty && Number(ing.qty) >= 0.25 && /cup|cups|oz|lb|pint|quart|tbsp|tablespoon/.test(ing.unit||"")) {
        // if steps say splash/little of this ingredient
        const nameWord = toks.find(t => t.length > 3) || n;
        const splashOfThis = new RegExp(`(splash|a little|a bit of|some)\\s+(?:of\\s+)?(?:the\\s+)?${nameWord}`, "i");
        if (splashOfThis.test(blob) || (nameWord === "water" && /splash of (?:the )?(?:pasta )?water|a little water/.test(blob))) {
          vagueHits.push({ name: ing.name, qty: ing.qty, unit: ing.unit, phrase: (blob.match(splashOfThis)||blob.match(/a little water|splash of [^.]{0,20}/i)||[""])[0] });
        }
      }
    }
  }
  // splash of water when water is listed with cups
  const water = r.ingredients.find(i => /^water$|cold water|hot water|boiling water|pasta water/i.test(i.name));
  if (water && /splash of (?:the )?(?:pasta )?water|a little water|a bit of water/i.test(blob)) {
    if (!vagueHits.some(v => /water/i.test(v.name))) {
      vagueHits.push({ name: water.name, qty: water.qty, unit: water.unit, phrase: (blob.match(/a little water|splash of [^.]{0,24}/i)||["splash water"])[0] });
    }
  }
  if (unused.length) problems.push("unused-ings");
  if (vagueHits.length) problems.push("vague-qty");
  // telegraphic: any step under 20 without a verb-ish
  const short = r.steps.filter(s => s.length < 28);
  if (short.length) problems.push("short-step");
  if (r.steps.length < 3) problems.push("thin");
  if (problems.length) {
    flags.push({
      id: r.id, name: r.name, pack: r.pack, tags: r.tags, plate: r.plate,
      problems, unused: unused.slice(0, 8), vagueHits,
      ings: r.ingredients.map(i => `${i.qty} ${i.unit} ${i.name}`.trim()),
      steps: r.steps,
    });
  }
}

const vagueFlags = flags.filter(f => f.problems.includes("vague-qty"));
const unusedMany = flags.filter(f => f.unused.length >= 2 && f.problems.includes("unused-ings"));
writeFileSync("/tmp/ing-flags.json", JSON.stringify({ vagueFlags, unusedMany, all: flags }, null, 2));
console.log("total recipes", recipes.length);
console.log("flagged", flags.length);
console.log("vague-qty", vagueFlags.length);
console.log("unused 2+", unusedMany.length);
console.log("\n=== VAGUE QTY (splash/little vs listed amount) ===");
for (const f of vagueFlags) {
  console.log(`\n${f.id}  ${f.name}`);
  console.log("  ING", f.ings.join(" | "));
  console.log("  HIT", JSON.stringify(f.vagueHits));
  console.log("  STP", f.steps.join(" / "));
}
