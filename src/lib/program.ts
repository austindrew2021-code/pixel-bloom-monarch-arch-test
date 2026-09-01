/** Next Gen training week: goal-specific sessions that drive dinner. */

import type { EquipmentAccess, GoalKind } from "./body.ts";
import { normalizeEquipmentAccess, normalizeGoalKind } from "./body.ts";
import { EXERCISES, exerciseById, type Exercise } from "./exercises.ts";
import { lastFinishedSession, type LiftSession } from "./lift.ts";
import type { Workout, WorkoutKind } from "./types.ts";
import { weekDates } from "./week.ts";

export type SessionKind = "lift" | "cardio" | "rest";
export type SessionStatus = "planned" | "done" | "skipped" | "missed";

export type ProgramMove = {
  moveId: string;
  sets: number;
  reps: string;
  restSec: number;
};

export type ProgramSession = {
  id: string;
  date: string;
  weekday: number;
  name: string;
  kind: SessionKind;
  status: SessionStatus;
  minutes: number;
  moves: ProgramMove[];
  cardioKind?: WorkoutKind;
  why: string;
  makeupOf?: string;
  volumeBump?: boolean;
};

export type ProgramWeek = {
  weekStart: string;
  goalKind: GoalKind;
  sessions: ProgramSession[];
  generatedAt: number;
};

/** [target muscle from exercises/data's `target` field, sets, reps, restSec]. */
type MoveSlot = [string, number, string, number];

type Blueprint = {
  name: string;
  kind: SessionKind;
  minutes: number;
  moves?: MoveSlot[];
  cardioKind?: WorkoutKind;
  why: string;
};

/** FNV-1a — deterministic so the same (week, day, slot) always picks the same exercise. */
function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function candidatesForTarget(target: string, equipmentAccess: EquipmentAccess): Exercise[] {
  const wantBodyweight = equipmentAccess === "bodyweight";
  const trainable = EXERCISES.filter((e) => e.target === target && !e.isStretch);
  const exact = trainable.filter((e) => !wantBodyweight || e.bodyweight);
  if (exact.length > 0) return exact;
  // No no-equipment move exists for this target — better a real exercise than an empty slot.
  return trainable;
}

/**
 * Picks one exercise for a training slot from the full 1,324-exercise
 * catalog: matches the slot's target muscle, honors the equipment toggle
 * when possible, avoids repeating an exercise already used earlier in the
 * same session, and is seeded off the week/day/slot so the pick is stable
 * across re-renders of the same week but rotates from week to week.
 */
function pickExerciseForTarget(
  target: string,
  equipmentAccess: EquipmentAccess,
  seed: string,
  excludeIds: Set<string>,
): Exercise | undefined {
  const pool = candidatesForTarget(target, equipmentAccess);
  if (pool.length === 0) return undefined;
  const fresh = pool.filter((e) => !excludeIds.has(e.id));
  const from = fresh.length > 0 ? fresh : pool;
  const sorted = [...from].sort((a, b) => a.id.localeCompare(b.id));
  return sorted[hashSeed(seed) % sorted.length];
}

function fromBlueprint(
  b: Blueprint,
  equipmentAccess: EquipmentAccess,
  seedPrefix: string,
): Omit<ProgramSession, "id" | "date" | "weekday" | "status"> {
  const used = new Set<string>();
  const moves: ProgramMove[] = [];
  (b.moves ?? []).forEach(([target, sets, reps, restSec], i) => {
    const ex = pickExerciseForTarget(target, equipmentAccess, `${seedPrefix}-${i}-${target}`, used);
    if (!ex) return;
    used.add(ex.id);
    moves.push({ moveId: ex.id, sets, reps, restSec });
  });
  return {
    name: b.name,
    kind: b.kind,
    minutes: b.minutes,
    moves,
    cardioKind: b.cardioKind,
    why: b.why,
  };
}

const REST: Blueprint = {
  name: "Rest",
  kind: "rest",
  minutes: 0,
  why: "Walk if you want. Dinner stays near the daily target — no training carbs stacked on.",
};

/**
 * Each slot names a `target` from exercises/data/exercises.json (e.g.
 * "pectorals", "lats", "quads") rather than a literal exercise id —
 * fromBlueprint() resolves each slot to a concrete exercise from the full
 * catalog at generation time, honoring the equipment toggle and rotating
 * week to week. The sets/reps/rest progression below is the same
 * goal-specific periodization the app always used; only which exact
 * exercise fills each slot is now dynamic.
 */
function templates(kind: GoalKind): Blueprint[] {
  if (kind === "lose") {
    return [
      {
        name: "Full strength",
        kind: "lift",
        minutes: 50,
        why: "Keep muscle on a cut. Tonight needs protein more than extra carbs.",
        moves: [
          ["quads", 4, "6-8", 150],
          ["pectorals", 3, "8-10", 120],
          ["lats", 3, "8-10", 120],
          ["hamstrings", 3, "8-10", 120],
          ["abs", 3, "30-45s", 45],
        ],
      },
      {
        name: "Zone 2 walk",
        kind: "cardio",
        minutes: 40,
        cardioKind: "walk",
        why: "Easy burn that does not wreck recovery. Dinner stays protein-forward, not a pasta night.",
      },
      {
        name: "Push",
        kind: "lift",
        minutes: 45,
        why: "Upper volume without a huge calorie dump. Close protein at dinner.",
        moves: [
          ["delts", 4, "6-8", 150],
          ["pectorals", 3, "8-10", 120],
          ["pectorals", 3, "10-12", 90],
          ["delts", 3, "12-15", 60],
          ["triceps", 3, "12-15", 60],
        ],
      },
      {
        name: "Intervals",
        kind: "cardio",
        minutes: 25,
        cardioKind: "run",
        why: "Short and hard. A little extra carb is fair; keep the plate lean.",
      },
      {
        name: "Pull + hinge",
        kind: "lift",
        minutes: 50,
        why: "Posterior chain so the cut does not flatten you. Protein at dinner, carbs modest.",
        moves: [
          ["hamstrings", 3, "5", 180],
          ["lats", 3, "8-12", 90],
          ["lats", 3, "8-12", 90],
          ["delts", 3, "12-15", 60],
          ["biceps", 3, "10-12", 60],
        ],
      },
      {
        name: "Easy walk",
        kind: "cardio",
        minutes: 35,
        cardioKind: "walk",
        why: "Optional steps. Skip it and dinner does not change much.",
      },
      REST,
    ];
  }
  if (kind === "recomp") {
    return [
      {
        name: "Push",
        kind: "lift",
        minutes: 50,
        why: "Build the upper body at near-maintenance. Dinner should actually close protein.",
        moves: [
          ["pectorals", 4, "6-8", 150],
          ["delts", 3, "6-8", 120],
          ["pectorals", 3, "8-10", 90],
          ["delts", 3, "12-15", 60],
          ["pectorals", 3, "8-12", 90],
          ["triceps", 2, "12-15", 60],
        ],
      },
      {
        name: "Pull",
        kind: "lift",
        minutes: 50,
        why: "Rows and lats. A normal plate — not a surplus, not a cut dinner.",
        moves: [
          ["lats", 4, "6-8", 150],
          ["lats", 3, "8-12", 90],
          ["lats", 3, "6-10", 120],
          ["delts", 3, "12-15", 60],
          ["biceps", 3, "10-12", 60],
          ["biceps", 2, "10-12", 60],
        ],
      },
      REST,
      {
        name: "Legs",
        kind: "lift",
        minutes: 55,
        why: "Squat and hinge. Carbs at dinner earn their place tonight.",
        moves: [
          ["quads", 4, "6-8", 150],
          ["hamstrings", 3, "8-10", 120],
          ["quads", 3, "8-10", 90],
          ["glutes", 3, "8-12", 90],
          ["calves", 3, "12-15", 60],
        ],
      },
      {
        name: "Upper",
        kind: "lift",
        minutes: 45,
        why: "Push plus pull to finish the week. Keep protein high, calories near the line.",
        moves: [
          ["pectorals", 3, "8-12", 90],
          ["lats", 3, "8-12", 90],
          ["delts", 3, "8-10", 90],
          ["lats", 3, "8-12", 90],
          ["biceps", 2, "10-12", 60],
          ["triceps", 2, "12-15", 60],
        ],
      },
      {
        name: "Zone 2",
        kind: "cardio",
        minutes: 35,
        cardioKind: "walk",
        why: "Conditioning without eating the lift. Dinner stays measured.",
      },
      REST,
    ];
  }
  if (kind === "lean") {
    return [
      {
        name: "Push A",
        kind: "lift",
        minutes: 55,
        why: "Heavy press day. Surplus is small — carbs at dinner, not dessert as dinner.",
        moves: [
          ["pectorals", 4, "6-8", 150],
          ["delts", 4, "6-8", 150],
          ["pectorals", 3, "8-10", 120],
          ["delts", 3, "12-15", 60],
          ["pectorals", 3, "8-12", 90],
          ["triceps", 3, "12-15", 60],
        ],
      },
      {
        name: "Pull A",
        kind: "lift",
        minutes: 55,
        why: "Rows and chins. Eat the extra protein; keep the surplus honest.",
        moves: [
          ["hamstrings", 3, "5", 180],
          ["lats", 4, "6-8", 150],
          ["lats", 3, "8-12", 90],
          ["lats", 3, "6-10", 120],
          ["delts", 3, "12-15", 60],
          ["biceps", 3, "10-12", 60],
        ],
      },
      {
        name: "Legs A",
        kind: "lift",
        minutes: 60,
        why: "Biggest session of the week. Plate the carbs tonight.",
        moves: [
          ["quads", 4, "5-8", 180],
          ["hamstrings", 3, "8-10", 120],
          ["quads", 3, "10-12", 90],
          ["quads", 3, "8-10", 90],
          ["hamstrings", 3, "10-12", 75],
          ["calves", 3, "12-15", 60],
        ],
      },
      REST,
      {
        name: "Push B",
        kind: "lift",
        minutes: 50,
        why: "Volume press. Still a surplus day — do not skip dinner after this.",
        moves: [
          ["delts", 4, "6-8", 150],
          ["pectorals", 3, "8-12", 90],
          ["pectorals", 3, "12-15", 75],
          ["delts", 3, "12-15", 60],
          ["triceps", 3, "10-12", 75],
          ["triceps", 2, "8-10", 90],
        ],
      },
      {
        name: "Pull B",
        kind: "lift",
        minutes: 50,
        why: "More back volume. Protein and a normal carb plate.",
        moves: [
          ["lats", 4, "6-10", 120],
          ["lats", 3, "8-12", 90],
          ["lats", 3, "10-12", 75],
          ["delts", 3, "12-15", 60],
          ["biceps", 3, "10-12", 60],
          ["biceps", 2, "10-12", 60],
        ],
      },
      REST,
    ];
  }
  if (kind === "performance") {
    return [
      {
        name: "Chest + triceps",
        kind: "lift",
        minutes: 65,
        why: "Bodybuilding volume. Eat the carbs — this is a fuel day, not a cut.",
        moves: [
          ["pectorals", 4, "6-8", 150],
          ["pectorals", 4, "8-10", 120],
          ["pectorals", 3, "12-15", 75],
          ["pectorals", 3, "8-12", 90],
          ["triceps", 3, "8-10", 90],
          ["triceps", 3, "12-15", 60],
        ],
      },
      {
        name: "Back + biceps",
        kind: "lift",
        minutes: 65,
        why: "Big pulling day. Keep calories and carbs up tonight.",
        moves: [
          ["hamstrings", 3, "5", 180],
          ["lats", 4, "6-8", 150],
          ["lats", 4, "8-12", 90],
          ["lats", 3, "6-10", 120],
          ["biceps", 3, "10-12", 60],
          ["biceps", 3, "10-12", 60],
        ],
      },
      {
        name: "Legs",
        kind: "lift",
        minutes: 70,
        why: "Highest burn of the week. Dinner should look like training food.",
        moves: [
          ["quads", 5, "5-8", 180],
          ["hamstrings", 4, "8-10", 120],
          ["quads", 3, "8-10", 90],
          ["quads", 3, "10-12", 90],
          ["glutes", 3, "8-12", 90],
          ["calves", 4, "12-15", 60],
        ],
      },
      {
        name: "Shoulders",
        kind: "lift",
        minutes: 50,
        why: "Delts and upper back. Carbs stay in the plan.",
        moves: [
          ["delts", 4, "6-8", 150],
          ["delts", 4, "12-15", 60],
          ["delts", 3, "12-15", 60],
          ["delts", 3, "12-15", 60],
          ["traps", 3, "10-12", 75],
        ],
      },
      {
        name: "Arms + core",
        kind: "lift",
        minutes: 45,
        why: "Shorter session. Still eat enough — this week is a surplus.",
        moves: [
          ["biceps", 3, "10-12", 60],
          ["biceps", 3, "10-12", 60],
          ["biceps", 2, "10-12", 60],
          ["triceps", 3, "10-12", 75],
          ["triceps", 3, "12-15", 60],
          ["abs", 3, "8-12", 60],
          ["abs", 3, "30-45s", 45],
        ],
      },
      {
        name: "Conditioning",
        kind: "cardio",
        minutes: 25,
        cardioKind: "class",
        why: "Optional work capacity. Skip it if the week already landed.",
      },
      REST,
    ];
  }
  return [
    {
      name: "Full body A",
      kind: "lift",
      minutes: 45,
      why: "One of each pattern. Dinner stays balanced — no extra surplus.",
      moves: [
        ["quads", 3, "6-8", 150],
        ["pectorals", 3, "6-8", 120],
        ["lats", 3, "8-10", 120],
        ["hamstrings", 3, "8-10", 120],
        ["abs", 3, "30-45s", 45],
      ],
    },
    {
      name: "Walk",
      kind: "cardio",
      minutes: 30,
      cardioKind: "walk",
      why: "Easy movement. Dinner does not need a bump.",
    },
    REST,
    {
      name: "Full body B",
      kind: "lift",
      minutes: 45,
      why: "Same idea, different pressing and pulling. Balanced plate.",
      moves: [
        ["hamstrings", 3, "5", 180],
        ["delts", 3, "6-8", 120],
        ["lats", 3, "8-12", 90],
        ["quads", 3, "8-10", 90],
        ["delts", 3, "12-15", 60],
      ],
    },
    REST,
    {
      name: "Walk",
      kind: "cardio",
      minutes: 30,
      cardioKind: "walk",
      why: "Optional steps. Skip and the plate stays put.",
    },
    REST,
  ];
}

export function programTitle(kind: GoalKind | string | undefined): string {
  const id = normalizeGoalKind(kind);
  if (id === "lose") return "Cut strength";
  if (id === "recomp") return "Lean split";
  if (id === "lean") return "Build PPL";
  if (id === "performance") return "Bodybuilding split";
  return "Hold & train";
}

export function programHint(kind: GoalKind | string | undefined): string {
  const id = normalizeGoalKind(kind);
  if (id === "lose") return "Four lifts, two walks. Protein first. Skip a session and dinner drops the training carbs.";
  if (id === "recomp") return "Four lifts plus easy cardio. Dinners stay near maintenance and move when you do.";
  if (id === "lean") return "Five lift days. Miss one and a rest day becomes a makeup; dinner still follows the work.";
  if (id === "performance") return "Five hard sessions. Eat the carbs on lift days. Skip and the plate gets quieter.";
  return "Two full-body days and walks. Dinner stays even unless you actually train.";
}

export function generateProgram(
  weekStart: string,
  goalKind: GoalKind | string | undefined,
  equipmentAccess: EquipmentAccess | string | undefined = "full",
): ProgramWeek {
  const kind = normalizeGoalKind(goalKind);
  const access = normalizeEquipmentAccess(equipmentAccess);
  const dates = weekDates(weekStart);
  const days = templates(kind);
  return {
    weekStart,
    goalKind: kind,
    generatedAt: Date.now(),
    sessions: dates.map((date, weekday) => {
      const b = days[weekday] ?? REST;
      return {
        id: `${weekStart}-${weekday}-${kind}-${access}`,
        date,
        weekday,
        status: "planned",
        ...fromBlueprint(b, access, `${weekStart}-${kind}-${access}-${weekday}`),
      };
    }),
  };
}

export function resolveStatus(session: ProgramSession, today: string): SessionStatus {
  if (session.status === "done" || session.status === "skipped" || session.status === "missed") {
    return session.status;
  }
  if (session.kind === "rest") return "planned";
  if (session.date < today) return "missed";
  return "planned";
}

export function applyMissed(week: ProgramWeek, today: string): ProgramWeek {
  return {
    ...week,
    sessions: week.sessions.map((s) => {
      const status = resolveStatus(s, today);
      return status === s.status ? s : { ...s, status };
    }),
  };
}

export function scheduleMakeups(week: ProgramWeek, today: string): ProgramWeek {
  const missed = week.sessions.filter((s) => s.status === "missed" && s.kind === "lift" && !s.makeupOf);
  if (missed.length === 0) return week;
  const already = week.sessions.some((s) => s.makeupOf);
  if (already) return week;
  const rest = week.sessions.find((s) => s.kind === "rest" && s.date >= today && s.status === "planned");
  if (!rest) return week;
  const source = missed[0]!;
  return {
    ...week,
    sessions: week.sessions.map((s) => {
      if (s.id !== rest.id) return s;
      return {
        ...s,
        kind: "lift" as const,
        name: `Makeup · ${source.name}`,
        minutes: Math.max(25, source.minutes - 15),
        moves: source.moves.slice(0, 4),
        why: `Makeup for missed ${source.name}. Compounds only — dinner follows this session, not the rest day.`,
        makeupOf: source.id,
        cardioKind: undefined,
      };
    }),
  };
}

export function rebuildProgram(
  prev: ProgramWeek | null | undefined,
  weekStart: string,
  goalKind: GoalKind | string | undefined,
  today: string,
  liftSessions: LiftSession[] = [],
  equipmentAccess: EquipmentAccess | string | undefined = "full",
): ProgramWeek {
  const fresh = generateProgram(weekStart, goalKind, equipmentAccess);
  if (!prev || prev.weekStart !== weekStart) {
    const built = applyVolumeCatchup(scheduleMakeups(applyMissed(fresh, today), today), today);
    return applyPerformanceAdjustment(built, liftSessions, today);
  }
  const merged: ProgramWeek = {
    ...fresh,
    generatedAt: prev.generatedAt,
    sessions: fresh.sessions.map((s) => {
      const old = prev.sessions.find((x) => x.date === s.date);
      if (!old) return s;
      if (old.status === "done" || old.status === "skipped" || old.status === "missed") {
        return { ...old, id: s.id };
      }
      if (s.date < today && old.kind !== "rest") {
        return { ...old, id: s.id, status: "missed" };
      }
      if (old.makeupOf || old.volumeBump) return { ...old, id: s.id };
      return s;
    }),
  };
  const built = applyVolumeCatchup(scheduleMakeups(applyMissed(merged, today), today), today);
  return applyPerformanceAdjustment(built, liftSessions, today);
}

export function sessionAsWorkout(session: ProgramSession, bodyKg: number): Workout | null {
  if (session.kind === "rest") return null;
  if (session.kind === "cardio") {
    return {
      id: `planned-${session.id}`,
      date: session.date,
      kind: session.cardioKind ?? "walk",
      minutes: session.minutes,
    };
  }
  const sets = session.moves.reduce((n, m) => n + m.sets, 0);
  const volumeKg = Math.round(bodyKg * 5.5 * Math.max(4, sets));
  return {
    id: `planned-${session.id}`,
    date: session.date,
    kind: "lift",
    minutes: session.minutes,
    volumeKg,
  };
}

export function expectedWorkoutsForDate(input: {
  date: string;
  today: string;
  sessions: ProgramSession[];
  logged: Workout[];
  bodyKg: number;
}): Workout[] {
  const logged = input.logged.filter((w) => w.date === input.date);
  const session = input.sessions.find((s) => s.date === input.date);
  if (!session || session.kind === "rest") return logged;
  const status = resolveStatus(session, input.today);
  if (status === "skipped" || status === "missed") return logged;
  if (status === "done") return logged.length > 0 ? logged : [sessionAsWorkout(session, input.bodyKg)!].filter(Boolean);
  if (logged.length > 0) return logged;
  const planned = sessionAsWorkout(session, input.bodyKg);
  return planned ? [planned] : [];
}

export function sessionAfterLift(session: ProgramSession | undefined, today: string): boolean {
  if (!session) return false;
  const status = resolveStatus(session, today);
  return session.kind === "lift" && (status === "planned" || status === "done");
}

export function sessionSkipped(session: ProgramSession | undefined, today: string): boolean {
  if (!session) return false;
  const status = resolveStatus(session, today);
  return status === "skipped" || status === "missed";
}

export function sessionAfterCardio(session: ProgramSession | undefined, today: string): boolean {
  if (!session) return false;
  const status = resolveStatus(session, today);
  return session.kind === "cardio" && (status === "planned" || status === "done");
}

export function programSummary(week: ProgramWeek, today: string): {
  lift: number;
  cardio: number;
  rest: number;
  done: number;
  skipped: number;
  missed: number;
  left: number;
} {
  let lift = 0;
  let cardio = 0;
  let rest = 0;
  let done = 0;
  let skipped = 0;
  let missed = 0;
  let left = 0;
  for (const raw of week.sessions) {
    const s = { ...raw, status: resolveStatus(raw, today) };
    if (s.kind === "lift") lift += 1;
    else if (s.kind === "cardio") cardio += 1;
    else rest += 1;
    if (s.kind === "rest") continue;
    if (s.status === "done") done += 1;
    else if (s.status === "skipped") skipped += 1;
    else if (s.status === "missed") missed += 1;
    else left += 1;
  }
  return { lift, cardio, rest, done, skipped, missed, left };
}

export function patchSession(week: ProgramWeek, id: string, patch: Partial<ProgramSession>): ProgramWeek {
  return {
    ...week,
    sessions: week.sessions.map((s) => (s.id === id ? { ...s, ...patch } : s)),
  };
}

export function matchLoggedToSession(session: ProgramSession, workouts: Workout[]): boolean {
  if (session.kind === "rest") return false;
  const day = workouts.filter((w) => w.date === session.date);
  if (session.kind === "lift") return day.some((w) => w.kind === "lift");
  if (session.kind === "cardio") {
    const want = session.cardioKind;
    return day.some((w) => w.kind === want || w.kind === "run" || w.kind === "walk" || w.kind === "ride" || w.kind === "class");
  }
  return day.length > 0;
}

export function sessionMuscles(session: ProgramSession): string[] {
  const seen = new Set<string>();
  for (const m of session.moves) {
    const ex = exerciseById(m.moveId);
    for (const id of ex?.primary ?? []) seen.add(id);
  }
  return [...seen];
}

export function isProgramWeek(value: unknown): value is ProgramWeek {
  if (!value || typeof value !== "object") return false;
  const v = value as ProgramWeek;
  return typeof v.weekStart === "string" && Array.isArray(v.sessions) && typeof v.goalKind === "string";
}

export function sessionFuelDelta(
  session: ProgramSession,
  bodyKg: number,
): { burn: number; protein: number; carbs: number } {
  const w = sessionAsWorkout(session, bodyKg);
  if (!w) return { burn: 0, protein: 0, carbs: 0 };
  const met = w.kind === "lift" ? 5 : w.kind === "run" ? 9.8 : w.kind === "walk" ? 4.3 : 6;
  const burn = Math.round((met * 3.5 * bodyKg * Math.max(1, w.minutes)) / 200);
  const proteinPerKg = w.kind === "lift" ? 0.12 : 0.04;
  const carbPerKg = w.kind === "lift" ? 0.08 : 0.2;
  return {
    burn,
    protein: Math.round(proteinPerKg * bodyKg * (w.minutes / 45)),
    carbs: Math.round(carbPerKg * bodyKg * (w.minutes / 45)),
  };
}

export function dinnerFollowsCopy(session: ProgramSession, status: SessionStatus, plated?: string): string {
  if (session.kind === "rest") return "Rest day. Dinner stays near the daily target.";
  if (status === "done") return plated ? `Logged. Dinner is ${plated}.` : "Logged. Fuel updated tonight.";
  if (status === "skipped") {
    return plated ? `Skipped. Tonight is ${plated} — training carbs dropped.` : "Skipped. Dinner dropped the training carbs.";
  }
  if (status === "missed") return "Missed. A rest day later this week may pick this up, and tonight stays lighter.";
  if (session.kind === "lift") return "Finish this and dinner keeps the training carbs. Skip and the plate gets quieter.";
  return "Log the walk and Fuel notices. Skip and dinner barely moves.";
}

export function swapMove(week: ProgramWeek, sessionId: string, fromId: string, toId: string): ProgramWeek {
  const next = exerciseById(toId);
  return {
    ...week,
    sessions: week.sessions.map((s) => {
      if (s.id !== sessionId) return s;
      return {
        ...s,
        moves: s.moves.map((m) =>
          m.moveId === fromId
            ? {
                ...m,
                moveId: toId,
                sets: next?.defaultSets ?? m.sets,
                reps: next?.defaultReps ?? m.reps,
                restSec: next?.restSec ?? m.restSec,
              }
            : m,
        ),
      };
    }),
  };
}

export function applyVolumeCatchup(week: ProgramWeek, today: string): ProgramWeek {
  const missed = week.sessions.filter((s) => resolveStatus(s, today) === "missed" && s.kind === "lift").length;
  if (missed === 0) return week;
  return {
    ...week,
    sessions: week.sessions.map((s) => {
      if (s.volumeBump) return s;
      if (s.date < today || s.kind !== "lift" || resolveStatus(s, today) !== "planned") return s;
      if (s.makeupOf) return s;
      return {
        ...s,
        volumeBump: true,
        minutes: s.minutes + 8,
        why: `${s.why} Extra set on the opener after a missed day.`,
        moves: s.moves.map((m, i) => (i === 0 ? { ...m, sets: m.sets + 1 } : m)),
      };
    }),
  };
}

/**
 * Reads how the last finished lift session actually felt and nudges this
 * week's still-planned lift sessions accordingly — an easy session earns an
 * extra set on the opener, a grind holds it back a set. Skips sessions the
 * attendance catch-up already touched so the two adjustments never stack.
 */
export function applyPerformanceAdjustment(week: ProgramWeek, liftSessions: LiftSession[], today: string): ProgramWeek {
  const last = lastFinishedSession(liftSessions);
  if (!last || !last.feel || last.feel === "right") return week;
  const bump = last.feel === "easy";
  return {
    ...week,
    sessions: week.sessions.map((s) => {
      if (s.volumeBump || s.makeupOf) return s;
      if (s.kind !== "lift" || s.date < today || resolveStatus(s, today) !== "planned") return s;
      const opener = s.moves[0];
      if (!opener) return s;
      if (!bump && opener.sets <= 2) return s;
      return {
        ...s,
        volumeBump: true,
        why: bump
          ? `${s.why} Last session felt easy — added a set on the opener.`
          : `${s.why} Last session was a grind — held the opener back a set.`,
        moves: s.moves.map((m, i) => (i === 0 ? { ...m, sets: bump ? m.sets + 1 : m.sets - 1 } : m)),
      };
    }),
  };
}

export function weekVolume(week: ProgramWeek): number {
  return week.sessions.reduce((n, s) => n + s.moves.reduce((m, x) => m + x.sets, 0), 0);
}
