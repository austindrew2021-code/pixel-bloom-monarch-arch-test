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
};

export const DEFAULT_BODY: BodyProfile = {
  sex: "female",
  age: 34,
  heightCm: 168,
  weightKg: 74,
  activity: "moderate",
  goalKind: "maintain",
  units: "imperial",
};

export const ACTIVITY: { id: ActivityId; label: string; hint: string; factor: number }[] = [
  { id: "sedentary", label: "Sit a lot", hint: "Desk job, little extra movement", factor: 1.2 },
  { id: "light", label: "Walk most days", hint: "Walks, errands, on your feet", factor: 1.375 },
  { id: "moderate", label: "Gym 3–5 days", hint: "Work out most weekdays", factor: 1.55 },
  { id: "very", label: "Gym 6 days", hint: "Training almost every day", factor: 1.725 },
  { id: "extra", label: "Two-a-days", hint: "Train twice most days", factor: 1.9 },
];

export const GOAL_KINDS: { id: GoalKind; label: string; hint: string }[] = [
  { id: "lose", label: "Cut fat", hint: "Eat less. About 1 lb / 0.5 kg a week." },
  { id: "recomp", label: "Get lean", hint: "Look tighter. Weight stays close." },
  { id: "maintain", label: "Hold weight", hint: "Eat to stay where you are." },
  { id: "lean", label: "Build muscle", hint: "A little extra food. Slow, lean gain." },
  { id: "performance", label: "Bodybuilder", hint: "Eat more to train hard and get bigger." },
];

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
    age: Math.max(16, Math.min(90, Math.round(body.age || 34))),
    heightCm: Math.max(120, Math.min(220, body.heightCm || 168)),
    weightKg: Math.max(35, Math.min(250, body.weightKg || 74)),
  };
}

export function goalLabel(kind: GoalKind | string | undefined): string {
  const id = normalizeGoalKind(kind);
  return GOAL_KINDS.find((g) => g.id === id)?.label ?? "Hold weight";
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

export function goalDelta(kind: GoalKind | string | undefined): number {
  const id = normalizeGoalKind(kind);
  if (id === "lose") return -500;
  if (id === "recomp") return -150;
  if (id === "lean") return 250;
  if (id === "performance") return 350;
  return 0;
}

function proteinPerKg(kind: GoalKind, usingLean: boolean): number {
  if (kind === "lose") return usingLean ? 2.6 : 2.2;
  if (kind === "recomp") return usingLean ? 2.5 : 2.1;
  if (kind === "lean") return usingLean ? 2.3 : 2.0;
  if (kind === "performance") return usingLean ? 2.2 : 1.8;
  return usingLean ? 2.2 : 1.8;
}

/**
 * Daily macros from the body, not a guess.
 * Protein 1.6–2.2 g/kg total, or ~2.2–2.6 g/kg lean mass when fat % is known.
 * Fat ≥ 0.8 g/kg. Carbs take the rest. Performance keeps more carbohydrate.
 */
export function macrosFromBody(body: BodyProfile): MacroGoal {
  const profile = normalizeBody(body);
  const tdee = tdeeKcal(profile);
  const raw = tdee + goalDelta(profile.goalKind);
  const cal = Math.max(Math.round(bmrKcal(profile) * 1.1), raw);
  const lbm = leanMassKg(profile);
  const usingLean = lbm != null;
  const mass = lbm ?? profile.weightKg;
  const protein = Math.round(Math.max(1.6, proteinPerKg(profile.goalKind, usingLean)) * mass);
  const fatShare = profile.goalKind === "performance" ? 0.22 : profile.goalKind === "lose" ? 0.28 : 0.25;
  const fat = Math.round(Math.max(0.8 * profile.weightKg, (cal * fatShare) / 9));
  const carbKcal = cal - protein * 4 - fat * 9;
  const carbFloor = profile.goalKind === "performance" ? 140 : profile.goalKind === "lose" ? 70 : 90;
  const carbs = Math.max(carbFloor, Math.round(carbKcal / 4));
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
