import type { MacroGoal } from "./types";

export type Sex = "female" | "male";
export type ActivityId = "sedentary" | "light" | "moderate" | "very" | "extra";
export type GoalKind = "lose" | "recomp" | "maintain" | "lean" | "performance";
export type UnitSystem = "metric" | "imperial";
export type EquipmentAccess = "full" | "bodyweight";

export type BodyProfile = {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: ActivityId;
  goalKind: GoalKind;
  units: UnitSystem;
  /** Optional body-fat %. When set, BMR uses Katch–McArdle on lean mass. */
  bodyFatPct?: number;
  /** "bodyweight" limits auto-built training sessions to no-equipment moves. */
  equipmentAccess?: EquipmentAccess;
};

export type FamilySeat = {
  id: string;
  name: string;
  goalKind: GoalKind;
  likes?: string;
  avoids?: string;
};

export function seatAvoidsName(name: string, seats: FamilySeat[]): boolean {
  const blob = name.toLowerCase();
  for (const seat of seats) {
    const bits = (seat.avoids ?? "")
      .toLowerCase()
      .split(/[,;/]/)
      .map((bit) => bit.trim())
      .filter((bit) => bit.length > 2);
    if (bits.some((bit) => blob.includes(bit))) return true;
  }
  return false;
}

export const DEFAULT_BODY: BodyProfile = {
  sex: "female",
  age: 34,
  heightCm: 168,
  weightKg: 74,
  activity: "moderate",
  goalKind: "maintain",
  units: "imperial",
};

/**
 * How the day moves you, TRAINING EXCLUDED.
 *
 * This used to be the usual "gym 3–5 days = 1.55" ladder, which already counts
 * exercise — and then `dayFuel` added every logged workout and step on top. A
 * lifter who trained an hour was handed those calories twice, roughly a 10–15%
 * overshoot, which is the difference between a cut that works and one that
 * quietly does not. Multipliers here describe the job and the day around it;
 * training is measured and added once, where it happens.
 *
 * `impliedSteps` is what each level already assumes you walk. Only steps ABOVE
 * that get counted, so a tracked step is never charged twice either.
 */
export const ACTIVITY: {
  id: ActivityId;
  label: string;
  hint: string;
  factor: number;
  impliedSteps: number;
}[] = [
  { id: "sedentary", label: "Desk job", hint: "Sitting most of the day. Training counts separately.", factor: 1.2, impliedSteps: 3000 },
  { id: "light", label: "Up and down", hint: "Errands, stairs, some walking. Training counts separately.", factor: 1.3, impliedSteps: 6000 },
  { id: "moderate", label: "On your feet", hint: "Teacher, nurse, retail — moving most of the day.", factor: 1.45, impliedSteps: 10000 },
  { id: "very", label: "Physical job", hint: "Trades, warehouse, landscaping — hard work all shift.", factor: 1.6, impliedSteps: 14000 },
  { id: "extra", label: "Heavy labour", hint: "Carrying or digging all day, every day.", factor: 1.75, impliedSteps: 18000 },
];

/**
 * The five phases, and what each one actually prescribes.
 *
 * `energyPct` is a share of maintenance, not a flat number of calories. A flat
 * −500 is a 17% cut for a 100 kg man and a 28% cut for a 55 kg woman — the same
 * label doing two very different things to two bodies. A percentage scales, and
 * it is what the literature is written in.
 *
 * `proteinFfm` / `proteinBw` are grams per kilogram. FFM is used when body fat
 * is known, which is the more accurate basis and the one Helms et al. (2014)
 * state their range in: 2.3–3.1 g/kg FFM for lean, resistance-trained lifters
 * in a deficit. Otherwise total bodyweight, in the ISSN's 1.4–2.0 g/kg band,
 * pushed to the top of it for anyone training hard.
 *
 * `weeklyPct` is the rate of bodyweight change the phase is aiming for. It is
 * shown to the cook and it is what makes the plan checkable against a scale:
 * a target nobody can verify is a target nobody can trust.
 */
export type GoalSpec = {
  id: GoalKind;
  label: string;
  hint: string;
  /** Share of maintenance calories. −0.2 is a 20% deficit. */
  energyPct: number;
  proteinFfm: number;
  proteinBw: number;
  /** Share of calories from fat, floored separately at 0.8 g/kg bodyweight. */
  fatPct: number;
  /** Bodyweight change per week this phase targets, as a share of bodyweight. */
  weeklyPct: number;
};

export const GOAL_KINDS: GoalSpec[] = [
  {
    id: "lose",
    label: "Cut fat",
    hint: "Lose fat, keep the muscle. About 0.7% of bodyweight a week.",
    energyPct: -0.2,
    proteinFfm: 2.6,
    proteinBw: 2.2,
    fatPct: 0.25,
    weeklyPct: -0.007,
  },
  {
    id: "recomp",
    label: "Get lean",
    hint: "Weight holds, the shape changes. Protein high, calories near even.",
    energyPct: -0.06,
    proteinFfm: 2.4,
    proteinBw: 2.0,
    fatPct: 0.27,
    weeklyPct: -0.002,
  },
  {
    id: "maintain",
    label: "Keep weight",
    hint: "Eat to stay where you are.",
    energyPct: 0,
    proteinFfm: 1.9,
    proteinBw: 1.6,
    fatPct: 0.3,
    weeklyPct: 0,
  },
  {
    id: "lean",
    label: "Lean bulk",
    hint: "Slow, mostly-muscle gain. About 0.25% of bodyweight a week.",
    energyPct: 0.1,
    proteinFfm: 2.2,
    proteinBw: 1.8,
    fatPct: 0.25,
    weeklyPct: 0.0025,
  },
  {
    id: "performance",
    label: "Bodybuilder",
    hint: "Hard training, big surplus, carbs to fuel it. About 0.5% a week.",
    energyPct: 0.17,
    proteinFfm: 2.4,
    proteinBw: 2.0,
    // Fat sits at its floor so the surplus lands in carbohydrate, which is what
    // actually fuels high-volume lifting.
    fatPct: 0.2,
    weeklyPct: 0.005,
  },
];

export function goalSpec(kind: GoalKind | string | undefined): GoalSpec {
  const id = normalizeGoalKind(kind);
  return GOAL_KINDS.find((g) => g.id === id) ?? GOAL_KINDS[2]!;
}

export const MIN_BODY_AGE = 8;
export const MAX_BODY_AGE = 90;
/** Workout math in this library is written for teens and adults. Age itself is never silently rewritten. */
export const TRAINING_AGE_FLOOR = 16;

export function clampAge(age: number): number {
  return Math.max(MIN_BODY_AGE, Math.min(MAX_BODY_AGE, Math.round(age || 34)));
}

export function ageNeedsTrainingNote(age: number): boolean {
  return age < TRAINING_AGE_FLOOR;
}

export const AGE_TRAINING_NOTE =
  "Workouts use adult numbers from 16. Your age stays as you typed it — we do not rewrite it.";

export function normalizeGoalKind(kind: string | undefined | null): GoalKind {
  if (kind === "gain") return "lean";
  if (kind === "lose" || kind === "recomp" || kind === "maintain" || kind === "lean" || kind === "performance") {
    return kind;
  }
  return "maintain";
}

export function normalizeEquipmentAccess(access: string | undefined | null): EquipmentAccess {
  return access === "bodyweight" ? "bodyweight" : "full";
}

export function clampBodyFat(pct: number | undefined | null): number | undefined {
  if (pct == null || !Number.isFinite(pct) || pct <= 0) return undefined;
  return Math.round(Math.max(4, Math.min(60, pct)) * 10) / 10;
}

export function normalizeBody(body: BodyProfile): BodyProfile {
  return {
    ...body,
    goalKind: normalizeGoalKind(body.goalKind),
    equipmentAccess: normalizeEquipmentAccess(body.equipmentAccess),
    bodyFatPct: clampBodyFat(body.bodyFatPct),
    age: clampAge(body.age),
    heightCm: Math.max(120, Math.min(220, body.heightCm || 168)),
    weightKg: Math.max(35, Math.min(250, body.weightKg || 74)),
  };
}

export function goalLabel(kind: GoalKind | string | undefined): string {
  const id = normalizeGoalKind(kind);
  return GOAL_KINDS.find((g) => g.id === id)?.label ?? "Keep weight";
}

export function goalHint(kind: GoalKind | string | undefined): string {
  const id = normalizeGoalKind(kind);
  return GOAL_KINDS.find((g) => g.id === id)?.hint ?? "";
}

/** Lean body mass in kg when fat % is known. */
export function leanMassKg(body: BodyProfile): number | undefined {
  const bf = clampBodyFat(body.bodyFatPct);
  if (bf == null) return undefined;
  return body.weightKg * (1 - bf / 100);
}

export function bmrMethod(body: BodyProfile): "Katch–McArdle" | "Mifflin–St Jeor" {
  return leanMassKg(body) != null ? "Katch–McArdle" : "Mifflin–St Jeor";
}

/** Resting calories. Katch–McArdle when fat % is set; otherwise Mifflin–St Jeor. */
export function bmrKcal(body: BodyProfile): number {
  const lbm = leanMassKg(body);
  if (lbm != null) {
    return Math.round(370 + 21.6 * lbm);
  }
  const base = 10 * body.weightKg + 6.25 * body.heightCm - 5 * body.age;
  const sexAdj = body.sex === "male" ? 5 : -161;
  return Math.round(base + sexAdj);
}

export function activityFactor(id: ActivityId): number {
  return ACTIVITY.find((a) => a.id === id)?.factor ?? 1.55;
}

/** TDEE before today's training. Training is added on top so we do not double-count. */
export function tdeeKcal(body: BodyProfile): number {
  return Math.round(bmrKcal(body) * activityFactor(body.activity));
}

/**
 * Calories this phase adds or removes, for THIS body.
 *
 * A share of maintenance rather than a flat number, so the same phase means the
 * same thing to a 55 kg and a 100 kg lifter.
 */
export function goalDelta(kind: GoalKind | string | undefined, body?: BodyProfile): number {
  const spec = goalSpec(kind);
  const maintenance = body ? tdeeKcal(body) : 2200;
  return Math.round(maintenance * spec.energyPct);
}

/**
 * The floor under a deficit: the Academy of Nutrition and Dietetics' minimum
 * prescribed intake, 1200 kcal for women and 1500 for men.
 *
 * Deliberately NOT "never below BMR". A lean lifter with a known body-fat
 * percentage gets a high Katch–McArdle resting number and, on a desk job, a
 * maintenance only ~1.2x that — so a textbook 20% cut lands at or under BMR and
 * a BMR floor would silently cancel it. Eating somewhat under resting is normal
 * in a deficit; what is not normal is eating under the clinical minimum, or
 * cutting harder than a quarter of maintenance, and both of those are held.
 */
export function floorKcal(body: BodyProfile): number {
  return body.sex === "male" ? 1500 : 1200;
}

/** No phase may cut harder than a quarter of maintenance, whatever it asks for. */
export const MAX_DEFICIT_PCT = 0.25;

/** Grams of protein per kg for this phase, on lean mass or on bodyweight. */
function proteinPerKg(kind: GoalKind, usingLean: boolean): number {
  const spec = goalSpec(kind);
  return usingLean ? spec.proteinFfm : spec.proteinBw;
}

/**
 * A phase a cook can check against a scale.
 *
 * Beyond the macros: what maintenance was, what the phase did to it, whether a
 * safety floor caught it, and the weekly weight change to expect. That last
 * number is the honest one — if the scale disagrees after a fortnight, the
 * estimate was wrong and the cook can act on it.
 */
export type GoalPlan = MacroGoal & {
  maintenanceKcal: number;
  /** Calories the phase asked for, before any floor. */
  targetKcal: number;
  /** True when a safety floor raised the target above what the phase asked. */
  floored: boolean;
  /** Expected weight change per week, kilograms. Negative on a cut. */
  weeklyKg: number;
  method: "Katch–McArdle" | "Mifflin–St Jeor";
  /** Set when the phase was softened because the profile is a child's. */
  note?: string;
};

/**
 * Under-16s are never handed a deficit or a surplus.
 *
 * The calorie formulas here are adult ones and a growing body is not a smaller
 * adult. The phase still colours which food gets suggested — a teenager can
 * still want high-protein plates — but the number is maintenance, and the plan
 * says why.
 */
function phaseFor(body: BodyProfile): { spec: GoalSpec; note?: string } {
  const spec = goalSpec(body.goalKind);
  if (body.age < TRAINING_AGE_FLOOR && spec.energyPct !== 0) {
    return {
      spec: { ...spec, energyPct: 0, weeklyPct: 0 },
      note: "Under 16, we plan to maintain — growing bodies do not get a deficit or a bulk from an app.",
    };
  }
  return { spec };
}

/** The full plan: macros, what they came from, and what the scale should do. */
export function goalPlan(body: BodyProfile): GoalPlan {
  const profile = normalizeBody(body);
  const { spec, note } = phaseFor(profile);
  const maintenance = tdeeKcal(profile);
  const pct = Math.max(-MAX_DEFICIT_PCT, spec.energyPct);
  const targetKcal = Math.round(maintenance * (1 + pct));
  const floor = floorKcal(profile);
  const cal = Math.max(floor, targetKcal);
  const floored = cal > targetKcal;

  const lbm = leanMassKg(profile);
  const usingLean = lbm != null;
  const mass = lbm ?? profile.weightKg;
  const protein = Math.round(proteinPerKg(spec.id, usingLean) * mass);

  // Fat gets a share of calories, but never less than 0.8 g/kg bodyweight —
  // below that hormones and fat-soluble vitamins start to suffer.
  const fat = Math.round(Math.max(0.8 * profile.weightKg, (cal * spec.fatPct) / 9));

  // Carbs take what is left. The floor keeps a brain and a training session fed
  // even when protein and fat have eaten most of a small target.
  const carbKcal = cal - protein * 4 - fat * 9;
  const carbFloor = spec.id === "performance" ? 150 : spec.id === "lose" ? 80 : 100;
  const carbs = Math.max(carbFloor, Math.round(carbKcal / 4));

  // 7700 kcal ≈ 1 kg of body mass. Computed from the calories actually
  // prescribed, so a floored target reports the slower rate it will really give.
  const weeklyKg = floored
    ? Math.round(((cal - maintenance) * 7) / 7700 * 100) / 100
    : Math.round(profile.weightKg * spec.weeklyPct * 100) / 100;

  return {
    cal,
    protein,
    carbs,
    fat,
    maintenanceKcal: maintenance,
    targetKcal,
    floored,
    weeklyKg,
    method: bmrMethod(profile),
    ...(note ? { note } : {}),
  };
}

/** Daily macros from the body. The plan without the explanation. */
export function macrosFromBody(body: BodyProfile): MacroGoal {
  const { cal, protein, carbs, fat } = goalPlan(body);
  return { cal, protein, carbs, fat };
}

export function kgFromLb(lb: number): number {
  return lb / 2.2046226218;
}

export function lbFromKg(kg: number): number {
  return kg * 2.2046226218;
}

export function cmFromIn(inches: number): number {
  return inches * 2.54;
}

export function inFromCm(cm: number): number {
  return cm / 2.54;
}

export function heightParts(cm: number): { ft: number; inch: number } {
  const total = inFromCm(cm);
  const ft = Math.floor(total / 12);
  const inch = Math.round(total - ft * 12);
  return inch === 12 ? { ft: ft + 1, inch: 0 } : { ft, inch };
}

export function heightCmFromParts(ft: number, inch: number): number {
  return cmFromIn(ft * 12 + inch);
}

export function formatWeight(body: BodyProfile): string {
  if (body.units === "imperial") return `${Math.round(lbFromKg(body.weightKg))} lb`;
  return `${Math.round(body.weightKg * 10) / 10} kg`;
}

export function formatHeight(body: BodyProfile): string {
  if (body.units === "imperial") {
    const h = heightParts(body.heightCm);
    return `${h.ft}'${h.inch}"`;
  }
  return `${Math.round(body.heightCm)} cm`;
}

export function formatBodyFat(body: BodyProfile): string | null {
  const bf = clampBodyFat(body.bodyFatPct);
  if (bf == null) return null;
  return `${bf}% fat`;
}
