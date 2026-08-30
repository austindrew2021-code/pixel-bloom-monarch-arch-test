import { createServer } from "vite";
import { writeFileSync } from "node:fs";

const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});
const recipesMod = await server.ssrLoadModule("/src/lib/recipes.ts");
const southernMod = await server.ssrLoadModule("/src/lib/catalog-southern.ts");
const wartimeMod = await server.ssrLoadModule("/src/lib/catalog-wartime.ts");
const heritageMod = await server.ssrLoadModule("/src/lib/catalog-heritage.ts");
const booksMod = await server.ssrLoadModule("/src/lib/catalog-books.ts");
const tableMod = await server.ssrLoadModule("/src/lib/catalog-table.ts");
const sweetMod = await server.ssrLoadModule("/src/lib/catalog-sweet.ts");
const classicMod = await server.ssrLoadModule("/src/lib/catalog-classics.ts");
const { polishSteps } = await server.ssrLoadModule("/src/lib/cook-steps.ts");
await server.close();

function pack(r, extra) {
  return {
    id: r.id,
    name: r.name,
    plate: r.plate,
    minutes: r.minutes,
    tags: r.tags,
    ingredients: r.ingredients.map((i) => `${i.qty} ${i.unit} ${i.name}`.trim()),
    src: r.steps,
    out: extra?.steps ?? polishSteps(r),
  };
}

const polished = recipesMod.RECIPES;
const byId = new Map(polished.map((r) => [r.id, r]));

const groups = {
  southern: southernMod.SOUTHERN_RECIPES,
  wartime: wartimeMod.WARTIME_RECIPES,
  heritage: heritageMod.HERITAGE_RECIPES,
  books: booksMod.BOOK_RECIPES,
  table: tableMod.TABLE_RECIPES,
  sweet: sweetMod.SWEET_ERA_RECIPES,
  classic: classicMod.CLASSIC_RECIPES,
};

const dump = {};
const flags = [];
for (const [g, list] of Object.entries(groups)) {
  dump[g] = list.map((r) => {
    const live = byId.get(r.id);
    const row = pack(r, live);
    const blob = row.out.join(" ");
    const problems = [];
    if (row.out.some((s) => /add the (do not|fold |hot oven|let |lay |cool and|strain and|bone and|rise,)/i.test(s))) problems.push("junk-add");
    if (row.out.some((s) => /^Cook \d{3}/i.test(s))) problems.push("cook-temp");
    if (row.out.some((s) => s.length < 28 && !/^(serve|drain|cool|chill|salt)\b/i.test(s))) problems.push("short");
    if (row.out.length < 3) problems.push("thin");
    if (/toast sandwich|lay the .+ on the white bread|rest of the list|ingredients on the list/i.test(blob)) problems.push("template");
    if (/baking powder/i.test(blob) && !r.ingredients.some((i) => /baking powder/i.test(i.name))) problems.push("invented-bp");
    // ingredient coverage: names mentioned
    const mentioned = r.ingredients.filter((i) => {
      const n = i.name.toLowerCase();
      const words = n.split(/\s+/).filter((w) => w.length > 3);
      return blob.toLowerCase().includes(n) || words.some((w) => blob.toLowerCase().includes(w));
    });
    if (mentioned.length < Math.min(2, r.ingredients.length) && r.ingredients.length >= 3) problems.push("few-ings");
    if (problems.length) flags.push({ g, id: r.id, name: r.name, problems, src: row.src, out: row.out });
    return row;
  });
}

writeFileSync("/tmp/book-dump.json", JSON.stringify(dump, null, 0));
writeFileSync("/tmp/book-flags.json", JSON.stringify(flags, null, 2));
console.log("groups", Object.fromEntries(Object.entries(dump).map(([k, v]) => [k, v.length])));
console.log("flags", flags.length);
const byP = {};
for (const f of flags) for (const p of f.problems) byP[p] = (byP[p] || 0) + 1;
console.log("by problem", byP);
console.log("\n--- SAMPLE FLAGS ---");
for (const f of flags.slice(0, 40)) {
  console.log(`\n${f.g} ${f.id} ${f.name} [${f.problems.join(",")}]`);
  console.log("SRC:", f.src.join(" | "));
  console.log("OUT:", f.out.join(" | "));
}
