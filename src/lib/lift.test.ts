import assert from "node:assert/strict";
import test from "node:test";
import {
  bestLifts,
  liftAnalyticsSummary,
  nextWorkingKg,
  snapToLoadable,
  stalledAt,
  warmupReps,
  weeklyVolumeTrend,
} from "./lift.ts";
import type { LiftSession, SessionFeel } from "./lift.ts";

function session(id: string, date: string, finishedAt: number, kg: number, reps = 5): LiftSession {
  return {
    id,
    date,
    name: "Push",
    startedAt: finishedAt - 1000,
    finishedAt,
    lines: [
      {
        id: `${id}-line`,
        moveId: "bench",
        sets: [{ id: `${id}-set`, reps, weightKg: kg, done: true }],
      },
    ],
  };
}

function feltSession(
  id: string,
  finishedAt: number,
  kg: number,
  opts: { feel?: SessionFeel; rir?: number } = {},
): LiftSession {
  return {
    id,
    date: `2026-02-${String(finishedAt).padStart(2, "0")}`,
    name: "Push",
    startedAt: finishedAt - 1000,
    finishedAt,
    feel: opts.feel,
    lines: [
      {
        id: `${id}-line`,
        moveId: "bench",
        sets: [{ id: `${id}-set`, reps: 5, weightKg: kg, done: true, rir: opts.rir }],
      },
    ],
  };
}

test("liftAnalyticsSummary buckets sessions into week, month, and all-time", () => {
  const today = "2026-03-18"; // a Wednesday
  const sessions = [
    session("s1", "2026-03-16", 1, 100), // Monday this week
    session("s2", "2026-03-05", 2, 100), // earlier this month
    session("s3", "2026-01-10", 3, 100), // a different month
  ];
  const summary = liftAnalyticsSummary(sessions, today);
  assert.equal(summary.week.sessions, 1);
  assert.equal(summary.month.sessions, 2);
  assert.equal(summary.allTime.sessions, 3);
  assert.ok(summary.allTime.volumeKg > 0);
});

test("liftAnalyticsSummary counts a PR only once, the first time a move is beaten", () => {
  const sessions = [
    session("s1", "2026-01-01", 1, 60, 5),
    session("s2", "2026-01-03", 2, 65, 5), // beats s1 -> PR
    session("s3", "2026-01-05", 3, 65, 5), // ties, not a new PR
    session("s4", "2026-01-07", 4, 70, 5), // beats s2 -> PR
  ];
  const summary = liftAnalyticsSummary(sessions, "2026-01-10");
  assert.equal(summary.allTime.prCount, 2);
});

test("liftAnalyticsSummary ignores sessions that were started but never finished", () => {
  const unfinished: LiftSession = {
    id: "u1",
    date: "2026-03-16",
    name: "Push",
    startedAt: 1,
    lines: [{ id: "l", moveId: "bench", sets: [{ id: "s", reps: 5, weightKg: 100, done: true }] }],
  };
  const summary = liftAnalyticsSummary([unfinished], "2026-03-18");
  assert.equal(summary.allTime.sessions, 0);
  assert.equal(summary.week.sessions, 0);
});

test("weeklyVolumeTrend returns one total per week, oldest first, for the requested span", () => {
  const today = "2026-03-18";
  const sessions = [session("s1", "2026-03-16", 1, 100, 5)];
  const trend = weeklyVolumeTrend(sessions, 4, today);
  assert.equal(trend.length, 4);
  assert.equal(trend[3], 500, `expected this week's total (${JSON.stringify(trend)}) to land in the last slot`);
  assert.equal(trend[0], 0);
});

test("bestLifts ranks moves by best estimated 1RM, strongest first, and skips moves never worked", () => {
  const sessions: LiftSession[] = [
    {
      id: "s1",
      date: "2026-01-01",
      name: "Full body",
      startedAt: 1,
      finishedAt: 1,
      lines: [
        { id: "l1", moveId: "squat", sets: [{ id: "a", reps: 5, weightKg: 140, done: true }] },
        { id: "l2", moveId: "bench", sets: [{ id: "b", reps: 5, weightKg: 90, done: true }] },
        { id: "l3", moveId: "row", sets: [{ id: "c", reps: 5, weightKg: 0, done: false }] },
      ],
    },
  ];
  const ranked = bestLifts(sessions, 5);
  assert.equal(ranked[0]?.moveId, "squat");
  assert.equal(ranked[1]?.moveId, "bench");
  assert.equal(ranked.some((r) => r.moveId === "row"), false, "an unworked move should not appear");
});

test("stalledAt is false with fewer than two sessions on the move", () => {
  assert.equal(stalledAt([feltSession("s1", 1, 100, { feel: "grind" })], "bench"), false);
});

test("stalledAt is true after two grinding sessions in a row at the same weight", () => {
  const sessions = [
    feltSession("s1", 1, 100, { feel: "grind" }),
    feltSession("s2", 2, 100, { feel: "grind" }),
  ];
  assert.equal(stalledAt(sessions, "bench"), true);
});

test("stalledAt is false when the weight changed between the two grinds", () => {
  const sessions = [
    feltSession("s1", 1, 97.5, { feel: "grind" }),
    feltSession("s2", 2, 100, { feel: "grind" }),
  ];
  assert.equal(stalledAt(sessions, "bench"), false);
});

test("stalledAt is false when only the most recent session was a grind", () => {
  const sessions = [
    feltSession("s1", 1, 100, { feel: "easy" }),
    feltSession("s2", 2, 100, { feel: "grind" }),
  ];
  assert.equal(stalledAt(sessions, "bench"), false);
});

test("stalledAt also fires from a rir of 1 or less without an explicit grind feel", () => {
  const sessions = [feltSession("s1", 1, 100, { rir: 0 }), feltSession("s2", 2, 100, { rir: 1 })];
  assert.equal(stalledAt(sessions, "bench"), true);
});

test("nextWorkingKg behaves like suggestNextKg when there is no stall", () => {
  const sessions = [feltSession("s1", 1, 100, { feel: "easy" })];
  const prev = sessions[0]!.lines[0]!;
  assert.equal(nextWorkingKg(sessions, "bench", prev, "easy"), 102.5);
});

test("nextWorkingKg drops the weight ~20% on a real two-session stall instead of holding a third time", () => {
  const sessions = [
    feltSession("s1", 1, 100, { feel: "grind" }),
    feltSession("s2", 2, 100, { feel: "grind" }),
  ];
  const prev = sessions[1]!.lines[0]!;
  assert.equal(nextWorkingKg(sessions, "bench", prev, "grind"), 80);
});

test("warmupReps tapers down from the work set and never drops below 1", () => {
  assert.deepEqual(warmupReps(8), [12, 8, 4]);
  assert.deepEqual(warmupReps(1), [2, 1, 1]);
});

test("snapToLoadable rounds down to a real plate-loadable total", () => {
  assert.equal(snapToLoadable(61, false), 60); // 20 bar + 2x20kg = 60, next plate would overshoot
  assert.equal(snapToLoadable(20, false), 20); // bar alone
  const snapped = snapToLoadable(60, true);
  assert.ok(snapped <= 60, "never rounds up past the target");
  assert.equal(snapToLoadable(snapped, true), snapped, "an already-loadable weight snaps to itself");
});
