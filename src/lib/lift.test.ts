import assert from "node:assert/strict";
import test from "node:test";
import { bestLifts, liftAnalyticsSummary, weeklyVolumeTrend } from "./lift.ts";
import type { LiftSession } from "./lift.ts";

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
