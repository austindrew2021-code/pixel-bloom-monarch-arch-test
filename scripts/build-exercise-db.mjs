#!/usr/bin/env node
/**
 * Trims exercises/data/exercises.json (1,324 records × 10 languages, ~27MB)
 * down to what the app's exercise browser actually renders — English steps
 * only, image/gif paths rewritten to the public/exercise-db copies made by
 * `cp -r exercises/{images,videos} public/exercise-db/` — and writes the
 * result to public/exercise-db/exercises.json for the client to fetch.
 *
 *   node scripts/build-exercise-db.mjs
 *
 * Re-run this after updating exercises/data/exercises.json or re-syncing
 * public/exercise-db/{images,videos} from the exercises/ dataset.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = join(ROOT, "exercises/data/exercises.json");
const OUT = join(ROOT, "public/exercise-db/exercises.json");

function rewritePath(relPath) {
  // "images/ex_0001.jpg" / "videos/ex_0001.gif" -> "/exercise-db/images/ex_0001.jpg"
  return `/exercise-db/${relPath}`;
}

function trim(record) {
  return {
    id: record.id,
    name: record.name,
    category: record.category,
    equipment: record.equipment,
    target: record.target,
    muscleGroup: record.muscle_group,
    secondaryMuscles: record.secondary_muscles ?? [],
    steps: record.instruction_steps?.en ?? [],
    image: rewritePath(record.image),
    gif: rewritePath(record.gif_url),
  };
}

function build() {
  const source = JSON.parse(readFileSync(SOURCE, "utf8"));
  const trimmed = source.map(trim);
  writeFileSync(OUT, JSON.stringify(trimmed));
  console.log(`[build-exercise-db] wrote ${trimmed.length} exercises to ${OUT}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  build();
}

export { build, trim };
