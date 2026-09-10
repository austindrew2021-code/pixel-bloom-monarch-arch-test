// Pair a shipped recipe against the passage in the book it credits.
//
// The verification pass (docs/source-verification.md) reads each of the 466
// sourced recipes against its book. This is the tool that puts the two side by
// side. It lives in the repo rather than a scratch directory because the pass
// runs across many sessions and re-deriving it each time wastes the budget.
//
//   node --experimental-strip-types scripts/source-check.mjs <book.txt> <id>...
//
// Fetch the book text first. Use the CANONICAL archive.org URL — the
// ia###### mirror nodes truncate near 100 KB, silently:
//
//   https://archive.org/download/<archiveId>/<archiveId>_djvu.txt
//
// then normalise the doubled OCR spacing:
//
//   perl -pe 's/[ \t]+/ /g' raw.txt > book.txt
//
// Project Gutenberg text is human-proofread and needs no normalising.
import fs from "node:fs";
import { RECIPES } from "../src/lib/recipes.ts";

const [bookPath, ...ids] = process.argv.slice(2);
if (!bookPath || !ids.length) {
  console.error("usage: source-check.mjs <book.txt> <recipe-id>...");
  process.exit(1);
}
const BOOK = fs.readFileSync(bookPath, "utf8").split("\n");
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const HAY = BOOK.map(norm);

/** Lines that look like the book's own heading for this recipe. */
function locate(phrase, floor) {
  const words = norm(phrase).split(" ").filter((w) => w.length > 3);
  if (!words.length) return [];
  const hits = [];
  for (let i = floor; i < HAY.length; i++) {
    const line = HAY[i];
    if (!line || line.length > 60) continue;      // headings are short
    if (/\d\s*$/.test(BOOK[i])) continue;         // index rows end in a page number
    if (words.every((w) => line.includes(w))) hits.push([i, line.length]);
  }
  return hits.sort((a, b) => a[1] - b[1]).map(([i]) => i);
}

for (const id of ids) {
  const r = RECIPES.find((x) => x.id === id);
  console.log(`\n${"=".repeat(70)}\n### ${id} — ${r?.name ?? "NOT FOUND"}`);
  if (!r) continue;
  console.log(`OURS (${r.minutes} min, serves ${r.servings})`);
  console.log("  " + r.ingredients.map((i) => `${i.qty ?? ""}${i.unit ? " " + i.unit : ""} ${i.name}`.trim()).join(" | "));
  r.steps.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
  // Our display names are modernised; the ids preserve the book's headings.
  const slug = id.replace(/^[a-z]{2,3}-/, "").replace(/-/g, " ");
  const floor = Number(process.env.BODY_FROM ?? 900);   // skip the index
  const hits = locate(r.name, floor).concat(locate(slug, floor));
  if (!hits.length) { console.log("--- SOURCE: no heading matched, search the text by hand"); continue; }
  for (const at of [...new Set(hits)].slice(0, 2)) {
    console.log(`--- SOURCE @ line ${at + 1}:`);
    console.log(BOOK.slice(at, at + 26).map((l) => "    " + l).join("\n"));
  }
}
