import assert from "node:assert/strict";
import test from "node:test";
import {
  DROPS_PER_REWARDED_AD,
  EMPTY_ALLOWANCE,
  FREE_DROPS_PER_DAY,
  MAX_ADS_PER_DAY,
  MAX_BONUS_DROPS_PER_DAY,
  MAX_DROPS_PER_DAY,
  adsRemaining,
  canDrop,
  canWatchAd,
  dayKey,
  dropsAllowed,
  dropsRemaining,
  grantAdBonus,
  spendDrop,
} from "./allowance.ts";

test("a brand new day starts on the free baseline, no ad required", () => {
  assert.equal(dropsAllowed(EMPTY_ALLOWANCE), FREE_DROPS_PER_DAY);
  assert.equal(dropsRemaining(EMPTY_ALLOWANCE), FREE_DROPS_PER_DAY);
  assert.equal(canDrop(EMPTY_ALLOWANCE), true);
});

test("the free baseline alone clears the participation threshold in two days", () => {
  // The threshold must stay reachable without watching a single ad, or the
  // participation bonus would effectively cost the player something.
  assert.ok(FREE_DROPS_PER_DAY * 2 >= 50);
});

test("each rewarded ad adds its drops, up to the daily ceiling", () => {
  let allowance = EMPTY_ALLOWANCE;
  for (let i = 0; i < MAX_ADS_PER_DAY; i += 1) {
    allowance = grantAdBonus(allowance);
    assert.equal(allowance.bonusGranted, DROPS_PER_REWARDED_AD * (i + 1));
  }
  assert.equal(allowance.bonusGranted, MAX_BONUS_DROPS_PER_DAY);
  assert.equal(dropsAllowed(allowance), MAX_DROPS_PER_DAY);
});

test("extra ad callbacks past the cap are ignored, not stacked", () => {
  let allowance = EMPTY_ALLOWANCE;
  for (let i = 0; i < MAX_ADS_PER_DAY + 20; i += 1) allowance = grantAdBonus(allowance);
  assert.equal(allowance.bonusGranted, MAX_BONUS_DROPS_PER_DAY);
  assert.equal(canWatchAd(allowance), false);
  assert.equal(adsRemaining(allowance), 0);
});

test("a replayed ad callback cannot inflate the budget past the ceiling", () => {
  // Rewarded-video callbacks are retried by ad networks; a duplicate must be a
  // no-op rather than free drops.
  const maxed = { used: 0, bonusGranted: MAX_BONUS_DROPS_PER_DAY };
  assert.deepEqual(grantAdBonus(maxed), maxed);
  // Even a corrupted stored value is clamped when the budget is computed.
  assert.equal(dropsAllowed({ used: 0, bonusGranted: 9999 }), MAX_DROPS_PER_DAY);
});

test("adsRemaining counts down as videos are watched", () => {
  let allowance = EMPTY_ALLOWANCE;
  assert.equal(adsRemaining(allowance), MAX_ADS_PER_DAY);
  allowance = grantAdBonus(allowance);
  assert.equal(adsRemaining(allowance), MAX_ADS_PER_DAY - 1);
});

test("spending drops draws the budget down and then stops", () => {
  let allowance = EMPTY_ALLOWANCE;
  for (let i = 0; i < FREE_DROPS_PER_DAY; i += 1) allowance = spendDrop(allowance);
  assert.equal(dropsRemaining(allowance), 0);
  assert.equal(canDrop(allowance), false);
  assert.throws(() => spendDrop(allowance), /no drops remaining/);
});

test("an ad reopens play after the free baseline is spent", () => {
  let allowance: { used: number; bonusGranted: number } = EMPTY_ALLOWANCE;
  for (let i = 0; i < FREE_DROPS_PER_DAY; i += 1) allowance = spendDrop(allowance);
  assert.equal(canDrop(allowance), false);
  allowance = grantAdBonus(allowance);
  assert.equal(dropsRemaining(allowance), DROPS_PER_REWARDED_AD);
  assert.equal(canDrop(allowance), true);
});

test("remaining never goes negative even if used exceeds the budget", () => {
  assert.equal(dropsRemaining({ used: 500, bonusGranted: 0 }), 0);
});

test("spendDrop and grantAdBonus do not mutate their input", () => {
  const before = { used: 1, bonusGranted: 5 };
  spendDrop(before);
  grantAdBonus(before);
  assert.deepEqual(before, { used: 1, bonusGranted: 5 });
});

test("the day boundary is UTC so it falls at the same instant worldwide", () => {
  assert.equal(dayKey(new Date("2026-09-16T23:59:59Z")), "2026-09-16");
  assert.equal(dayKey(new Date("2026-09-17T00:00:00Z")), "2026-09-17");
});
