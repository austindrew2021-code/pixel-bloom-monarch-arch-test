import assert from "node:assert/strict";
import test from "node:test";
import {
  BOARD_ROWS,
  SLOT_COUNT,
  SLOT_POINTS,
  binomial,
  expectedPointsPerDrop,
  playDrop,
  resolvePath,
  slotOdds,
  verifyDrop,
} from "./plinko.ts";

test("the points table covers every slot and is symmetric", () => {
  assert.equal(SLOT_POINTS.length, SLOT_COUNT);
  for (let i = 0; i < SLOT_COUNT; i += 1) {
    assert.equal(
      SLOT_POINTS[i],
      SLOT_POINTS[SLOT_COUNT - 1 - i],
      `slot ${i} is not mirrored — one side of the board would pay better`,
    );
  }
});

test("the centre pays least and the edges pay most", () => {
  const centre = SLOT_POINTS[Math.floor(SLOT_COUNT / 2)]!;
  assert.equal(Math.min(...SLOT_POINTS), centre);
  assert.equal(Math.max(...SLOT_POINTS), SLOT_POINTS[0]);
});

test("binomial coefficients sum to the full path space", () => {
  let sum = 0;
  for (let k = 0; k <= BOARD_ROWS; k += 1) sum += binomial(BOARD_ROWS, k);
  assert.equal(sum, 2 ** BOARD_ROWS);
  assert.equal(binomial(16, 8), 12870);
  assert.equal(binomial(16, 0), 1);
});

test("expected points per drop stays just under 100", () => {
  // Pinned so a points-table edit cannot quietly change season-long totals,
  // which the prize ladder and the participation threshold were sized against.
  const ev = expectedPointsPerDrop();
  assert.ok(ev > 98 && ev < 100, `expected value drifted to ${ev}`);
  assert.equal(Math.round(ev * 10000), 989578);
});

test("slot odds form a proper distribution weighted to the centre", () => {
  const odds = slotOdds();
  assert.equal(odds.length, SLOT_COUNT);
  const total = odds.reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(total - 1) < 1e-12, `odds sum to ${total}`);
  assert.ok(odds[8]! > odds[0]!);
  // The jackpot edges really are one in sixty-five thousand.
  assert.equal(odds[0], 1 / 65536);
});

test("resolvePath counts rights as the landing slot", () => {
  assert.equal(resolvePath("0".repeat(16)).slot, 0);
  assert.equal(resolvePath("1".repeat(16)).slot, 16);
  assert.equal(resolvePath("1".repeat(8) + "0".repeat(8)).slot, 8);
  assert.equal(resolvePath("0".repeat(16)).points, SLOT_POINTS[0]);
});

test("resolvePath rejects malformed paths rather than scoring them", () => {
  assert.throws(() => resolvePath("101"), /must be 16 characters/);
  assert.throws(() => resolvePath("2".repeat(16)), /only contain/);
});

test("a drop replays identically and verifies", async () => {
  const drop = await playDrop("season-seed", "player-seed", 42);
  assert.equal(drop.path.length, BOARD_ROWS);
  assert.equal(drop.points, SLOT_POINTS[drop.slot]);
  assert.equal(await verifyDrop("season-seed", "player-seed", 42, drop), true);
});

test("verification fails when the server seed does not match the commitment", async () => {
  const drop = await playDrop("real-seed", "player-seed", 1);
  assert.equal(await verifyDrop("swapped-seed", "player-seed", 1, drop), false);
});

test("verification fails when a stored result was altered", async () => {
  const drop = await playDrop("season-seed", "player-seed", 3);
  const inflated = { ...drop, points: drop.points + 5000 };
  assert.equal(await verifyDrop("season-seed", "player-seed", 3, inflated), false);
  const moved = { ...drop, slot: (drop.slot + 1) % 17 };
  assert.equal(await verifyDrop("season-seed", "player-seed", 3, moved), false);
});

test("observed drops track the theoretical distribution", async () => {
  // A real sample, not a mocked one: catches derivation bugs that would make
  // the board pay out differently from the published odds table.
  const counts = new Array(SLOT_COUNT).fill(0);
  let points = 0;
  const runs = 3000;
  for (let nonce = 0; nonce < runs; nonce += 1) {
    const drop = await playDrop("distribution-seed", "player", nonce);
    counts[drop.slot] += 1;
    points += drop.points;
  }
  // The centre third should hold the clear majority of a binomial sample.
  const centre = counts.slice(6, 11).reduce((a, b) => a + b, 0);
  assert.ok(centre / runs > 0.6, `centre share ${centre / runs} is too thin`);
  // Mean points is dominated by rare edges, so allow a wide band.
  const mean = points / runs;
  assert.ok(mean > 40 && mean < 260, `sampled mean ${mean} is implausible`);
});
