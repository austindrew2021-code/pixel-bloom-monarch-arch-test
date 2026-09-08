import assert from "node:assert/strict";
import test from "node:test";
import { nearestWeightForDate } from "./progress-photos.ts";

test("nearestWeightForDate prefers an exact match", () => {
  const log = [
    { date: "2026-03-01", kg: 90 },
    { date: "2026-03-10", kg: 88 },
  ];
  assert.equal(nearestWeightForDate(log, "2026-03-10"), 88);
});

test("nearestWeightForDate falls back to the closest earlier entry", () => {
  const log = [
    { date: "2026-03-01", kg: 90 },
    { date: "2026-03-05", kg: 89 },
  ];
  assert.equal(nearestWeightForDate(log, "2026-03-08"), 89);
});

test("nearestWeightForDate falls back to the earliest later entry when nothing came before", () => {
  const log = [
    { date: "2026-03-10", kg: 88 },
    { date: "2026-03-20", kg: 87 },
  ];
  assert.equal(nearestWeightForDate(log, "2026-03-01"), 88);
});

test("nearestWeightForDate returns undefined for an empty log", () => {
  assert.equal(nearestWeightForDate([], "2026-03-01"), undefined);
});
