import assert from "node:assert/strict";
import test from "node:test";
import { substituteMoves } from "./exercises.ts";
import { EXERCISE_CLIPS } from "./exercise-clips.ts";
import {
  beatsPrevious,
  dropLoadKg,
  formatRecap,
  ghostSet,
  isUnilateral,
  moveById,
  pctOfBest,
  sessionPRs,
  suggestNextKg,
  volumeChangePct,
  warmupLoads,
  type LiftLine,
  type LiftSession,
} from "./lift.ts";
import {
  applyMissed,
  applyPerformanceAdjustment,
  applyVolumeCatchup,
  expectedWorkoutsForDate,
  generateProgram,
  programTitle,
  rebuildProgram,
  resolveStatus,
  scheduleMakeups,
  sessionAfterLift,
  sessionFuelDelta,
  sessionSkipped,
  swapMove,
} from "./program.ts";

test("each body goal gets a named week with 7 days", () => {
  const week = "2026-08-24";
  for (const kind of ["lose", "recomp", "maintain", "lean", "performance"] as const) {
    const p = generateProgram(week, kind);
    assert.equal(p.sessions.length, 7);
    assert.equal(p.sessions[0]!.date, "2026-08-24");
    assert.equal(p.sessions[6]!.date, "2026-08-30");
    assert.ok(programTitle(kind).length > 3);
  }
});

test("Cut week has lifts, walks, and a Sunday rest", () => {
  const p = generateProgram("2026-08-24", "lose");
  const kinds = p.sessions.map((s) => s.kind);
  assert.ok(kinds.filter((k) => k === "lift").length >= 3);
  assert.ok(kinds.filter((k) => k === "cardio").length >= 2);
  assert.equal(p.sessions[6]!.kind, "rest");
  assert.ok(p.sessions[0]!.moves.length >= 4);
});

test("Build week is five lift days", () => {
  const p = generateProgram("2026-08-24", "lean");
  assert.equal(p.sessions.filter((s) => s.kind === "lift").length, 5);
});

test("past planned sessions become missed", () => {
  const p = generateProgram("2026-08-24", "lose");
  const marked = applyMissed(p, "2026-08-27");
  assert.equal(resolveStatus(marked.sessions[0]!, "2026-08-27"), "missed");
  assert.equal(resolveStatus(marked.sessions[3]!, "2026-08-27"), "planned");
  const rest = marked.sessions.find((s) => s.kind === "rest");
  assert.equal(rest && resolveStatus(rest, "2026-08-27"), "planned");
});

test("a missed lift schedules a makeup on the next rest day", () => {
  const p = applyMissed(generateProgram("2026-08-24", "lean"), "2026-08-27");
  const withMakeup = scheduleMakeups(p, "2026-08-27");
  const makeup = withMakeup.sessions.find((s) => s.makeupOf);
  assert.ok(makeup);
  assert.equal(makeup!.kind, "lift");
  assert.ok(makeup!.date >= "2026-08-27");
  assert.ok(makeup!.moves.length >= 1);
  assert.ok(makeup!.name.startsWith("Makeup"));
});

test("skip means dinner does not count the planned burn", () => {
  const p = generateProgram("2026-08-24", "performance");
  const session = { ...p.sessions[0]!, status: "skipped" as const };
  const logged = expectedWorkoutsForDate({
    date: session.date,
    today: session.date,
    sessions: [session],
    logged: [],
    bodyKg: 80,
  });
  assert.equal(logged.length, 0);
  assert.equal(sessionSkipped(session, session.date), true);
  assert.equal(sessionAfterLift(session, session.date), false);
});

test("a planned future lift counts as expected work so dinner can plate ahead", () => {
  const p = generateProgram("2026-08-24", "lean");
  const session = p.sessions[0]!;
  const expected = expectedWorkoutsForDate({
    date: session.date,
    today: "2026-08-24",
    sessions: p.sessions,
    logged: [],
    bodyKg: 80,
  });
  assert.equal(expected.length, 1);
  assert.equal(expected[0]!.kind, "lift");
  assert.ok((expected[0]!.minutes ?? 0) >= 40);
});

test("changing the goal mid-week keeps done days and rewrites the rest", () => {
  let week = generateProgram("2026-08-24", "lose");
  week = {
    ...week,
    sessions: week.sessions.map((s, i) => (i === 0 ? { ...s, status: "done" } : s)),
  };
  const next = rebuildProgram(week, "2026-08-24", "performance", "2026-08-25");
  assert.equal(next.sessions[0]!.status, "done");
  assert.equal(next.sessions[0]!.name, week.sessions[0]!.name);
  assert.equal(next.goalKind, "performance");
  assert.equal(next.sessions[2]!.kind, "lift");
});

test("a new week does not inherit last week's statuses", () => {
  const prev = generateProgram("2026-08-17", "lose");
  const next = rebuildProgram(prev, "2026-08-24", "lose", "2026-08-24");
  assert.equal(next.weekStart, "2026-08-24");
  assert.ok(next.sessions.every((s) => s.status === "planned"));
});

test("Sunday on a Cut week turns rest into a makeup for missed lifts", () => {
  const p = rebuildProgram(null, "2026-08-24", "lose", "2026-08-30");
  const sun = p.sessions[6]!;
  assert.equal(sun.date, "2026-08-30");
  assert.equal(sun.kind, "lift");
  assert.ok(sun.makeupOf);
  assert.ok(sun.name.startsWith("Makeup"));
});

test("a lift session adds calories and protein so dinner can follow the work", () => {
  const p = generateProgram("2026-08-24", "lean");
  const lift = p.sessions.find((s) => s.kind === "lift")!;
  const delta = sessionFuelDelta(lift, 80);
  assert.ok(delta.burn > 80);
  assert.ok(delta.protein > 0);
  assert.ok(delta.carbs > 0);
  const rest = p.sessions.find((s) => s.kind === "rest")!;
  const zero = sessionFuelDelta(rest, 80);
  assert.equal(zero.burn, 0);
});

test("swapMove keeps the slot but changes the exercise", () => {
  const p = generateProgram("2026-08-24", "lose");
  const session = p.sessions.find((s) => s.kind === "lift")!;
  const from = session.moves[0]!.moveId;
  const next = swapMove(p, session.id, from, "goblet");
  const updated = next.sessions.find((s) => s.id === session.id)!;
  assert.equal(updated.moves[0]!.moveId, "goblet");
  assert.notEqual(from, "goblet");
});

test("missed lifts add a set to remaining planned days", () => {
  const p = applyMissed(generateProgram("2026-08-24", "lean"), "2026-08-27");
  const bumped = applyVolumeCatchup(p, "2026-08-27");
  const later = bumped.sessions.find((s) => s.date > "2026-08-27" && s.kind === "lift" && !s.makeupOf);
  assert.ok(later);
  assert.equal(later!.volumeBump, true);
  const orig = p.sessions.find((s) => s.id === later!.id)!;
  assert.equal(later!.moves[0]!.sets, orig.moves[0]!.sets + 1);
});

test("an easy last session adds a set to the next planned lift; a grind holds it back a set", () => {
  const p = generateProgram("2026-08-24", "lean");
  const orig = p.sessions.find((s) => s.kind === "lift")!;
  const doneLines = [{ id: "l", moveId: "bench", sets: [{ id: "s", reps: 8, weightKg: 80, done: true }] }];

  const easySession: LiftSession = {
    id: "e", date: "2026-08-23", name: "Push", startedAt: 1, finishedAt: 2, feel: "easy", lines: doneLines,
  };
  const bumped = applyPerformanceAdjustment(p, [easySession], "2026-08-24");
  const bumpedSession = bumped.sessions.find((s) => s.id === orig.id)!;
  assert.equal(bumpedSession.volumeBump, true);
  assert.equal(bumpedSession.moves[0]!.sets, orig.moves[0]!.sets + 1);

  const grindSession: LiftSession = {
    id: "g", date: "2026-08-23", name: "Push", startedAt: 1, finishedAt: 2, feel: "grind", lines: doneLines,
  };
  const held = applyPerformanceAdjustment(p, [grindSession], "2026-08-24");
  const heldSession = held.sessions.find((s) => s.id === orig.id)!;
  assert.equal(heldSession.volumeBump, true);
  assert.equal(heldSession.moves[0]!.sets, orig.moves[0]!.sets - 1);

  const rightSession: LiftSession = {
    id: "r", date: "2026-08-23", name: "Push", startedAt: 1, finishedAt: 2, feel: "right", lines: doneLines,
  };
  const unchanged = applyPerformanceAdjustment(p, [rightSession], "2026-08-24");
  assert.equal(unchanged, p);
});

test("substitutes stay on the same muscle", () => {
  const alts = substituteMoves("leg-curl", 6);
  assert.ok(alts.length >= 2);
  assert.ok(alts.every((e) => e.id !== "leg-curl"));
  assert.ok(alts.some((e) => e.primary.includes("hamstrings") || e.muscle === "legs"));
});

function line(rir: number, kg = 80): LiftLine {
  return {
    id: "l",
    moveId: "squat",
    sets: [{ id: "s", reps: 8, weightKg: kg, done: true, rir }],
  };
}

test("easy RIR adds load next time; grinders stay", () => {
  assert.equal(suggestNextKg(line(4, 80)), 82.5);
  assert.equal(suggestNextKg(line(0, 80)), 80);
  assert.equal(suggestNextKg(line(2, 80)), 80);
});

test("session feel can bump or hold even without RIR", () => {
  const mid = line(2, 80);
  assert.equal(suggestNextKg(mid, "easy"), 82.5);
  assert.equal(suggestNextKg(line(4, 80), "grind"), 80);
});

test("warm-up ladder is 50/70/85 of the working set", () => {
  assert.deepEqual(warmupLoads(100), [50, 70, 85]);
});

test("ghost last set and beat-last compare working sets only", () => {
  const prev: LiftLine = {
    id: "p",
    moveId: "squat",
    sets: [
      { id: "w", reps: 5, weightKg: 40, done: true, warmup: true },
      { id: "a", reps: 8, weightKg: 80, done: true },
      { id: "b", reps: 8, weightKg: 80, done: true },
    ],
  };
  assert.equal(ghostSet(prev, 0)?.weightKg, 80);
  assert.equal(beatsPrevious({ id: "n", reps: 8, weightKg: 82.5, done: false }, prev, 0), true);
  assert.equal(beatsPrevious({ id: "n", reps: 7, weightKg: 80, done: false }, prev, 0), false);
});

test("sessionPRs flags a move that beats every prior logged best, and only that move", () => {
  const prior: LiftSession[] = [
    {
      id: "a",
      date: "2026-08-20",
      name: "Push",
      startedAt: 1,
      lines: [
        { id: "l1", moveId: "bench", sets: [{ id: "s1", reps: 5, weightKg: 80, done: true }] },
        { id: "l2", moveId: "ohp", sets: [{ id: "s2", reps: 5, weightKg: 50, done: true }] },
      ],
    },
  ];
  const finished: LiftSession = {
    id: "b",
    date: "2026-08-27",
    name: "Push",
    startedAt: 1,
    lines: [
      { id: "l1", moveId: "bench", sets: [{ id: "s1", reps: 5, weightKg: 85, done: true }] },
      { id: "l2", moveId: "ohp", sets: [{ id: "s2", reps: 5, weightKg: 50, done: true }] },
      { id: "l3", moveId: "curl", sets: [{ id: "s3", reps: 8, weightKg: 12, done: true, warmup: true }] },
    ],
  };
  const prs = sessionPRs(prior, finished);
  assert.equal(prs.length, 1);
  assert.equal(prs[0]!.moveId, "bench");
  assert.equal(prs[0]!.weightKg, 85);
});

test("volume change is percent vs last session", () => {
  const mk = (id: string, kg: number): LiftSession => ({
    id,
    date: "2026-08-24",
    name: "Push",
    startedAt: 1,
    lines: [{ id: "l", moveId: "bench", sets: [{ id: "s", reps: 8, weightKg: kg, done: true }] }],
  });
  assert.equal(volumeChangePct(mk("b", 110), mk("a", 100)), 10);
});

test("clip names match the movement in the clip", () => {
  assert.equal(moveById("bench")?.name, "Bench press");
  assert.equal(moveById("ohp")?.name, "Overhead press");
  assert.equal(moveById("row")?.name, "Barbell row");
  assert.equal(moveById("cable-fly")?.name, "Seated machine fly");
  assert.equal(moveById("ab-wheel")?.name, "Ab wheel rollout");
  assert.equal(moveById("kickback")?.name, "Quadruped glute kickback");
  assert.equal(moveById("one-arm-cable-row")?.name, "Chest-supported one-arm row");
  assert.equal(moveById("pendulum-squat")?.name, "Pendulum squat");
  assert.equal(moveById("hanging-leg")?.name, "Hanging knee raise");
  assert.equal(moveById("spider-curl")?.name, "EZ-bar preacher curl");
  assert.equal(moveById("smith-shrug")?.name, "Smith shrug");
  assert.equal(moveById("goblet")?.name, "Goblet squat");
  assert.equal(moveById("sissy-squat")?.name, "Sissy squat");
  assert.equal(moveById("sumo-squat")?.name, "Sumo squat");
  assert.equal(EXERCISE_CLIPS.has("smith-shrug"), true);
  assert.equal(EXERCISE_CLIPS.has("bench"), true);
  assert.equal(EXERCISE_CLIPS.has("ohp"), true);
  assert.equal(EXERCISE_CLIPS.has("row"), true);
  assert.equal(EXERCISE_CLIPS.has("front-squat"), true);
  assert.equal(EXERCISE_CLIPS.has("ab-wheel"), true);
  assert.equal(EXERCISE_CLIPS.has("goblet"), false);
  assert.equal(EXERCISE_CLIPS.has("sissy-squat"), false);
  assert.equal(EXERCISE_CLIPS.has("sumo-squat"), false);
  assert.equal(EXERCISE_CLIPS.has("squat"), true);
});

test("drop load is 80 percent and recap names the work", () => {
  assert.equal(dropLoadKg(100), 80);
  assert.equal(pctOfBest(80, 100), 80);
  const recap = formatRecap(
    {
      id: "s",
      date: "2026-08-31",
      name: "Push",
      startedAt: 0,
      finishedAt: 60000,
      lines: [
        {
          id: "l",
          moveId: "bench",
          sets: [{ id: "a", reps: 8, weightKg: 80, done: true, rir: 2 }],
        },
      ],
    },
    false,
  );
  assert.match(recap, /Bench press/);
  assert.match(recap, /8×80@2/);
});

test("unilateral moves can log left and right", () => {
  assert.equal(isUnilateral("split-squat"), true);
  assert.equal(isUnilateral("kickback"), true);
  assert.equal(isUnilateral("squat"), false);
});
