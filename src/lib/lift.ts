/** Strength math: volume, 1RM, plates, and calories that rise with the load on the bar. */

export type Muscle = "legs" | "push" | "pull" | "core" | "full";

export type LiftMove = {
  id: string;
  name: string;
  muscle: Muscle;
  romM: number;
  bar?: boolean;
  bodyweight?: boolean;
};

export const LIFT_MOVES: LiftMove[] = [
  { id: "squat", name: "Back squat", muscle: "legs", romM: 0.7, bar: true },
  { id: "front-squat", name: "Front squat", muscle: "legs", romM: 0.65, bar: true },
  { id: "goblet", name: "Goblet squat", muscle: "legs", romM: 0.6 },
  { id: "split-squat", name: "Bulgarian split squat", muscle: "legs", romM: 0.55 },
  { id: "rdl", name: "Romanian deadlift", muscle: "legs", romM: 0.55, bar: true },
  { id: "deadlift", name: "Deadlift", muscle: "full", romM: 0.65, bar: true },
  { id: "lunge", name: "Walking lunge", muscle: "legs", romM: 0.5 },
  { id: "hip-thrust", name: "Hip thrust", muscle: "legs", romM: 0.4, bar: true },
  { id: "leg-press", name: "Leg press", muscle: "legs", romM: 0.45 },
  { id: "calf", name: "Calf raise", muscle: "legs", romM: 0.2 },
  { id: "bench", name: "Bench press", muscle: "push", romM: 0.4, bar: true },
  { id: "incline", name: "Incline bench", muscle: "push", romM: 0.4, bar: true },
  { id: "ohp", name: "Overhead press", muscle: "push", romM: 0.55, bar: true },
  { id: "dip", name: "Dip", muscle: "push", romM: 0.4, bodyweight: true },
  { id: "pushup", name: "Push-up", muscle: "push", romM: 0.35, bodyweight: true },
  { id: "fly", name: "Chest fly", muscle: "push", romM: 0.4 },
  { id: "tricep", name: "Tricep extension", muscle: "push", romM: 0.3 },
  { id: "lateral", name: "Lateral raise", muscle: "push", romM: 0.4 },
  { id: "row", name: "Barbell row", muscle: "pull", romM: 0.45, bar: true },
  { id: "pullup", name: "Pull-up", muscle: "pull", romM: 0.55, bodyweight: true },
  { id: "lat", name: "Lat pulldown", muscle: "pull", romM: 0.55 },
  { id: "face-pull", name: "Face pull", muscle: "pull", romM: 0.35 },
  { id: "curl", name: "Curl", muscle: "pull", romM: 0.35 },
  { id: "hammer", name: "Hammer curl", muscle: "pull", romM: 0.35 },
  { id: "shrug", name: "Shrug", muscle: "pull", romM: 0.25, bar: true },
  { id: "swing", name: "Kettlebell swing", muscle: "full", romM: 0.7 },
  { id: "farmer", name: "Farmer carry", muscle: "full", romM: 0.15 },
  { id: "plank", name: "Plank", muscle: "core", romM: 0.1, bodyweight: true },
  { id: "hanging-leg", name: "Hanging leg raise", muscle: "core", romM: 0.4, bodyweight: true },
];

export const LIFT_TEMPLATES: { id: string; name: string; hint: string; moves: string[] }[] = [
  { id: "push", name: "Push", hint: "Chest, shoulders, triceps", moves: ["bench", "ohp", "incline", "dip", "lateral", "tricep"] },
  { id: "pull", name: "Pull", hint: "Back and biceps", moves: ["deadlift", "row", "pullup", "lat", "face-pull", "curl"] },
  { id: "legs", name: "Legs", hint: "Squat and hinge", moves: ["squat", "rdl", "lunge", "leg-press", "hip-thrust", "calf"] },
  { id: "upper", name: "Upper", hint: "Push + pull", moves: ["bench", "row", "ohp", "lat", "curl", "tricep"] },
  { id: "lower", name: "Lower", hint: "Squat + hinge", moves: ["squat", "deadlift", "lunge", "hip-thrust", "calf"] },
  { id: "full", name: "Full body", hint: "One of each", moves: ["squat", "bench", "row", "rdl", "ohp"] },
];

export const REST_PRESETS = [60, 90, 120, 180] as const;

export type LiftSet = {
  id: string;
  reps: number;
  weightKg: number;
  done: boolean;
  warmup?: boolean;
};

export type LiftLine = {
  id: string;
  moveId: string;
  sets: LiftSet[];
};

export type LiftSession = {
  id: string;
  date: string;
  name: string;
  lines: LiftLine[];
  startedAt: number;
  finishedAt?: number;
};

export function moveById(id: string): LiftMove | undefined {
  return LIFT_MOVES.find((m) => m.id === id);
}

export function lineVolumeKg(line: LiftLine): number {
  let n = 0;
  for (const set of line.sets) {
    if (!set.done || set.warmup) continue;
    n += set.weightKg * set.reps;
  }
  return n;
}

export function sessionVolumeKg(session: LiftSession): number {
  return session.lines.reduce((sum, line) => sum + lineVolumeKg(line), 0);
}

export function sessionSetCount(session: LiftSession): number {
  return session.lines.reduce((sum, l) => sum + l.sets.filter((s) => s.done && !s.warmup).length, 0);
}

export function sessionRomM(session: LiftSession): number {
  let vol = 0;
  let weighted = 0;
  for (const line of session.lines) {
    const v = lineVolumeKg(line);
    vol += v;
    weighted += v * (moveById(line.moveId)?.romM ?? 0.5);
  }
  return vol > 0 ? weighted / vol : 0.5;
}

/** Epley estimated 1RM from a working set. */
export function epley1rm(weightKg: number, reps: number): number {
  if (reps <= 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

export function bestEpley(sessions: LiftSession[], moveId: string, exceptId?: string): number {
  let best = 0;
  for (const s of sessions) {
    if (s.id === exceptId) continue;
    for (const line of s.lines) {
      if (line.moveId !== moveId) continue;
      for (const set of line.sets) {
        if (!set.done || set.warmup || set.reps < 1) continue;
        best = Math.max(best, epley1rm(set.weightKg, set.reps));
      }
    }
  }
  return best;
}

/**
 * Compendium MET for resistance work, then raised by how much mass you actually moved.
 * A 40 kg session and a 200 kg session are not the same calorie cost.
 *
 * Time cost: kcal = MET × 3.5 × kg / 200 × min  (ACSM)
 * Mechanical cost: work / 0.22 efficiency (human muscle ~20–25%).
 * We blend so heavy, short sessions still count, and long light sessions do too.
 */
export function liftKcal(bodyKg: number, minutes: number, volumeKg: number, avgRomM = 0.5): number {
  const mins = Math.max(8, minutes);
  const intensity = volumeKg / Math.max(1, bodyKg * mins);
  let met = 3.5;
  if (intensity > 1.6) met = 6.0;
  else if (intensity > 0.9) met = 5.5;
  else if (intensity > 0.45) met = 5.0;
  else if (volumeKg > 0) met = 4.0;
  const timeKcal = (met * 3.5 * bodyKg * mins) / 200;
  const joules = volumeKg * 9.81 * avgRomM;
  const mechKcal = joules / 4184 / 0.22;
  const blended = timeKcal * 0.65 + mechKcal * 0.35;
  const epoc = 1.1;
  return Math.max(40, Math.round(blended * epoc));
}

export function previousLine(sessions: LiftSession[], moveId: string, exceptId?: string): LiftLine | undefined {
  for (let i = sessions.length - 1; i >= 0; i -= 1) {
    const s = sessions[i]!;
    if (s.id === exceptId) continue;
    const line = s.lines.find((l) => l.moveId === moveId);
    if (line && line.sets.some((x) => x.done)) return line;
  }
  return undefined;
}

/** Plates per side for a loaded barbell. Bar is 45 lb / 20 kg. */
export function platesPerSide(weightKg: number, imperial: boolean): { plate: number; count: number }[] {
  const bar = imperial ? 45 : 20;
  const plates = imperial ? [45, 35, 25, 10, 5, 2.5] : [25, 20, 15, 10, 5, 2.5, 1.25];
  const total = imperial ? weightKg * 2.2046226218 : weightKg;
  let remain = Math.max(0, (total - bar) / 2);
  const out: { plate: number; count: number }[] = [];
  for (const plate of plates) {
    const n = Math.floor((remain + 0.05) / plate);
    if (n <= 0) continue;
    out.push({ plate, count: n });
    remain -= n * plate;
  }
  return out;
}

export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
