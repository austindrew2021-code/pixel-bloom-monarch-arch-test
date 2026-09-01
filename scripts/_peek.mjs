import { createServer } from "vite";
const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
const { RECIPES } = await server.ssrLoadModule("/src/lib/recipes.ts");
await server.close();
const ids = process.argv.slice(2);
for (const id of ids) {
  const r = RECIPES.find((x) => x.id === id);
  if (!r) { console.log("MISSING", id); continue; }
  console.log("###", r.id, "|", r.name);
  console.log("ING:", r.ingredients.map((i) => `${i.qty||""} ${i.unit||""} ${i.name}`.trim()).join(" ; "));
  r.steps.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
  console.log();
}
