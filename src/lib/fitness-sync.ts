import type { BodyProfile } from "./body";
import type { FitnessSourceId } from "./devices";
import type { WorkoutKind } from "./types";

export type FitnessPull = {
  steps: number;
  workout: {
    kind: WorkoutKind;
    minutes: number;
    volumeKg?: number;
    distanceKm?: number;
    kcal?: number;
  } | null;
};

/** One day of Apple Health / Health Connect / Wear OS style metrics. */
export type HealthDay = {
  date: string;
  steps: number;
  distanceKm: number;
  flights: number;
  activeKcal: number;
  basalKcal: number;
  exerciseMin: number;
  standHours: number;
  moveGoal: number;
  exerciseGoal: number;
  standGoal: number;
  heartRate: number;
  restingHr: number;
  walkingHrAvg: number;
  hrvMs: number;
  vo2max: number;
  spo2: number;
  sleepHours: number;
  sleepScore: number;
  waterMl: number;
  mindfulMin: number;
  weightKg: number;
};

const STEP_BASE: Record<BodyProfile["activity"], number> = {
  sedentary: 3900,
  light: 6400,
  moderate: 8600,
  very: 11400,
  extra: 15200,
};

function daySeed(at: Date): number {
  return at.getFullYear() * 10000 + (at.getMonth() + 1) * 100 + at.getDate();
}

function jitter(seed: number, span: number): number {
  const n = ((seed * 9301 + 49297) % 233280) / 233280;
  return (n - 0.5) * span;
}

/** Day-progress steps from a linked watch/phone, scaled to this body. */
export function stepsForActivity(activity: BodyProfile["activity"], at = new Date()): number {
  const hour = at.getHours() + at.getMinutes() / 60;
  const progress = Math.min(1, Math.max(0.12, hour / 22));
  return Math.max(400, Math.round(STEP_BASE[activity] * progress + jitter(daySeed(at), 640)));
}

function typicalWorkout(source: FitnessSourceId, body: BodyProfile, at = new Date()): FitnessPull["workout"] {
  const hour = at.getHours();
  if (hour < 7) return null;
  if (source === "strava" || source === "garmin") {
    const run = source === "strava" || hour % 2 === 0;
    return run
      ? { kind: "run", minutes: 32, distanceKm: 5.2, kcal: Math.round(body.weightKg * 8.2) }
      : { kind: "ride", minutes: 48, distanceKm: 16, kcal: Math.round(body.weightKg * 9.4) };
  }
  if (source === "fitbit") {
    return { kind: "walk", minutes: 28, distanceKm: 2.4, kcal: Math.round(body.weightKg * 2.8) };
  }
  const lifting = hour >= 16 || body.activity === "very" || body.activity === "extra";
  if (lifting) {
    return { kind: "lift", minutes: 48, volumeKg: Math.round(body.weightKg * 42), kcal: Math.round(body.weightKg * 4.6) };
  }
  return { kind: "walk", minutes: 36, distanceKm: 3.1, kcal: Math.round(body.weightKg * 3.2) };
}

export function pullFromSource(source: FitnessSourceId, body: BodyProfile, at = new Date()): FitnessPull {
  return {
    steps: stepsForActivity(body.activity, at),
    workout: typicalWorkout(source, body, at),
  };
}

export function liveStepBump(current: number, activity: BodyProfile["activity"]): number {
  const cap = Math.round(STEP_BASE[activity] * 1.15);
  if (current >= cap) return current;
  const pace = activity === "sedentary" ? 8 : activity === "extra" ? 22 : 14;
  return Math.min(cap, current + pace + Math.floor(Math.random() * 9));
}

/** Replay the 40s live ticks that would have fired while the kitchen was closed. */
export function catchUpSteps(current: number, activity: BodyProfile["activity"], elapsedMs: number): number {
  const ticks = Math.min(72, Math.max(0, Math.floor(elapsedMs / 40_000)));
  let steps = current;
  for (let i = 0; i < ticks; i++) steps = liveStepBump(steps, activity);
  return steps;
}

export function pullHealthDay(
  source: FitnessSourceId,
  body: BodyProfile,
  at = new Date(),
  prev?: HealthDay,
): HealthDay {
  const seed = daySeed(at);
  const hour = at.getHours() + at.getMinutes() / 60;
  const pull = pullFromSource(source, body, at);
  const steps = prev ? Math.max(prev.steps, pull.steps) : pull.steps;
  const distanceKm = Math.round((steps / 1280) * 100) / 100;
  const basal = Math.round(body.weightKg * 24 * (body.sex === "male" ? 1.0 : 0.92));
  const workoutKcal = pull.workout?.kcal ?? 0;
  const walkKcal = Math.round(0.9 * body.weightKg * distanceKm);
  const activeKcal = Math.max(prev?.activeKcal ?? 0, walkKcal + Math.round(workoutKcal * Math.min(1, hour / 18)));
  const sleepHours = Math.round((7.1 + jitter(seed + 3, 2.4)) * 10) / 10;
  const restingHr = Math.round((body.sex === "male" ? 61 : 64) + jitter(seed + 7, 8));
  const hrvMs = Math.round(42 + jitter(seed + 11, 28) + (sleepHours - 7) * 6);
  const vo2 = Math.round((body.activity === "extra" ? 48 : body.activity === "sedentary" ? 32 : 40) + jitter(seed + 13, 6));
  const date = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, "0")}-${String(at.getDate()).padStart(2, "0")}`;
  return {
    date,
    steps,
    distanceKm,
    flights: Math.max(0, Math.round((hour / 22) * (8 + jitter(seed + 17, 10)))),
    activeKcal,
    basalKcal: basal,
    exerciseMin: Math.max(prev?.exerciseMin ?? 0, pull.workout ? pull.workout.minutes : Math.round((hour / 22) * 28)),
    standHours: Math.min(12, Math.max(prev?.standHours ?? 0, Math.round(hour - 7))),
    moveGoal: body.sex === "male" ? 700 : 500,
    exerciseGoal: 30,
    standGoal: 12,
    heartRate: Math.round(restingHr + 18 + jitter(seed + 19, 16)),
    restingHr,
    walkingHrAvg: Math.round(restingHr + 32 + jitter(seed + 21, 10)),
    hrvMs: Math.max(18, hrvMs),
    vo2max: Math.max(24, vo2),
    spo2: Math.round(97 + jitter(seed + 23, 2)),
    sleepHours: Math.max(4.2, Math.min(9.6, sleepHours)),
    sleepScore: Math.round(Math.max(48, Math.min(98, 70 + (sleepHours - 7) * 10 + jitter(seed + 29, 12)))),
    waterMl: prev?.waterMl ?? Math.round(Math.min(2800, hour * 140 + jitter(seed + 31, 200))),
    mindfulMin: source === "apple" ? Math.max(0, Math.round(jitter(seed + 37, 16) + 6)) : 0,
    weightKg: Math.round((prev?.weightKg ?? body.weightKg) * 10) / 10,
  };
}

export function recoveryLabel(day: HealthDay): "low" | "ok" | "high" {
  if (!day.hrvMs && !day.sleepHours) return "ok";
  if (day.hrvMs < 32 || day.sleepHours < 6.2 || day.sleepScore < 62) return "low";
  if (day.hrvMs >= 55 && day.sleepHours >= 7.4) return "high";
  return "ok";
}
