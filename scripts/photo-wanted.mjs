#!/usr/bin/env node
/**
 * Writes the list of dishes still waiting on a photograph.
 *
 * The app never illustrates a dish with a photograph of a different dish, so
 * these show the drawn plate instead. Dropping `public/food/<id>.jpg` in and
 * running `npm run photos` is the whole job — the manifest picks the file up
 * and the card switches to the photograph.
 *
 * Usage: npm run photos:wanted   ->  photos-wanted.csv
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { RECIPES } from "../src/lib/recipes.ts";
import { dishesWithoutPhotos } from "../src/lib/food-photos.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const cell = (v) => (/[",\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v);
const rows = dishesWithoutPhotos(RECIPES);
const csv = [
  "file,dish,search,description",
  ...rows.map((r) => [r.wants, r.name, r.search, r.description].map(cell).join(",")),
].join("\n");
writeFileSync(join(ROOT, "photos-wanted.csv"), csv + "\n");
console.log(`[photos] ${rows.length} of ${RECIPES.length} dishes still want a photograph -> photos-wanted.csv`);
