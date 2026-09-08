/** Strength math: volume, 1RM, plates, and calories that rise with the load on the bar. */

import { format, parseISO } from "date-fns";
import EXERCISE_DB from "./generated/exercise-db.json" with { type: "json" };
import { kgFromLb } from "./body.ts";
import { mondayOf, shiftWeek, weekDates } from "./week.ts";

export type Muscle = "legs" | "push" | "pull" | "core" | "full";

export type LiftMove = {
  id: string;
  name: string;
  muscle: Muscle;
  romM: number;
  bar?: boolean;
  bodyweight?: boolean;
  unilateral?: boolean;
  holdBased?: boolean;
  logUnit?: "reps" | "sec" | "m";
};

type RawExercise = {
  id: string;
  name: string;
  category: string;
  target: string;
  equipment: string;
  split: Muscle;
  romM: number;
  bar: boolean;
  bodyweight: boolean;
  unilateral: boolean;
  holdBased: boolean;
  logUnit: "reps" | "sec" | "m";
};
type RawExerciseDb = RawExercise[];

/** The full training catalog, derived from exercises/data/exercises.json by scripts/build-exercise-db.mjs. */
export const LIFT_MOVES: LiftMove[] = (EXERCISE_DB as RawExerciseDb).map((e) => ({
  id: e.id,
  name: e.name,
  muscle: e.split,
  romM: e.romM,
  bar: e.bar || undefined,
  bodyweight: e.bodyweight || undefined,
  unilateral: e.unilateral || undefined,
  holdBased: e.holdBased || undefined,
  logUnit: e.logUnit,
}));

/**
 * Picks one exercise per listed target, preferring a loadable barbell move
 * (the old hand-picked templates leaned on compounds) and skipping ids
 * already used earlier in the same template so repeated targets (e.g. two
 * "pectorals" slots on a push day) land on two different exercises.
 */
function pickTemplateMoves(targets: string[]): string[] {
  const db = EXERCISE_DB as RawExerciseDb;
  const used = new Set<string>();
  const picks: string[] = [];
  for (const target of targets) {
    const candidates = db.filter((e) => e.target === target && !used.has(e.id));
    if (candidates.length === 0) continue;
    const pick = candidates.find((e) => e.bar) ?? candidates[0]!;
    used.add(pick.id);
    picks.push(pick.id);
  }
  return picks;
}

export const LIFT_TEMPLATES: { id: string; name: string; hint: string; moves: string[] }[] = [
  {
    id: "push",
    name: "Push",
    hint: "Chest, shoulders, triceps",
    moves: pickTemplateMoves(["pectorals", "delts", "pectorals", "delts", "pectorals", "triceps"]),
  },
  {
    id: "pull",
    name: "Pull",
    hint: "Back and biceps",
    moves: pickTemplateMoves(["hamstrings", "lats", "lats", "lats", "delts", "biceps"]),
  },
  {
    id: "legs",
    name: "Legs",
    hint: "Squat and hinge",
    moves: pickTemplateMoves(["quads", "hamstrings", "quads", "quads", "glutes", "calves"]),
  },
  {
    id: "upper",
    name: "Upper",
    hint: "Push + pull",
    moves: pickTemplateMoves(["pectorals", "lats", "delts", "lats", "biceps", "triceps"]),
  },
  {
    id: "lower",
    name: "Lower",
    hint: "Squat + hinge",
    moves: pickTemplateMoves(["quads", "hamstrings", "quads", "glutes", "calves"]),
  },
  {
    id: "full",
    name: "Full body",
    hint: "One of each",
    moves: pickTemplateMoves(["quads", "pectorals", "lats", "hamstrings", "delts"]),
  },
];

export const REST_PRESETS = [60, 90, 120, 180] as const;

export type LiftSet = {
  id: string;
  reps: number;
  weightKg: number;
  done: boolean;
  warmup?: boolean;
  rir?: number;
  kind?: "work" | "drop" | "fail" | "amrap";
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

export type SessionPR = { moveId: string; weightKg: number; reps: number; est: number };

/** Moves in a just-finished session whose top set beats every prior logged best for that move. */
export function sessionPRs(priorSessions: LiftSession[], finished: LiftSession): SessionPR[] {
  const out: SessionPR[] = [];
  for (const line of finished.lines) {
    const working = line.sets.filter((s) => s.done && !s.warmup && s.reps >= 1 && s.weightKg > 0);
    if (!working.length) continue;
    const top = working.reduce((a, b) => (epley1rm(b.weightKg, b.reps) > epley1rm(a.weightKg, a.reps) ? b : a));
    const est = epley1rm(top.weightKg, top.reps);
    const prior = bestEpley(priorSessions, line.moveId);
    if (prior > 0 && est > prior) out.push({ moveId: line.moveId, weightKg: top.weightKg, reps: top.reps, est });
  }
  return out;
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

export function logUnit(moveId: string): "reps" | "sec" | "m" {
  return moveById(moveId)?.logUnit ?? "reps";
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

/** Rep count per warm-up rung, tapering down as the ramp gets heavier. */
export function warmupReps(workReps: number): number[] {
  return [1.5, 1, 0.5].map((mult) => Math.max(1, Math.round(workReps * mult)));
}

/**
 * True when the last two sessions that logged this move both look like a
 * grind (session feel or a last-set RIR of 1 or less) at the same working
 * weight — a real stall, not just one hard day, worth deloading rather than
 * repeating a third time.
 */
export function stalledAt(sessions: LiftSession[], moveId: string, exceptId?: string): boolean {
  const isGrind = (s: LiftSession): number | null => {
    const line = s.lines.find((l) => l.moveId === moveId);
    if (!line) return null;
    const last = previousWorkingSets(line).at(-1);
    if (!last) return null;
    const grind = s.feel === "grind" || (last.rir != null && last.rir <= 1);
    return grind ? last.weightKg : null;
  };
  const withMove = sessions
    .filter((s) => s.finishedAt && s.id !== exceptId)
    .filter((s) => s.lines.some((l) => l.moveId === moveId && l.sets.some((x) => x.done)));
  if (withMove.length < 2) return false;
  const w1 = isGrind(withMove.at(-1)!);
  const w2 = isGrind(withMove.at(-2)!);
  return w1 != null && w2 != null && Math.abs(w1 - w2) < 0.01;
}

/**
 * Next working weight for a move, layering stall detection on top of
 * suggestNextKg: two grinding sessions in a row at the same weight drops the
 * load 20% (the same deload used for an in-session drop set) instead of
 * suggesting the same weight a third time.
 */
export function nextWorkingKg(
  sessions: LiftSession[],
  moveId: string,
  prev?: LiftLine,
  feel?: SessionFeel,
  exceptId?: string,
): number | null {
  const base = suggestNextKg(prev, feel);
  if (base == null) return null;
  return stalledAt(sessions, moveId, exceptId) ? dropLoadKg(base) : base;
}

/** Nearest loadable barbell total at or below the target — real plates, not a rounded guess. */
export function snapToLoadable(weightKg: number, imperial: boolean): number {
  const bar = imperial ? 45 : 20;
  const perSide = platesPerSide(weightKg, imperial).reduce((n, p) => n + p.plate * p.count, 0);
  const totalDisplay = bar + perSide * 2;
  return imperial ? kgFromLb(totalDisplay) : totalDisplay;
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

export function isUnilateral(moveId: string): boolean {
  return moveById(moveId)?.unilateral === true;
}

/** How heavy this set is vs your estimated 1RM. */
export function pctOfBest(weightKg: number, best1rm: number): number | null {
  if (best1rm <= 0 || weightKg <= 0) return null;
  return Math.round((weightKg / best1rm) * 100);
}

export function dropLoadKg(weightKg: number): number {
  return Math.round(weightKg * 0.8 * 4) / 4;
}

export function formatRecap(session: LiftSession, imperial: boolean): string {
  const ms = (session.finishedAt ?? Date.now()) - session.startedAt;
  const lines = [`${session.name} · ${formatElapsed(ms)}`];
  for (const line of session.lines) {
    const move = moveById(line.moveId)?.name ?? line.moveId;
    const work = line.sets.filter((s) => s.done && !s.warmup);
    if (!work.length) continue;
    const bits = work.map((s) => {
      const w = imperial ? Math.round(s.weightKg * 2.2046226218) : Math.round(s.weightKg);
      const tag = s.kind === "drop" ? " D" : s.kind === "fail" ? " F" : s.kind === "amrap" ? " AMRAP" : "";
      const rir = s.rir != null ? `@${s.rir}` : "";
      return `${s.reps}×${w}${rir}${tag}`;
    });
    lines.push(`${move}  ${bits.join("  ")}`);
  }
  const vol = sessionVolumeKg(session);
  const shown = imperial ? Math.round(vol * 2.2046226218) : Math.round(vol);
  lines.push(`${shown} ${imperial ? "lb" : "kg"} moved`);
  return lines.join("\n");
}

export type LiftAnalyticsBucket = { sessions: number; volumeKg: number };
export type LiftAnalyticsSummary = {
  week: LiftAnalyticsBucket;
  month: LiftAnalyticsBucket;
  allTime: LiftAnalyticsBucket & { prCount: number };
};

const todayKey = () => format(new Date(), "yyyy-MM-dd");

/** This week / this month / all-time sessions, volume, and total PRs ever hit. */
export function liftAnalyticsSummary(liftSessions: LiftSession[], today = todayKey()): LiftAnalyticsSummary {
  const finished = liftSessions
    .filter((s) => s.finishedAt)
    .sort((a, b) => (a.finishedAt ?? 0) - (b.finishedAt ?? 0));
  const thisWeek = new Set(weekDates(mondayOf(parseISO(`${today}T12:00:00`))));
  const monthPrefix = today.slice(0, 7);

  const week: LiftAnalyticsBucket = { sessions: 0, volumeKg: 0 };
  const month: LiftAnalyticsBucket = { sessions: 0, volumeKg: 0 };
  const allTime = { sessions: 0, volumeKg: 0, prCount: 0 };

  for (let i = 0; i < finished.length; i += 1) {
    const session = finished[i]!;
    const vol = sessionVolumeKg(session);
    allTime.sessions += 1;
    allTime.volumeKg += vol;
    // PRs are relative to everything logged before this session, in order.
    allTime.prCount += sessionPRs(finished.slice(0, i), session).length;
    if (session.date.slice(0, 7) === monthPrefix) {
      month.sessions += 1;
      month.volumeKg += vol;
    }
    if (thisWeek.has(session.date)) {
      week.sessions += 1;
      week.volumeKg += vol;
    }
  }
  return {
    week: { sessions: week.sessions, volumeKg: Math.round(week.volumeKg) },
    month: { sessions: month.sessions, volumeKg: Math.round(month.volumeKg) },
    allTime: { sessions: allTime.sessions, volumeKg: Math.round(allTime.volumeKg), prCount: allTime.prCount },
  };
}

/** Total volume per week, oldest to newest, for the last `weeks` weeks including this one. */
export function weeklyVolumeTrend(liftSessions: LiftSession[], weeks = 8, today = todayKey()): number[] {
  const finished = liftSessions.filter((s) => s.finishedAt);
  const thisWeekStart = mondayOf(parseISO(`${today}T12:00:00`));
  const totals: number[] = [];
  for (let i = weeks - 1; i >= 0; i -= 1) {
    const start = shiftWeek(thisWeekStart, -i);
    const dates = new Set(weekDates(start));
    let sum = 0;
    for (const session of finished) {
      if (dates.has(session.date)) sum += sessionVolumeKg(session);
    }
    totals.push(Math.round(sum));
  }
  return totals;
}

export type BestLift = { moveId: string; name: string; best1rm: number };

/** Every move ever logged, ranked by best estimated 1RM, strongest first. */
export function bestLifts(liftSessions: LiftSession[], limit = 5): BestLift[] {
  const finished = liftSessions.filter((s) => s.finishedAt);
  const moveIds = new Set<string>();
  for (const session of finished) {
    for (const line of session.lines) moveIds.add(line.moveId);
  }
  return Array.from(moveIds)
    .map((moveId) => ({ moveId, name: moveById(moveId)?.name ?? moveId, best1rm: bestEpley(finished, moveId) }))
    .filter((m) => m.best1rm > 0)
    .sort((a, b) => b.best1rm - a.best1rm)
    .slice(0, limit);
}

