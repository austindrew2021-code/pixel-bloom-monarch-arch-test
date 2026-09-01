#!/usr/bin/env node
/**
 * Derives the app's full training catalog from exercises/data/exercises.json
 * (1,324 exercises, 10 languages, ~27MB) and writes a lean, English-only,
 * engine-ready dataset to src/lib/generated/exercise-db.json — bundled
 * directly into the app (no runtime fetch) so src/lib/lift.ts and
 * src/lib/exercises.ts can build their catalogs synchronously, the same way
 * they did from the old hand-authored move list.
 *
 * Image/gif paths are rewritten to public/exercise-db/{images,videos}, which
 * scripts/build-exercise-db.mjs does NOT populate — that's a one-time
 * `cp -r exercises/{images,videos} public/exercise-db/` (already done; see
 * git history). Re-run this script after updating exercises/data/exercises.json.
 *
 *   node scripts/build-exercise-db.mjs
 *
 * Every field below the raw dataset fields (split, primary/secondary muscle
 * ids, romM, bar, bodyweight, unilateral, holdBased, defaultSets/Reps/rest)
 * is a heuristic derived from category/target/equipment/name — there is no
 * per-exercise ground truth for these in the source dataset, so treat them
 * as reasonable defaults, not hand-verified facts. Sets/reps stay editable
 * per exercise in the app regardless.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = join(ROOT, "exercises/data/exercises.json");
const OUT = join(ROOT, "src/lib/generated/exercise-db.json");

// ---- target (primary muscle) -> MuscleId -----------------------------

const DELT_REAR = /\brear\b|\breverse\b|\bposterior\b|\bface pull/i;
const DELT_SIDE = /\blateral\b|\bside\b/i;
const DELT_FRONT = /\bfront\b/i;

function deltVariant(name) {
  if (DELT_REAR.test(name)) return "rear-delts";
  if (DELT_SIDE.test(name)) return "side-delts";
  if (DELT_FRONT.test(name)) return "front-delts";
  return "front-delts"; // presses/generic shoulder work default to front-delt dominant
}

function primaryMuscleId(record) {
  const { target, muscle_group: muscleGroup, name } = record;
  switch (target) {
    case "pectorals":
      return "chest";
    case "delts":
      return deltVariant(name);
    case "biceps":
      return "biceps";
    case "triceps":
      return "triceps";
    case "forearms":
      return "forearms";
    case "traps":
      return "traps";
    case "lats":
      return "lats";
    case "upper back":
      return "upper-back";
    case "spine":
      return "lower-back";
    case "abs":
      return muscleGroup === "obliques" ? "obliques" : "abs";
    case "glutes":
      return "glutes";
    case "quads":
      return "quads";
    case "hamstrings":
      return "hamstrings";
    case "calves":
      return "calves";
    case "adductors":
      return "adductors";
    case "abductors":
      return "glutes";
    case "serratus anterior":
      return "obliques";
    case "levator scapulae":
      return "traps";
    case "cardiovascular system":
      return null;
    default:
      return null;
  }
}

// secondary_muscles free-text -> MuscleId (unmapped entries are dropped,
// same defensive tolerance the old hand-authored META relied on).
const SECONDARY_MAP = {
  abdominals: "abs",
  back: "upper-back",
  biceps: "biceps",
  brachialis: "biceps",
  calves: "calves",
  chest: "chest",
  core: "abs",
  deltoids: "side-delts",
  forearms: "forearms",
  glutes: "glutes",
  "grip muscles": "forearms",
  groin: "adductors",
  hamstrings: "hamstrings",
  "inner thighs": "adductors",
  "latissimus dorsi": "lats",
  lats: "lats",
  "lower abs": "abs",
  "lower back": "lower-back",
  obliques: "obliques",
  quadriceps: "quads",
  "rear deltoids": "rear-delts",
  rhomboids: "upper-back",
  shoulders: "side-delts",
  soleus: "calves",
  trapezius: "traps",
  traps: "traps",
  triceps: "triceps",
  "upper back": "upper-back",
  "upper chest": "chest",
  "wrist extensors": "forearms",
  "wrist flexors": "forearms",
};

// ---- category (+ target for the mixed "upper arms" bucket) -> split ---

function splitFor(category, target) {
  if (category === "chest" || category === "shoulders") return "push";
  if (category === "upper arms") return target === "triceps" ? "push" : "pull";
  if (category === "lower arms" || category === "neck") return "pull";
  if (category === "back") return target === "spine" ? "legs" : "pull";
  if (category === "upper legs" || category === "lower legs") return "legs";
  if (category === "waist") return "core";
  return "full"; // cardio
}

// ---- equipment -> loadable-barbell / no-equipment flags ---------------

const BAR_EQUIPMENT = new Set(["barbell", "ez barbell", "olympic barbell", "trap bar"]);

// ---- category -> default sets/reps/rest/romM baseline ------------------

const CATEGORY_DEFAULTS = {
  chest: { sets: 3, reps: "8-12", restSec: 90, romM: 0.4 },
  back: { sets: 3, reps: "8-12", restSec: 90, romM: 0.45 },
  shoulders: { sets: 3, reps: "10-12", restSec: 75, romM: 0.4 },
  "upper arms": { sets: 3, reps: "10-12", restSec: 60, romM: 0.35 },
  "lower arms": { sets: 3, reps: "12-15", restSec: 45, romM: 0.3 },
  "upper legs": { sets: 4, reps: "8-10", restSec: 120, romM: 0.55 },
  "lower legs": { sets: 3, reps: "12-15", restSec: 60, romM: 0.2 },
  waist: { sets: 3, reps: "12-15", restSec: 45, romM: 0.3 },
  cardio: { sets: 1, reps: "15-20m", restSec: 0, romM: 0.4 },
  neck: { sets: 2, reps: "12-15", restSec: 45, romM: 0.2 },
};

// Passive stretches/mobility drills/yoga holds: real catalog entries, but not
// something an auto-built strength session should ever pick as a "4x6-8"
// working set.
const STRETCH_RE = /\bstretch\b|\bstretching\b|foam roll|self myofascial|\bpose\b|\byoga\b/i;

const UNILATERAL_RE = /\bsingle\b|\bone arm\b|\bone-arm\b|\bone leg\b|\bone-leg\b|\balternat/i;
const HOLD_RE =
  /\bplank\b|\bhold\b|\bdead hang\b|\bhollow\b|\bwall sit\b|\bl-sit\b|\bflutter kick\b|\bmountain climber|\bhigh knee|\bjumping jack|\bjump rope|\bburpee/i;
const DISTANCE_RE = /\bcarry\b|\bcarries\b/i;

function logUnit(name, holdBased) {
  if (DISTANCE_RE.test(name)) return "m";
  if (holdBased) return "sec";
  return "reps";
}

function deriveTiming(category, equipment) {
  const base = CATEGORY_DEFAULTS[category] ?? CATEGORY_DEFAULTS.waist;
  if (!BAR_EQUIPMENT.has(equipment)) return { ...base };
  return {
    sets: Math.min(4, base.sets + 1),
    reps: "6-8",
    restSec: base.restSec + 30,
    romM: base.romM,
  };
}

function titleCase(name) {
  return name.replace(/\b\w/g, (c) => c.toUpperCase());
}

function trim(record) {
  const { id, name, category, target, muscle_group: muscleGroup, secondary_muscles: secondaryRaw, equipment } = record;
  const primary = primaryMuscleId(record);
  const secondary = [
    ...new Set(
      (secondaryRaw ?? [])
        .map((s) => SECONDARY_MAP[s])
        .filter((id) => id && id !== primary),
    ),
  ];
  const timing = deriveTiming(category, equipment);
  const bodyweight = equipment === "body weight";
  const holdBased = category === "cardio" || HOLD_RE.test(name);

  return {
    id,
    name: titleCase(name),
    category,
    target,
    muscleGroup,
    equipment,
    split: splitFor(category, target),
    primary: primary ? [primary] : [],
    secondary,
    bar: BAR_EQUIPMENT.has(equipment),
    bodyweight,
    unilateral: UNILATERAL_RE.test(name),
    holdBased,
    isStretch: STRETCH_RE.test(name),
    logUnit: logUnit(name, holdBased),
    defaultSets: timing.sets,
    defaultReps: timing.reps,
    restSec: timing.restSec,
    romM: timing.romM,
    steps: record.instruction_steps?.en ?? [],
    image: `/exercise-db/images/${record.image.split("/").pop()}`,
    gif: `/exercise-db/videos/${record.gif_url.split("/").pop()}`,
  };
}

function build() {
  const source = JSON.parse(readFileSync(SOURCE, "utf8"));
  const trimmed = source.map(trim);
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(trimmed));
  console.log(`[build-exercise-db] wrote ${trimmed.length} exercises to ${OUT}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  build();
}

export { build, trim, primaryMuscleId, splitFor, deriveTiming };
