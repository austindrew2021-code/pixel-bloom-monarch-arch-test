// Rewrites every catalog recipe's nutrition from its ingredient rows.
//   node --experimental-strip-types scripts/recompute-nutrition.mjs
// Run it after changing an ingredient list or the composition table in
// src/lib/food-energy.ts. `food-energy.test.ts` fails if a stored figure and
// the computed one ever disagree, so this is the only way they should change.
// Some catalog lines carry more than one recipe, so line-at-a-time rewriting
// only ever reached the first. Work on the whole file, keyed on each id's
// position, and only touch a literal that falls before the next recipe starts.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { RECIPES } from "../src/lib/recipes.ts";
import { fromIngredients } from "../src/lib/food-energy.ts";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "lib");
const files = [...readdirSync(dir).filter((f) => /^catalog-.*\.ts$/.test(f) && f !== "catalog-kit.ts"), "recipes.ts"];
const want = new Map();
for (const r of RECIPES) want.set(r.id, fromIngredients(r).nutrition);
const NUT = /\{\s*cal:\s*-?[\d.]+\s*,\s*protein:\s*-?[\d.]+\s*,\s*carbs:\s*-?[\d.]+\s*,\s*fat:\s*-?[\d.]+\s*\}/g;
// `I("marinara", ...)` names an ingredient that is also a recipe id, and
// treating it as the next recipe cut sixteen slices short of their nutrition.
const START = /\b(\w+)\(\s*"([a-z0-9-]+)"\s*,/g;

let changed = 0;
for (const file of files) {
  const path = `${dir}/${file}`;
  let text = readFileSync(path, "utf8");

  // Object-literal recipes, whose nutrition is a field rather than an argument.
  // recipes.ts writes it as a four-line block; the catalogs write it inline.
  {
    const lines = text.split("\n");
    let id = null;
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^\s*id:\s*"([a-z0-9-]+)",?\s*$/);
      if (m) { id = m[1]; continue; }
      if (!id) continue;
      const n = want.get(id);
      if (!n) continue;
      const inline = lines[i].match(/^(\s*)nutrition:\s*\{[^{}]*\}(,?)\s*$/);
      if (inline) {
        lines[i] = `${inline[1]}nutrition: { cal: ${n.cal}, protein: ${n.protein}, carbs: ${n.carbs}, fat: ${n.fat} }${inline[2]}`;
        id = null; continue;
      }
      if (!/^\s*nutrition:\s*\{\s*$/.test(lines[i])) continue;
      const fields = ["cal", "protein", "carbs", "fat"];
      const ok = fields.every((f, k) => new RegExp(`^\\s*${f}:\\s*-?[\\d.]+,?\\s*$`).test(lines[i + 1 + k] ?? ""));
      if (ok) {
        const indent = lines[i + 1].match(/^\s*/)[0];
        fields.forEach((f, k) => { lines[i + 1 + k] = `${indent}${f}: ${n[f]}${k < 3 ? "," : ""}`; });
      }
      id = null;
    }
    text = lines.join("\n");
  }
  const starts = [...text.matchAll(START)].filter((m) => m[1] !== "I" && want.has(m[2]));
  // Rewrite back-to-front so earlier offsets stay valid.
  for (let i = starts.length - 1; i >= 0; i--) {
    const from = starts[i].index + starts[i][0].length;
    const to = i + 1 < starts.length ? starts[i + 1].index : text.length;
    const slice = text.slice(from, to);
    NUT.lastIndex = 0;
    const hit = NUT.exec(slice);
    if (!hit) continue;
    const n = want.get(starts[i][2]);
    const lit = `{ cal: ${n.cal}, protein: ${n.protein}, carbs: ${n.carbs}, fat: ${n.fat} }`;
    if (hit[0] === lit) continue;
    text = text.slice(0, from + hit.index) + lit + text.slice(from + hit.index + hit[0].length);
    changed++;
  }
  writeFileSync(path, text);
}
console.log(`rewrote ${changed}`);
