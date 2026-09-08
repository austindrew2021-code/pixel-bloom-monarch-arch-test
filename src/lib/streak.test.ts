import assert from "node:assert/strict";
import test from "node:test";
import { brokenStreakInfo, cookStreak } from "./streak.ts";

test("cookStreak counts consecutive days ending today or yesterday", () => {
  assert.equal(cookStreak(["2026-03-16", "2026-03-17", "2026-03-18"], "2026-03-18"), 3);
  // today not yet cooked — streak still counts through yesterday.
  assert.equal(cookStreak(["2026-03-16", "2026-03-17"], "2026-03-18"), 2);
  assert.equal(cookStreak([], "2026-03-18"), 0);
});

test("brokenStreakInfo is null when yesterday was cooked", () => {
  const cooked = ["2026-03-15", "2026-03-16", "2026-03-17"];
  assert.equal(brokenStreakInfo(cooked, [], "2026-03-18"), null);
});

test("brokenStreakInfo is null when yesterday was already saved", () => {
  const cooked = ["2026-03-15", "2026-03-16"];
  assert.equal(brokenStreakInfo(cooked, ["2026-03-17"], "2026-03-18"), null);
});

test("brokenStreakInfo fires when a real streak (2+) broke yesterday", () => {
  const cooked = ["2026-03-14", "2026-03-15", "2026-03-16"]; // 3-night streak, then nothing on 03-17
  const info = brokenStreakInfo(cooked, [], "2026-03-18");
  assert.ok(info);
  assert.equal(info!.brokenDate, "2026-03-17");
  assert.equal(info!.priorStreak, 3);
});

test("brokenStreakInfo does not fire for a single missed night with no real streak on the line", () => {
  const cooked = ["2026-03-15"]; // one night, then a gap — not worth interrupting anyone for
  assert.equal(brokenStreakInfo(cooked, [], "2026-03-18"), null);
});

test("a saved date keeps counting toward the streak on the next break too", () => {
  // 03-14/15/16 cooked, 03-17 saved (not cooked), 03-18 not cooked -> breaks again.
  const cooked = ["2026-03-14", "2026-03-15", "2026-03-16"];
  const saved = ["2026-03-17"];
  const info = brokenStreakInfo(cooked, saved, "2026-03-19");
  assert.ok(info);
  assert.equal(info!.brokenDate, "2026-03-18");
  assert.equal(info!.priorStreak, 4, "the saved night should extend the streak, not reset it");
});
