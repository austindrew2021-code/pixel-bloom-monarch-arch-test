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
  { id: "rdl", name: "Dumbbell RDL", muscle: "legs", romM: 0.55 },
  { id: "deadlift", name: "Deadlift", muscle: "full", romM: 0.65, bar: true },
  { id: "lunge", name: "Walking lunge", muscle: "legs", romM: 0.5 },
  { id: "hip-thrust", name: "Hip thrust", muscle: "legs", romM: 0.4, bar: true },
  { id: "leg-press", name: "Leg press", muscle: "legs", romM: 0.45 },
  { id: "calf", name: "Standing calf raise", muscle: "legs", romM: 0.2 },
  { id: "bench", name: "Bench press", muscle: "push", romM: 0.4, bar: true },
  { id: "incline", name: "Incline bench", muscle: "push", romM: 0.4, bar: true },
  { id: "ohp", name: "Overhead press", muscle: "push", romM: 0.55, bar: true },
  { id: "dip", name: "Dip", muscle: "push", romM: 0.4, bodyweight: true },
  { id: "pushup", name: "Push-up", muscle: "push", romM: 0.35, bodyweight: true },
  { id: "fly", name: "Dumbbell fly", muscle: "push", romM: 0.4 },
  { id: "tricep", name: "Cable pushdown", muscle: "push", romM: 0.3 },
  { id: "lateral", name: "Dumbbell lateral raise", muscle: "push", romM: 0.4 },
  { id: "row", name: "Barbell row", muscle: "pull", romM: 0.45, bar: true },
  { id: "pullup", name: "Pull-up", muscle: "pull", romM: 0.55, bodyweight: true },
  { id: "lat", name: "Lat pulldown", muscle: "pull", romM: 0.55 },
  { id: "face-pull", name: "Face pull", muscle: "pull", romM: 0.35 },
  { id: "curl", name: "Dumbbell curl", muscle: "pull", romM: 0.35 },
  { id: "hammer", name: "Hammer curl", muscle: "pull", romM: 0.35 },
  { id: "shrug", name: "Dumbbell shrug", muscle: "pull", romM: 0.25 },
  { id: "smith-shrug", name: "Smith shrug", muscle: "pull", romM: 0.25 },
  { id: "swing", name: "Kettlebell swing", muscle: "full", romM: 0.7 },
  { id: "farmer", name: "Farmer carry", muscle: "full", romM: 0.15 },
  { id: "plank", name: "Plank", muscle: "core", romM: 0.1, bodyweight: true },
  { id: "hanging-leg", name: "Hanging knee raise", muscle: "core", romM: 0.4, bodyweight: true },
  { id: "step-up", name: "Step-up", muscle: "legs", romM: 0.5 },
  { id: "leg-curl", name: "Lying leg curl", muscle: "legs", romM: 0.35 },
  { id: "leg-ext", name: "Leg extension", muscle: "legs", romM: 0.35 },
  { id: "chest-press", name: "Machine chest press", muscle: "push", romM: 0.4 },
  { id: "seated-row", name: "Seated cable row", muscle: "pull", romM: 0.45 },
  { id: "cable-row", name: "Close-grip seated row", muscle: "pull", romM: 0.45 },
  { id: "rear-fly", name: "Rear delt fly", muscle: "pull", romM: 0.3 },
  { id: "good-morning", name: "Good morning", muscle: "legs", romM: 0.5, bar: true },
  { id: "skullcrusher", name: "Skull crusher", muscle: "push", romM: 0.3, bar: true },
  { id: "preacher", name: "Dumbbell preacher curl", muscle: "pull", romM: 0.3 },
  { id: "pullover", name: "Dumbbell pullover", muscle: "pull", romM: 0.4 },
  { id: "crunch", name: "Crunch", muscle: "core", romM: 0.2, bodyweight: true },
  { id: "woodchop", name: "Standing woodchop", muscle: "core", romM: 0.5 },
  { id: "hip-abduction", name: "Hip abduction", muscle: "legs", romM: 0.3 },
  { id: "reverse-lunge", name: "Reverse lunge", muscle: "legs", romM: 0.5 },
  { id: "close-grip", name: "Close-grip bench", muscle: "push", romM: 0.35, bar: true },
  { id: "chin-up", name: "Chin-up", muscle: "pull", romM: 0.55, bodyweight: true },
  { id: "ham-slide", name: "Sliding floor curl", muscle: "legs", romM: 0.4, bodyweight: true },
  { id: "nordic", name: "Nordic hamstring curl", muscle: "legs", romM: 0.45, bodyweight: true },
  { id: "cossack", name: "Cossack squat", muscle: "legs", romM: 0.55 },
  { id: "kickback", name: "Quadruped glute kickback", muscle: "legs", romM: 0.4, bodyweight: true },
  { id: "glute-bridge", name: "Glute bridge", muscle: "legs", romM: 0.3, bodyweight: true },
  { id: "pec-deck", name: "Pec deck", muscle: "push", romM: 0.35 },
  { id: "arnold", name: "Arnold press", muscle: "push", romM: 0.45 },
  { id: "hack-squat", name: "Hack squat", muscle: "legs", romM: 0.55 },
  { id: "cable-fly", name: "Standing cable fly", muscle: "push", romM: 0.4 },
  { id: "suspension-curl", name: "Suspension leg curl", muscle: "legs", romM: 0.4, bodyweight: true },
  { id: "concentration", name: "Concentration curl", muscle: "pull", romM: 0.3 },
  { id: "hip-adduction", name: "Hip adduction", muscle: "legs", romM: 0.25 },
  { id: "decline", name: "Decline bench", muscle: "push", romM: 0.4, bar: true },
  { id: "decline-db", name: "Decline dumbbell press", muscle: "push", romM: 0.4 },
  { id: "cable-crossover", name: "Cable crossover", muscle: "push", romM: 0.4 },
  { id: "incline-db", name: "Incline dumbbell press", muscle: "push", romM: 0.4 },
  { id: "db-bench", name: "Dumbbell bench", muscle: "push", romM: 0.4 },
  { id: "straight-arm-pulldown", name: "Straight-arm pulldown", muscle: "pull", romM: 0.45 },
  { id: "one-arm-row", name: "One-arm dumbbell row", muscle: "pull", romM: 0.4 },
  { id: "t-bar-row", name: "T-bar row", muscle: "pull", romM: 0.45, bar: true },
  { id: "chest-supported-row", name: "Chest-supported row", muscle: "pull", romM: 0.4 },
  { id: "one-arm-cable-row", name: "Chest-supported one-arm row", muscle: "pull", romM: 0.45 },
  { id: "smith-squat", name: "Smith squat", muscle: "legs", romM: 0.65 },
  { id: "sumo-squat", name: "Sumo squat", muscle: "legs", romM: 0.6 },
  { id: "seated-leg-curl", name: "Seated leg curl", muscle: "legs", romM: 0.35 },
  { id: "sissy-squat", name: "Sissy squat", muscle: "legs", romM: 0.4, bodyweight: true },
  { id: "pendulum-squat", name: "Pendulum squat", muscle: "legs", romM: 0.55 },
  { id: "donkey-kick", name: "Donkey kick", muscle: "legs", romM: 0.35, bodyweight: true },
  { id: "pull-through", name: "Cable pull-through", muscle: "legs", romM: 0.45 },
  { id: "seated-db-press", name: "Seated dumbbell press", muscle: "push", romM: 0.5 },
  { id: "cable-lateral", name: "Cable lateral raise", muscle: "push", romM: 0.4 },
  { id: "front-raise", name: "Dumbbell front raise", muscle: "push", romM: 0.4 },
  { id: "machine-press", name: "Machine shoulder press", muscle: "push", romM: 0.5 },
  { id: "reverse-pec-deck", name: "Reverse pec deck", muscle: "pull", romM: 0.3 },
  { id: "upright-row", name: "Dumbbell upright row", muscle: "pull", romM: 0.35 },
  { id: "cable-curl", name: "Cable curl", muscle: "pull", romM: 0.35 },
  { id: "ez-curl", name: "EZ-bar curl", muscle: "pull", romM: 0.35, bar: true },
  { id: "spider-curl", name: "EZ-bar preacher curl", muscle: "pull", romM: 0.3, bar: true },
  { id: "incline-curl", name: "Incline curl", muscle: "pull", romM: 0.35 },
  { id: "preacher-machine", name: "Machine preacher curl", muscle: "pull", romM: 0.3 },
  { id: "overhead-ext", name: "Overhead dumbbell extension", muscle: "push", romM: 0.3 },
  { id: "tricep-kickback", name: "Dumbbell kickback", muscle: "push", romM: 0.3 },
  { id: "overhead-cable", name: "Overhead cable extension", muscle: "push", romM: 0.3 },
  { id: "bench-dip", name: "Bench dip", muscle: "push", romM: 0.35, bodyweight: true },
  { id: "bicycle", name: "Bicycle crunch", muscle: "core", romM: 0.25, bodyweight: true },
  { id: "sit-up", name: "Sit-up", muscle: "core", romM: 0.3, bodyweight: true },
  { id: "reverse-crunch", name: "Reverse crunch", muscle: "core", romM: 0.25, bodyweight: true },
  { id: "russian-twist", name: "Russian twist", muscle: "core", romM: 0.25, bodyweight: true },
  { id: "cable-crunch", name: "Cable crunch", muscle: "core", romM: 0.3 },
  { id: "v-up", name: "V-up", muscle: "core", romM: 0.35, bodyweight: true },
  { id: "flutter-kick", name: "Flutter kick", muscle: "core", romM: 0.15, bodyweight: true },
  { id: "decline-situp", name: "Decline sit-up", muscle: "core", romM: 0.35, bodyweight: true },
  { id: "machine-crunch", name: "Machine crunch", muscle: "core", romM: 0.25 },
  { id: "seated-calf", name: "Seated calf raise", muscle: "legs", romM: 0.15 },
  { id: "single-calf", name: "Single-leg calf raise", muscle: "legs", romM: 0.2, bodyweight: true },
  { id: "jump-rope", name: "Jump rope", muscle: "full", romM: 0.15, bodyweight: true },
  { id: "mountain-climber", name: "Mountain climber", muscle: "full", romM: 0.3, bodyweight: true },
  { id: "jumping-jack", name: "Jumping jack", muscle: "full", romM: 0.25, bodyweight: true },
  { id: "high-knees", name: "High knees", muscle: "full", romM: 0.3, bodyweight: true },
  { id: "burpee", name: "Burpee", muscle: "full", romM: 0.5, bodyweight: true },
  { id: "bike", name: "Exercise bike", muscle: "full", romM: 0.35 },
  { id: "jump-squat", name: "Jump squat", muscle: "legs", romM: 0.5, bodyweight: true },
  { id: "rower", name: "Rowing machine", muscle: "full", romM: 0.55 },
  { id: "sprint", name: "Sprint", muscle: "full", romM: 0.6, bodyweight: true },
  { id: "battle-rope", name: "Battle rope", muscle: "full", romM: 0.4 },
];

export const LIFT_TEMPLATES: { id: string; name: string; hint: string; moves: string[] }[] = [
  { id: "push", name: "Push", hint: "Chest, shoulders, triceps", moves: ["bench", "seated-db-press", "incline", "dip", "lateral", "tricep"] },
  { id: "pull", name: "Pull", hint: "Back and biceps", moves: ["deadlift", "seated-row", "pullup", "lat", "face-pull", "curl"] },
  { id: "legs", name: "Legs", hint: "Squat and hinge", moves: ["squat", "rdl", "lunge", "leg-press", "hip-thrust", "calf"] },
  { id: "upper", name: "Upper", hint: "Push + pull", moves: ["bench", "seated-row", "seated-db-press", "lat", "curl", "tricep"] },
  { id: "lower", name: "Lower", hint: "Squat + hinge", moves: ["squat", "deadlift", "lunge", "hip-thrust", "calf"] },
  { id: "full", name: "Full body", hint: "One of each", moves: ["squat", "bench", "seated-row", "rdl", "seated-db-press"] },
];

export const REST_PRESETS = [60, 90, 120, 180] as const;

export type LiftSet = {
  id: string;
  reps: number;
  weightKg: number;
  done: boolean;
  warmup?: boolean;
  rir?: number;
  kind?: "work" | "drop" | "fail";
  side?: "L" | "R";
};

export type LiftLine = {
  id: string;
  moveId: string;
  sets: LiftSet[];
  note?: string;
  pairId?: string;
};

export type LiftSession = {
  id: string;
  date: string;
  name: string;
  lines: LiftLine[];
  startedAt: number;
  finishedAt?: number;
  feel?: SessionFeel;
};

export type SessionFeel = "easy" | "right" | "grind";

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

const HOLD_MOVES = new Set([
  "plank",
  "jump-rope",
  "bike",
  "rower",
  "sprint",
  "battle-rope",
  "mountain-climber",
  "high-knees",
  "jumping-jack",
]);

export function logUnit(moveId: string): "reps" | "sec" | "m" {
  if (moveId === "farmer") return "m";
  if (HOLD_MOVES.has(moveId)) return "sec";
  return "reps";
}

export function displayStep(imperial: boolean): number {
  return imperial ? 5 : 2.5;
}

/** Next working weight from last RIR and how the session felt. Easy sets go up; grinders stay. */
export function suggestNextKg(prev?: LiftLine, feel?: SessionFeel): number | null {
  const last = prev?.sets.filter((s) => s.done && !s.warmup).at(-1);
  if (!last || last.weightKg <= 0) return null;
  const rir = last.rir;
  const bump = feel === "easy" || (rir != null && rir >= 3);
  const hold = feel === "grind" || (rir != null && rir <= 1);
  if (bump && !hold) return Math.round((last.weightKg + 2.5) * 4) / 4;
  return last.weightKg;
}

export function warmupLoads(workKg: number): number[] {
  return [0.5, 0.7, 0.85].map((p) => Math.round(workKg * p * 4) / 4);
}

export function lastWorkingRir(line?: LiftLine): number | undefined {
  return line?.sets.filter((s) => s.done && !s.warmup).at(-1)?.rir;
}

export function previousWorkingSets(line?: LiftLine): LiftSet[] {
  return line?.sets.filter((s) => s.done && !s.warmup) ?? [];
}

/** Matching working set from last time, skipping warm-ups. */
export function ghostSet(prev: LiftLine | undefined, workIndex: number): LiftSet | undefined {
  return previousWorkingSets(prev)[workIndex];
}

export function beatsPrevious(set: LiftSet, prev: LiftLine | undefined, workIndex: number): boolean {
  const prior = ghostSet(prev, workIndex);
  if (!prior) return false;
  return (
    set.weightKg >= prior.weightKg &&
    set.reps >= prior.reps &&
    (set.weightKg > prior.weightKg || set.reps > prior.reps)
  );
}

export function previousSessionForMove(
  sessions: LiftSession[],
  moveId: string,
  exceptId?: string,
): LiftSession | undefined {
  for (let i = sessions.length - 1; i >= 0; i -= 1) {
    const s = sessions[i]!;
    if (s.id === exceptId) continue;
    if (s.lines.some((l) => l.moveId === moveId && l.sets.some((x) => x.done))) return s;
  }
}

export function lastFinishedSession(sessions: LiftSession[], exceptId?: string): LiftSession | undefined {
  for (let i = sessions.length - 1; i >= 0; i -= 1) {
    const s = sessions[i]!;
    if (s.id === exceptId) continue;
    if (s.lines.some((l) => l.sets.some((x) => x.done))) return s;
  }
}

/** Percent volume change vs the last finished session. Null if there is no baseline. */
export function volumeChangePct(curr: LiftSession, prev?: LiftSession): number | null {
  if (!prev) return null;
  const a = sessionVolumeKg(prev);
  if (a <= 0) return null;
  return Math.round(((sessionVolumeKg(curr) - a) / a) * 100);
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

const UNILATERAL = new Set([
  "split-squat",
  "lunge",
  "reverse-lunge",
  "one-arm-row",
  "one-arm-cable-row",
  "single-calf",
  "kickback",
  "donkey-kick",
  "concentration",
  "tricep-kickback",
]);

export function isUnilateral(moveId: string): boolean {
  return UNILATERAL.has(moveId);
}
