// Dumps every shipped recipe as compact JSON, batched for review.
// Batches are ordered by risk: recipes whose method was generated at runtime
// (thin authored steps) come first, since that is where the known failures are.
import { createServer } from "vite";
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = process.argv[2] || "/tmp/recipe-batches";
const SIZE = Number(process.argv[3] || 40);

const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
const { RECIPES } = await server.ssrLoadModule("/src/lib/recipes.ts");

const CATALOGS = [
  ["catalog-breakfast", "BREAKFAST_RECIPES"],
  ["catalog-desserts", "DESSERT_RECIPES"],
  ["catalog-expand", "EXPAND_RECIPES"],
  ["catalog-extra", "EXTRA_RECIPES"],
  ["catalog-places", "PLACE_RECIPES"],
  ["catalog-sauces", "SAUCE_RECIPES"],
  ["catalog-southern", "SOUTHERN_RECIPES"],
  ["catalog-world", "WORLD_RECIPES"],
  ["catalog-plus", "PLUS_RECIPES"],
  ["catalog-more", "MORE_RECIPES"],
  ["catalog-classics", "CLASSIC_RECIPES"],
  ["catalog-wartime", "WARTIME_RECIPES"],
  ["catalog-heritage", "HERITAGE_RECIPES"],
  ["catalog-books", "BOOK_RECIPES"],
  ["catalog-table", "TABLE_RECIPES"],
  ["catalog-sweet", "SWEET_ERA_RECIPES"],
];

const authored = new Map();
for (const [file, name] of CATALOGS) {
  const mod = await server.ssrLoadModule(`/src/lib/${file}.ts`);
  for (const r of mod[name] ?? []) authored.set(r.id, { file, steps: r.steps ?? [] });
}
await server.close();

const rows = RECIPES.map((r) => {
  const a = authored.get(r.id);
  return {
    id: r.id,
    name: r.name,
    file: a?.file ?? "recipes",
    servings: r.servings,
    minutes: r.minutes,
    ing: r.ingredients.map((i) => `${i.qty || ""} ${i.unit || ""} ${i.name}`.replace(/\s+/g, " ").trim()),
    steps: r.steps,
    gen: (a?.steps.length ?? 0) < 3,
  };
});

rows.sort((a, b) => (a.gen === b.gen ? a.id.localeCompare(b.id) : a.gen ? -1 : 1));

mkdirSync(OUT, { recursive: true });
const batches = [];
for (let i = 0; i < rows.length; i += SIZE) batches.push(rows.slice(i, i + SIZE));
batches.forEach((batch, i) => {
  const n = String(i + 1).padStart(3, "0");
  writeFileSync(`${OUT}/batch-${n}.json`, JSON.stringify(batch.map(({ gen, file, ...rest }) => rest), null, 1));
});

console.log(
  JSON.stringify({
    total: rows.length,
    generated: rows.filter((r) => r.gen).length,
    batches: batches.length,
    size: SIZE,
    out: OUT,
  }),
);
