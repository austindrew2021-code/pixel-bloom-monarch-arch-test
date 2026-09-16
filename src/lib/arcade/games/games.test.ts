import assert from "node:assert/strict";
import test from "node:test";
import { GAMES, GAME_IDS, isGameId, openMinesRound, playGame } from "./index.ts";
import { createStream } from "./rng.ts";
import { TARGET_EV } from "./types.ts";
import * as ascent from "./ascent.ts";
import * as coinflip from "./coinflip.ts";
import * as mines from "./mines.ts";
import * as tumble from "./tumble.ts";

const SEED = "games-test-server-seed";

/* ------------------------------------------------------------------ shared */

test("every game is tuned to the same expected value", () => {
  // The property that keeps the arcade honest: one leaderboard, one shared
  // budget of free drops, so a game that paid more per drop would make every
  // other game pointless. Closed-form games are checked exactly here; Tumble is
  // measured by sample below.
  for (const coins of [2, 3, 4, 5]) {
    assert.equal(coinflip.expectedPoints(coins), TARGET_EV, `coin match, ${coins} coins`);
  }
  for (const target of [1.2, 1.5, 2, 5, 10, 33.33, 50]) {
    assert.ok(
      Math.abs(ascent.expectedPoints(target) - TARGET_EV) < 1e-9,
      `ascent at ${target}x pays ${ascent.expectedPoints(target)}`,
    );
  }
  for (const mineCount of mines.MINE_CHOICES) {
    for (const picks of [1, 2, 5, 10]) {
      if (picks > mines.GRID_SIZE - mineCount) continue;
      const ev = mines.expectedPoints(mineCount, picks);
      // Rounding to whole points moves the mean a fraction either way.
      assert.ok(
        Math.abs(ev - TARGET_EV) < 1,
        `mines ${mineCount}/${picks} pays ${ev}`,
      );
    }
  }
});

test("the registry is internally consistent", () => {
  for (const id of GAME_IDS) {
    assert.equal(GAMES[id].id, id);
    assert.ok(GAMES[id].name.length > 0);
    assert.ok(GAMES[id].byteBudget > 0);
  }
  assert.equal(isGameId("coinflip"), true);
  assert.equal(isGameId("roulette"), true);
  assert.equal(isGameId("baccarat"), false, "an unregistered name must not resolve");
});

test("every game replays identically from the same seed and nonce", async () => {
  for (const id of GAME_IDS) {
    if (GAMES[id].interactive) continue;
    const a = await playGame(id, SEED, "client", 7, { coins: 3, target: 2 });
    const b = await playGame(id, SEED, "client", 7, { coins: 3, target: 2 });
    assert.deepEqual(a, b, `${id} is not deterministic`);
  }
});

test("a different nonce gives a different round", async () => {
  // Same seeds, next drop — if these matched, every round of a session would be
  // the same round.
  const results = await Promise.all(
    [0, 1, 2, 3, 4, 5].map((n) => playGame("tumble", SEED, "client", n)),
  );
  assert.ok(new Set(results.map((r) => JSON.stringify(r.detail))).size > 1);
});

test("no game ever awards negative points", async () => {
  for (const id of GAME_IDS) {
    if (GAMES[id].interactive) continue;
    for (let nonce = 0; nonce < 60; nonce += 1) {
      const r = await playGame(id, SEED, "c", nonce, { coins: 5, target: 3 });
      assert.ok(r.points >= 0, `${id} paid ${r.points}`);
    }
  }
});

test("interactive games refuse to resolve in a single call", async () => {
  await assert.rejects(() => playGame("mines", SEED, "c", 0), /over a round/);
});

/* --------------------------------------------------------------- coinflip */

test("coin match pays per coin and adds the bonus only on a sweep", async () => {
  const stream = await createStream(SEED, "c", 0, coinflip.BYTE_BUDGET);
  const result = coinflip.play(stream, 3);
  const detail = result.detail as unknown as coinflip.CoinFlipDetail;
  assert.equal(detail.faces.length, 3);
  assert.equal(detail.basePoints, coinflip.POINTS_PER_COIN * 3);
  assert.equal(detail.matched, detail.faces === detail.faces[0]!.repeat(3));
  assert.equal(detail.bonusPoints, detail.matched ? coinflip.MATCH_BONUS[3] : 0);
  assert.equal(result.points, detail.basePoints + detail.bonusPoints);
});

test("coin match rejects coin counts outside the offered range", async () => {
  const stream = await createStream(SEED, "c", 0, coinflip.BYTE_BUDGET);
  assert.throws(() => coinflip.play(stream, 1), /coins must be/);
  assert.throws(() => coinflip.play(stream, 6), /coins must be/);
  assert.equal(coinflip.isValidCoinCount(2.5), false);
});

test("sweep chance halves with each added coin", () => {
  assert.equal(coinflip.sweepChance(2), 1 / 2);
  assert.equal(coinflip.sweepChance(3), 1 / 4);
  assert.equal(coinflip.sweepChance(5), 1 / 16);
});

test("observed sweeps track the theoretical rate", async () => {
  let sweeps = 0;
  const runs = 2000;
  for (let nonce = 0; nonce < runs; nonce += 1) {
    const stream = await createStream(SEED, "sweeps", nonce, coinflip.BYTE_BUDGET);
    if ((coinflip.play(stream, 3).detail as { matched: boolean }).matched) sweeps += 1;
  }
  const rate = sweeps / runs;
  assert.ok(rate > 0.21 && rate < 0.29, `sweep rate ${rate} is off 0.25`);
});

/* ----------------------------------------------------------------- ascent */

test("ascent pays the target when it clears and nothing extra when it busts", async () => {
  const stream = await createStream(SEED, "c", 1, ascent.BYTE_BUDGET);
  const result = ascent.play(stream, 2);
  const detail = result.detail as unknown as ascent.AscentDetail;
  assert.equal(detail.cleared, detail.bust >= 2);
  assert.equal(detail.winPoints, detail.cleared ? Math.round(ascent.WIN_BASE * 2) : 0);
  assert.equal(result.points, ascent.PARTICIPATION_POINTS + detail.winPoints);
  assert.ok(result.points >= ascent.PARTICIPATION_POINTS, "a bust still pays participation");
});

test("ascent rejects targets outside range or with too much precision", () => {
  assert.equal(ascent.isValidTarget(1.19), false);
  assert.equal(ascent.isValidTarget(50.01), false);
  assert.equal(ascent.isValidTarget(2.005), false, "three decimals would break the odds");
  assert.equal(ascent.isValidTarget(2.5), true);
  assert.equal(ascent.isValidTarget(Number.NaN), false);
});

test("the bust point is never below 1", async () => {
  for (let nonce = 0; nonce < 500; nonce += 1) {
    const stream = await createStream(SEED, "bust", nonce, ascent.BYTE_BUDGET);
    assert.ok(ascent.bustPoint(stream) >= 1);
  }
});

test("observed clear rate matches 1/target", async () => {
  // The whole payout model rests on P(bust >= t) = 1/t. If the derivation drifts
  // from that, the game quietly stops paying its own improbability.
  for (const target of [2, 5]) {
    let cleared = 0;
    const runs = 3000;
    for (let nonce = 0; nonce < runs; nonce += 1) {
      const stream = await createStream(SEED, `clear-${target}`, nonce, ascent.BYTE_BUDGET);
      if (ascent.bustPoint(stream) >= target) cleared += 1;
    }
    const rate = cleared / runs;
    const expected = 1 / target;
    assert.ok(
      Math.abs(rate - expected) < expected * 0.18,
      `target ${target}: observed ${rate}, expected ${expected}`,
    );
  }
});

/* ------------------------------------------------------------------ mines */

test("mines places the requested number of distinct mines on the grid", async () => {
  for (const mineCount of mines.MINE_CHOICES) {
    const layout = await openMinesRound(SEED, "c", 2, mineCount);
    assert.equal(layout.mines.length, mineCount);
    assert.equal(new Set(layout.mines).size, mineCount, "mines must not stack on a tile");
    assert.ok(layout.mines.every((m) => m >= 0 && m < mines.GRID_SIZE));
  }
});

test("mine placement is spread across the grid, not clustered at the start", async () => {
  // A partial Fisher-Yates with the wrong swap index buries everything in the
  // first few tiles, which would be trivially exploitable.
  const seen = new Set<number>();
  for (let nonce = 0; nonce < 300; nonce += 1) {
    for (const tile of (await openMinesRound(SEED, "spread", nonce, 3)).mines) seen.add(tile);
  }
  assert.ok(seen.size > 20, `only ${seen.size} of 25 tiles ever held a mine`);
});

test("mines rejects an unlisted mine count", async () => {
  await assert.rejects(() => openMinesRound(SEED, "c", 0, 7), /mineCount must be/);
});

test("the mines multiplier is the reciprocal of the risk taken", () => {
  assert.equal(mines.multiplierAfter(1, 0), 1);
  // One mine, one reveal: 24 of 25 tiles are safe, so the multiplier is 25/24.
  assert.ok(Math.abs(mines.multiplierAfter(1, 1) - 25 / 24) < 1e-12);
  assert.ok(Math.abs(mines.survivalChance(10, 1) - 15 / 25) < 1e-12);
  assert.ok(mines.multiplierAfter(10, 5) > mines.multiplierAfter(1, 5));
});

test("the multiplier climbs with every extra reveal", () => {
  for (const mineCount of mines.MINE_CHOICES) {
    for (let picks = 1; picks < 10; picks += 1) {
      assert.ok(
        mines.multiplierAfter(mineCount, picks + 1) > mines.multiplierAfter(mineCount, picks),
        `mines ${mineCount} stalled at ${picks}`,
      );
    }
  }
});

test("banking with no reveals pays nothing, so there is no risk-free round", () => {
  assert.equal(mines.pointsFor(5, 0), 0);
  assert.ok(mines.pointsFor(5, 1) > 0);
});

test("a bust settles to zero and reveals the board", () => {
  const layout: mines.MinesLayout = { mines: [4, 9, 20], mineCount: 3 };
  const bust = mines.settle(layout, [1, 2], false);
  assert.equal(bust.points, 0);
  assert.deepEqual((bust.detail as { mines: number[] }).mines, [4, 9, 20]);

  const banked = mines.settle(layout, [1, 2], true);
  assert.equal(banked.points, mines.pointsFor(3, 2));
  assert.ok(banked.points > 0);
});

test("tile bounds are enforced", () => {
  assert.equal(mines.isValidTile(0), true);
  assert.equal(mines.isValidTile(24), true);
  assert.equal(mines.isValidTile(25), false);
  assert.equal(mines.isValidTile(-1), false);
  assert.equal(mines.isValidTile(1.5), false);
});

/* ----------------------------------------------------------------- tumble */

test("tumble pays only clusters that reach the minimum", () => {
  assert.equal(tumble.clusterUnits(7), 0);
  assert.equal(tumble.clusterUnits(8), 2);
  assert.equal(tumble.clusterUnits(10), 5);
  assert.equal(tumble.clusterUnits(12), 20);
});

test("a tumble round stays inside its byte budget", async () => {
  let worst = 0;
  for (let nonce = 0; nonce < 400; nonce += 1) {
    const stream = await createStream(SEED, "budget", nonce, tumble.BYTE_BUDGET);
    tumble.play(stream);
    worst = Math.max(worst, stream.used);
  }
  assert.ok(worst < tumble.BYTE_BUDGET, `used ${worst} of ${tumble.BYTE_BUDGET}`);
});

test("every tumble round pays at least participation", async () => {
  for (let nonce = 0; nonce < 200; nonce += 1) {
    const stream = await createStream(SEED, "floor", nonce, tumble.BYTE_BUDGET);
    assert.ok(tumble.play(stream).points >= tumble.PARTICIPATION_POINTS);
  }
});

test("cleared cells always belong to a cluster that paid", async () => {
  for (let nonce = 0; nonce < 120; nonce += 1) {
    const stream = await createStream(SEED, "steps", nonce, tumble.BYTE_BUDGET);
    const detail = tumble.play(stream).detail as unknown as tumble.TumbleDetail;
    for (const step of detail.steps) {
      assert.ok(step.cleared.length >= tumble.MIN_CLUSTER, "cleared a sub-minimum cluster");
      assert.ok(step.units > 0, "cleared cells without paying for them");
      assert.equal(step.grid.length, tumble.CELLS);
    }
  }
});

test("tumble's measured expected value lands on the shared target", async () => {
  // Tumble has no closed form — cascades chain and orbs multiply the round — so
  // PAY_SCALE is tuned against a sample. This re-measures it: change the symbol
  // set or pay table and this fails until the scale is re-tuned, which is what
  // stops the game drifting away from paying like the others.
  const runs = 4000;
  let total = 0;
  for (let nonce = 0; nonce < runs; nonce += 1) {
    const stream = await createStream("ev-measure-seed", "player", nonce, tumble.BYTE_BUDGET);
    total += tumble.play(stream).points;
  }
  const mean = total / runs;
  // A wide band: the mean is dominated by rare high-multiplier cascades, so a
  // sample this size still moves around a lot between seeds.
  assert.ok(mean > TARGET_EV * 0.55 && mean < TARGET_EV * 1.6, `measured mean ${mean}`);
});

test("a tumble round always carries the grid it was dealt", async () => {
  // Regression: only the winning cascades were stored, so the roughly four
  // rounds in five that never cluster had nothing to draw and rendered blank.
  let sawLosing = false;
  for (let nonce = 0; nonce < 60; nonce += 1) {
    const stream = await createStream(SEED, "initial-grid", nonce, tumble.BYTE_BUDGET);
    const detail = tumble.play(stream).detail as unknown as tumble.TumbleDetail;
    assert.equal(detail.initialGrid.length, tumble.CELLS);
    assert.ok(detail.initialGrid.every((s) => s >= 0 && s < tumble.SYMBOL_COUNT));
    if (detail.steps.length === 0) sawLosing = true;
    else assert.deepEqual(detail.steps[0]!.grid, detail.initialGrid, "first step is the deal");
  }
  assert.ok(sawLosing, "expected at least one no-cluster round in the sample");
});
