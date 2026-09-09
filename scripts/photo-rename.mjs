#!/usr/bin/env node
/**
 * Renames downloaded photos from their search phrase to their recipe id.
 *
 * `photos-wanted.csv` gives a search phrase per dish so a sourcing pass has
 * something better than the title to match on. Downloaders tend to save the
 * file under the query they ran, which leaves names like
 * `african-chicken-yassa-cooked-dish-chicken-pieces-onion-lemon-food-photograph.jpg`.
 * The app keys photos by recipe id — `ac-yassa.jpg` — so a file named anything
 * else is invisible no matter how good the picture is.
 *
 * The CSV holds both halves, so this is an exact lookup rather than a guess:
 * slugify the `search` column the same way the downloader did, and the `file`
 * column says what the result should be called.
 *
 * Renaming to a slug of the DISH TITLE does not work: "Skillet cornbread" is
 * `hm-cornbread`, not `skillet-cornbread`. Only the id matches.
 *
 * Usage: npm run photos:rename [-- --dry-run]
 */
import { existsSync, readFileSync, readdirSync, renameSync } from "node:fs";
import { dirname, join, parse } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = join(ROOT, "public/food");
const dryRun = process.argv.includes("--dry-run");

/** Matches Python's `re.sub(r'[^\w\s-]', ...)`, whose \w is Unicode-aware. */
export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_\s-]/gu, "")
    .replace(/[-\s]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** A CSV row reader that respects quoted cells. */
export function readCsv(text) {
  const [head, ...lines] = text.trim().split("\n");
  const cols = head.split(",");
  return lines.map((line) => {
    const cells = [];
    let cur = "";
    let quoted = false;
    for (const ch of line) {
      if (ch === '"') quoted = !quoted;
      else if (ch === "," && !quoted) { cells.push(cur); cur = ""; }
      else cur += ch;
    }
    cells.push(cur);
    return Object.fromEntries(cols.map((c, i) => [c, cells[i] ?? ""]));
  });
}

const rows = readCsv(readFileSync(join(ROOT, "photos-wanted.csv"), "utf8"));
const idBySearch = new Map(
  rows.map((r) => [slugify(r.search), parse(r.file).name]),
);

let renamed = 0;
const clashes = [];
const unknown = [];
for (const file of readdirSync(DIR)) {
  const { name, ext } = parse(file);
  if (!/^\.(jpg|jpeg|png|webp|avif)$/i.test(ext)) continue;
  const id = idBySearch.get(name);
  if (!id || id === name) continue;
  const target = `${id}${ext.toLowerCase()}`;
  if (existsSync(join(DIR, target))) { clashes.push(`${file} -> ${target} (already there)`); continue; }
  if (!dryRun) renameSync(join(DIR, file), join(DIR, target));
  renamed++;
}
// Anything left with a search-phrase-shaped name did not come from the CSV.
for (const file of readdirSync(DIR)) {
  const { name, ext } = parse(file);
  if (!/^\.(jpg|jpeg|png|webp|avif)$/i.test(ext)) continue;
  if (name.length > 40 && !idBySearch.has(name)) unknown.push(file);
}

console.log(`[photos] ${dryRun ? "would rename" : "renamed"} ${renamed} files to their recipe id`);
if (clashes.length) console.log(`[photos] ${clashes.length} skipped, a file already had that id:\n  ` + clashes.slice(0, 10).join("\n  "));
if (unknown.length) console.log(`[photos] ${unknown.length} long names matched no search phrase:\n  ` + unknown.slice(0, 10).join("\n  "));
