/**
 * Exercise library: the full training catalog (1,324 exercises), derived
 * from exercises/data/exercises.json by scripts/build-exercise-db.mjs, with
 * muscle/equipment/timing metadata layered on top of the shared lift catalog.
 */

import EXERCISE_DB from "./generated/exercise-db.json" with { type: "json" };
import { LIFT_MOVES, type LiftMove, type LiftSession, type Muscle } from "./lift.ts";

export type MuscleId =
  | "chest"
  | "front-delts"
  | "side-delts"
  | "rear-delts"
  | "biceps"
  | "triceps"
  | "forearms"
  | "traps"
  | "lats"
  | "upper-back"
  | "lower-back"
  | "abs"
  | "obliques"
  | "glutes"
  | "quads"
  | "hamstrings"
  | "calves"
  | "adductors";

export type Equipment = string;

export const MUSCLE_LABEL: Record<MuscleId, string> = {
  chest: "Chest",
  "front-delts": "Front delts",
  "side-delts": "Side delts",
  "rear-delts": "Rear delts",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Forearms",
  traps: "Traps",
  lats: "Lats",
  "upper-back": "Upper back",
  "lower-back": "Lower back",
  abs: "Abs",
  obliques: "Obliques",
  glutes: "Glutes",
  quads: "Quads",
  hamstrings: "Hamstrings",
  calves: "Calves",
  adductors: "Adductors",
};

export const MUSCLE_VIEW: Record<MuscleId, "front" | "back" | "both"> = {
  chest: "front",
  "front-delts": "front",
  "side-delts": "both",
  "rear-delts": "back",
  biceps: "front",
  triceps: "back",
  forearms: "both",
  traps: "back",
  lats: "back",
  "upper-back": "back",
  "lower-back": "back",
  abs: "front",
  obliques: "front",
  glutes: "back",
  quads: "front",
  hamstrings: "back",
  calves: "back",
  adductors: "front",
};

export type Exercise = LiftMove & {
  category: string;
  target: string;
  primary: MuscleId[];
  secondary: MuscleId[];
  equipment: Equipment;
  steps: string[];
  image: string;
  gif: string;
  defaultSets: number;
  defaultReps: string;
  restSec: number;
  /** A passive stretch/mobility drill — real catalog entry, but never picked as a working set. */
  isStretch: boolean;
  /** 0–5: how heavy and multi-joint the movement is. Openers want a high score. */
  compound: number;
  /** 0–3: how mainstream the movement is, so plans lead with lifts people know. */
  common: number;
};

type RawExercise = {
  id: string;
  name: string;
  category: string;
  target: string;
  equipment: string;
  primary: MuscleId[];
  secondary: MuscleId[];
  defaultSets: number;
  defaultReps: string;
  restSec: number;
  steps: string[];
  image: string;
  gif: string;
  isStretch: boolean;
  compound: number;
  common: number;
};

const META = new Map<string, RawExercise>((EXERCISE_DB as RawExercise[]).map((e) => [e.id, e]));

export const EXERCISES: Exercise[] = LIFT_MOVES.map((move) => {
  const meta = META.get(move.id)!;
  return {
    ...move,
    category: meta.category,
    target: meta.target,
    primary: meta.primary,
    secondary: meta.secondary,
    equipment: meta.equipment,
    steps: meta.steps,
    image: meta.image,
    gif: meta.gif,
    defaultSets: meta.defaultSets,
    defaultReps: meta.defaultReps,
    restSec: meta.restSec,
    isStretch: meta.isStretch,
    compound: meta.compound,
    common: meta.common,
  };
});

const EXERCISE_BY_ID = new Map(EXERCISES.map((e) => [e.id, e]));

export function exerciseById(id: string): Exercise | undefined {
  return EXERCISE_BY_ID.get(id);
}

export function exercisesForMuscle(id: MuscleId | "all", group?: Muscle): Exercise[] {
  return EXERCISES.filter((e) => {
    if (group && e.muscle !== group) return false;
    if (id === "all") return true;
    return e.primary.includes(id) || e.secondary.includes(id);
  });
}

/** Title-cases a raw equipment string (e.g. "leverage machine" -> "Leverage Machine"). */
export function equipmentLabel(equipment: string): string {
  return equipment.replace(/\b\w/g, (c) => c.toUpperCase());
}

export const MUSCLE_GROUPS: { id: MuscleId; label: string }[] = [
  { id: "chest", label: "Chest" },
  { id: "lats", label: "Back" },
  { id: "front-delts", label: "Shoulders" },
  { id: "biceps", label: "Biceps" },
  { id: "triceps", label: "Triceps" },
  { id: "abs", label: "Abs" },
  { id: "quads", label: "Quads" },
  { id: "hamstrings", label: "Hams" },
  { id: "glutes", label: "Glutes" },
  { id: "calves", label: "Calves" },
  { id: "forearms", label: "Forearms" },
  { id: "adductors", label: "Adductors" },
];

/** The dozen most common equipment types across the catalog, for quick filter chips. */
export const EQUIPMENT_FILTER: Equipment[] = (() => {
  const counts = new Map<string, number>();
  for (const e of EXERCISES) counts.set(e.equipment, (counts.get(e.equipment) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([id]) => id);
})();

/** Same-pattern swaps so a session stays on-goal when a move is swapped. */
export function substituteMoves(moveId: string, limit = 8): Exercise[] {
  const ex = exerciseById(moveId);
  if (!ex) return [];
  const primary = ex.primary[0];
  return EXERCISES.filter((e) => e.id !== moveId)
    .map((e) => {
      let score = 0;
      if (primary && e.primary.includes(primary)) score += 4;
      if (e.muscle === ex.muscle) score += 2;
      if (e.equipment === ex.equipment) score += 1;
      if (primary && e.secondary.includes(primary)) score += 1;
      return { e, score };
    })
    .filter((x) => x.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.e);
}

/** Hours since a muscle last got a working set. Under 36h = still working. */
export function muscleReadiness(
  sessions: LiftSession[],
  today: string,
): { sore: MuscleId[]; ready: MuscleId[] } {
  const last: Partial<Record<MuscleId, number>> = {};
  const now = Date.parse(`${today}T12:00:00`);
  for (const s of sessions) {
    const t = Date.parse(`${s.date}T12:00:00`);
    if (Number.isNaN(t) || t > now) continue;
    for (const line of s.lines) {
      if (!line.sets.some((x) => x.done && !x.warmup)) continue;
      const ex = exerciseById(line.moveId);
      for (const m of ex?.primary ?? []) {
        last[m] = Math.max(last[m] ?? 0, t);
      }
    }
  }
  const sore: MuscleId[] = [];
  const ready: MuscleId[] = [];
  for (const id of Object.keys(last) as MuscleId[]) {
    const hours = (now - (last[id] ?? 0)) / 36e5;
    if (hours < 36) sore.push(id);
    else if (hours < 96) ready.push(id);
  }
  return { sore, ready };
}
