/**
 * Reference library of 1,324 exercises (name, target muscles, step-by-step
 * instructions, thumbnail + form GIF) generated from exercises/data/exercises.json
 * by scripts/build-exercise-db.mjs into public/exercise-db/exercises.json.
 *
 * This is a separate browsing/reference catalog from src/lib/exercises.ts,
 * which drives session logging (sets/reps/rest, muscle recovery) for a
 * hand-tuned set of lift moves — the two aren't interchangeable.
 */

export type ExerciseDbRecord = {
  id: string;
  name: string;
  category: string;
  equipment: string;
  target: string;
  muscleGroup: string;
  secondaryMuscles: string[];
  steps: string[];
  image: string;
  gif: string;
};

/** Known categories from exercises/data/exercises.schema.json, in display order. */
export const EXERCISE_DB_CATEGORIES = [
  "chest",
  "back",
  "shoulders",
  "upper arms",
  "lower arms",
  "upper legs",
  "lower legs",
  "waist",
  "cardio",
  "neck",
] as const;

export function categoryLabel(category: string): string {
  return category.replace(/\b\w/g, (c) => c.toUpperCase());
}

let cache: Promise<ExerciseDbRecord[]> | null = null;

/** Fetches and caches the trimmed exercise database. Safe to call repeatedly. */
export function loadExerciseDb(): Promise<ExerciseDbRecord[]> {
  if (!cache) {
    cache = fetch("/exercise-db/exercises.json")
      .then((res) => {
        if (!res.ok) throw new Error(`exercise-db fetch failed: ${res.status}`);
        return res.json() as Promise<ExerciseDbRecord[]>;
      })
      .catch((err) => {
        cache = null;
        throw err;
      });
  }
  return cache;
}

export function searchExerciseDb(
  records: ExerciseDbRecord[],
  query: string,
  category: string | "all",
): ExerciseDbRecord[] {
  const q = query.trim().toLowerCase();
  return records.filter((r) => {
    if (category !== "all" && r.category !== category) return false;
    if (!q) return true;
    return (
      r.name.toLowerCase().includes(q) ||
      r.target.toLowerCase().includes(q) ||
      r.equipment.toLowerCase().includes(q) ||
      r.muscleGroup.toLowerCase().includes(q)
    );
  });
}
