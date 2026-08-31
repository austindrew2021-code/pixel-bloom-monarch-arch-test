import { format } from "date-fns";
import type { BodyProfile, GoalKind } from "./body";
import { DEFAULT_BODY } from "./body";
import { recoveryLabel, type HealthDay } from "./fitness-sync";
import { goalRankBoost } from "./goal-fit";
import { liftKcal } from "./lift";
import type { MacroGoal, Nutrition, Recipe, Workout, WorkoutKind } from "./types";

export const DEFAULT_GOAL: MacroGoal = { cal: 2200, protein: 130, carbs: 220, fat: 70 };

export const GOAL_PRESETS: { id: string; label: string; hint: string; goal: MacroGoal }[] = [
  { id: "light", label: "Light", hint: "Desk days", goal: { cal: 1800, protein: 90, carbs: 180, fat: 60 } },
  { id: "everyday", label: "Everyday", hint: "Walks and life", goal: { cal: 2200, protein: 120, carbs: 220, fat: 70 } },
  { id: "train", label: "Training", hint: "Lift or long runs", goal: { cal: 2700, protein: 165, carbs: 300, fat: 80 } },
];

export const WORKOUTS: { id: WorkoutKind; label: string; hint: string }[] = [
  { id: "lift", label: "Lift", hint: "Bar, dumbbells, machines" },
  { id: "run", label: "Run", hint: "Road or trail" },
  { id: "walk", label: "Walk", hint: "Steps with intent" },
  { id: "ride", label: "Ride", hint: "Bike" },
  { id: "class", label: "Class", hint: "HIIT, yoga, spin" },
  { id: "other", label: "Other", hint: "Whatever you did" },
];

/** Compendium of Physical Activities METs. */
const MET: Record<WorkoutKind, number> = {
  lift: 5.0,
  run: 9.8,
  walk: 4.3,
  ride: 7.5,
  class: 8.0,
  other: 5.5,
};

const PROTEIN_PER_KG: Record<WorkoutKind, number> = {
  lift: 0.12,
  run: 0.04,
  walk: 0.015,
  ride: 0.03,
  class: 0.06,
  other: 0.04,
};

const CARB_PER_KG: Record<WorkoutKind, number> = {
  lift: 0.08,
  run: 0.35,
  walk: 0.08,
  ride: 0.22,
  class: 0.2,
  other: 0.12,
};

export function isoDate(d: Date = new Date()): string {
  return format(d, "yyyy-MM-dd");
}

export function emptyNutrition(): Nutrition {
  return { cal: 0, protein: 0, carbs: 0, fat: 0 };
}

export function addNutrition(a: Nutrition, b: Nutrition): Nutrition {
  return {
    cal: a.cal + b.cal,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
  };
}

/** ACSM: kcal = MET × 3.5 × bodyKg / 200 × minutes. */
export function metKcal(met: number, bodyKg: number, minutes: number): number {
  return (met * 3.5 * bodyKg * Math.max(1, minutes)) / 200;
}

export function runMetFromPace(distanceKm: number, minutes: number): number {
  const hours = Math.max(0.08, minutes / 60);
  const kmh = distanceKm / hours;
  if (kmh < 5.5) return 4.3;
  if (kmh < 7) return 7.0;
  if (kmh < 8.4) return 8.3;
  if (kmh < 9.7) return 9.8;
  if (kmh < 11.3) return 11.0;
  if (kmh < 12.9) return 12.3;
  return 14.5;
}

export function workoutKcal(workout: Workout, body: BodyProfile = DEFAULT_BODY): number {
  if (workout.kcal && workout.kcal > 0) return workout.kcal;
  const kg = body.weightKg;
  if (workout.kind === "lift") {
    return liftKcal(kg, workout.minutes, workout.volumeKg ?? 0);
  }
  let met = MET[workout.kind];
  if ((workout.kind === "run" || workout.kind === "walk" || workout.kind === "ride") && workout.distanceKm) {
    met = runMetFromPace(workout.distanceKm, workout.minutes);
    if (workout.kind === "walk") met = Math.min(met, 6.5);
    if (workout.kind === "ride") met = Math.max(6, met * 0.85);
  }
  return Math.round(metKcal(met, kg, workout.minutes));
}

/**
 * Walking cost from steps. ~1.3 m stride → 1300 steps/km.
 * 0.9 kcal per kg per km is a walking-level cost (Ainsworth).
 */
export function stepsKcal(steps: number, bodyKg: number): number {
  const km = Math.max(0, steps) / 1300;
  return Math.round(0.9 * bodyKg * km);
}

export function burnKcal(kind: WorkoutKind, minutes: number, body: BodyProfile = DEFAULT_BODY): number {
  return Math.round(metKcal(MET[kind], body.weightKg, minutes));
}

export function workoutProteinBump(kind: WorkoutKind, minutes: number, bodyKg: number): number {
  return Math.round(PROTEIN_PER_KG[kind] * bodyKg * (minutes / 45));
}

export function workoutCarbBump(kind: WorkoutKind, minutes: number, bodyKg: number): number {
  return Math.round(CARB_PER_KG[kind] * bodyKg * (minutes / 45));
}

export type DayFuel = {
  eaten: Nutrition;
  burn: number;
  target: MacroGoal;
  remaining: MacroGoal;
};

export function dayFuel(input: {
  goal: MacroGoal;
  eaten: Nutrition;
  workouts: Workout[];
  steps: number;
  body?: BodyProfile | null;
}): DayFuel {
  const body = input.body ?? DEFAULT_BODY;
  const burn =
    input.workouts.reduce((sum, w) => sum + workoutKcal(w, body), 0) +
    stepsKcal(input.steps, body.weightKg);
  const extraP = input.workouts.reduce(
    (sum, w) => sum + workoutProteinBump(w.kind, w.minutes, body.weightKg),
    0,
  );
  const extraC = input.workouts.reduce(
    (sum, w) => sum + workoutCarbBump(w.kind, w.minutes, body.weightKg),
    0,
  );
  const target: MacroGoal = {
    cal: input.goal.cal + burn,
    protein: input.goal.protein + extraP,
    carbs: input.goal.carbs + extraC,
    fat: input.goal.fat,
  };
  const remaining: MacroGoal = {
    cal: Math.max(0, target.cal - input.eaten.cal),
    protein: Math.max(0, target.protein - input.eaten.protein),
    carbs: Math.max(0, target.carbs - input.eaten.carbs),
    fat: Math.max(0, target.fat - input.eaten.fat),
  };
  return { eaten: input.eaten, burn, target, remaining };
}

/** Shift today's targets from sleep, HRV, and move rings — Body Sync. */
export function healthMacroBump(day: HealthDay): { cal: number; protein: number; carbs: number } {
  const rec = recoveryLabel(day);
  let cal = 0;
  let protein = 0;
  let carbs = 0;
  if (rec === "low") {
    cal -= 160;
    protein += 12;
    carbs -= 35;
  } else if (rec === "high") {
    cal += 90;
    protein += 8;
    carbs += 28;
  }
  if (day.activeKcal > day.moveGoal) {
    const over = day.activeKcal - day.moveGoal;
    cal += Math.round(over * 0.35);
    carbs += Math.round(over / 18);
  }
  if (day.exerciseMin >= day.exerciseGoal + 15) carbs += 20;
  if (day.sleepHours < 6) protein += 6;
  return { cal, protein, carbs };
}

export function applyHealthToFuel(fuel: DayFuel, day: HealthDay): DayFuel {
  const bump = healthMacroBump(day);
  const target: MacroGoal = {
    cal: Math.max(1400, fuel.target.cal + bump.cal),
    protein: Math.max(70, fuel.target.protein + bump.protein),
    carbs: Math.max(80, fuel.target.carbs + bump.carbs),
    fat: fuel.target.fat,
  };
  return {
    ...fuel,
    target,
    remaining: {
      cal: Math.max(0, target.cal - fuel.eaten.cal),
      protein: Math.max(0, target.protein - fuel.eaten.protein),
      carbs: Math.max(0, target.carbs - fuel.eaten.carbs),
      fat: Math.max(0, target.fat - fuel.eaten.fat),
    },
  };
}

export function healthAdvice(day: HealthDay): { title: string; body: string; recovery: "low" | "ok" | "high" } {
  const recovery = recoveryLabel(day);
  if (recovery === "low") {
    return {
      title: "Easy night",
      body: `Sleep ${day.sleepHours}h · HRV ${day.hrvMs} ms. Keep dinner light and protein-forward — skip the long cook.`,
      recovery,
    };
  }
  if (recovery === "high") {
    return {
      title: "Ready to fuel",
      body: `Recovery is high. ${day.activeKcal} active kcal already — put the carbs back on the plate.`,
      recovery,
    };
  }
  return {
    title: "On track",
    body: `${day.steps.toLocaleString()} steps · ${day.exerciseMin} min move. Dinner ranked to close the gap.`,
    recovery,
  };
}

function closeness(got: number, need: number, span: number): number {
  if (need <= 0) return got < span ? 1 : 0.35;
  return 1 - Math.min(1, Math.abs(got - need) / span);
}

export type FuelHit = {
  recipe: Recipe;
  score: number;
  why: string;
};

export function rankForFuel(
  pool: Recipe[],
  remaining: MacroGoal,
  pantry: string[],
  opts?: { afterLift?: boolean; recovery?: "low" | "ok" | "high"; goalKind?: GoalKind | string; afterCardio?: boolean; skipped?: boolean },
): FuelHit[] {
  const pantryN = pantry.map((p) => p.toLowerCase()).filter(Boolean);
  const recovery = opts?.recovery;
  return pool
    .map((recipe) => {
      const n = recipe.nutrition;
      const dinnerProtein = Math.min(remaining.protein, 75);
      const pFit = closeness(n.protein, dinnerProtein, 45);
      const cFit = closeness(n.carbs, Math.min(remaining.carbs, 90), 70);
      const calFit = closeness(n.cal, Math.min(remaining.cal, 850), 400);
      let pantryHits = 0;
      for (const ing of recipe.ingredients) {
        const name = ing.name.toLowerCase();
        if (pantryN.some((p) => name.includes(p) || p.includes(name))) pantryHits += 1;
      }
      const pantryRatio = pantryHits / Math.max(1, recipe.ingredients.length);
      const liftBoost = opts?.afterLift && n.protein >= 35 ? 1.2 : 1;
      let score =
        (pFit * 5 + pantryRatio * 3 + calFit * 2 + cFit + (recipe.minutes <= 35 ? 0.6 : 0)) * liftBoost;
      score += goalRankBoost(recipe, opts?.goalKind);
      if (opts?.afterCardio && n.protein >= 28) score += 0.35;
      if (opts?.skipped) {
        if (n.cal <= 520) score += 0.7;
        if (n.carbs >= 70 && n.protein < 32) score -= 0.6;
      }
      if (recovery === "low") {
        if (recipe.minutes <= 30) score += 0.8;
        if (n.cal <= 520) score += 0.5;
        if (recipe.plate === "soup" || recipe.plate === "bowl" || recipe.plate === "green") score += 0.7;
        if (n.cal > 780) score -= 0.9;
        if (recipe.minutes > 55) score -= 0.5;
      } else if (recovery === "high") {
        if (n.carbs >= 50) score += 0.45;
        if (n.cal >= 550 && n.protein >= 28) score += 0.3;
      }
      const bits: string[] = [];
      if (recovery === "low" && n.protein >= 28 && n.cal <= 560) bits.push("easy night, still protein");
      if (recovery === "high" && n.carbs >= 50) bits.push("carbs back after the work");
      if (remaining.protein >= 40 && n.protein >= 30) bits.push(`${n.protein}g protein to close the gap`);
      if (pantryHits >= 2) bits.push("uses what you have");
      if (opts?.afterLift && n.protein >= 35) bits.push("after lifting");
      if (opts?.afterCardio && n.protein >= 28) bits.push("after cardio");
      if (opts?.skipped && n.cal <= 520) bits.push("session skipped — lighter plate");
      if (recipe.minutes <= 30) bits.push("weeknight-fast");
      return {
        recipe,
        score,
        why: bits[0] ?? `${n.protein}g protein · ${recipe.minutes} min`,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function pct(n: number, of: number): number {
  if (of <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((n / of) * 100)));
}

export function cookStreak(cookedDates: string[], today = isoDate()): number {
  const set = new Set(cookedDates);
  let streak = 0;
  let cursor = new Date(`${today}T12:00:00`);
  if (!set.has(today)) {
    cursor.setDate(cursor.getDate() - 1);
  }
  for (;;) {
    const key = format(cursor, "yyyy-MM-dd");
    if (!set.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
    if (streak > 60) break;
  }
  return streak;
}
