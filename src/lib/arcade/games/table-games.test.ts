import assert from "node:assert/strict";
import test from "node:test";
import { createStream } from "./rng.ts";
import { TARGET_EV } from "./types.ts";
import * as dice from "./dice.ts";
import * as hilo from "./hilo.ts";
import * as keno from "./keno.ts";
import * as roulette from "./roulette.ts";
import * as scratch from "./scratch.ts";
import * as tower from "./tower.ts";
import * as wheel from "./wheel.ts";

const SEED = "table-games-seed";

/** Every option of every game must sit on the shared value. */
function assertOnTarget(label: string, ev: number, tolerance = 0.01) {
  assert.ok(
    Math.abs(ev - TARGET_EV) <= TARGET_EV * tolerance,
    `${label} pays ${ev.toFixed(3)}, off ${TARGET_EV} by more than ${tolerance * 100}%`,
  );
}

/* ------------------------------------------------------------------- dice */

test("every dice line is worth the same, in both directions", () => {
  for (let target = dice.MIN_TARGET; target <= dice.MAX_TARGET; target += 1) {
    assertOnTarget(`dice under ${target}`, dice.expectedPoints(target, "under"));
    assertOnTarget(`dice over ${target}`, dice.expectedPoints(target, "over"));
  }
});

test("under and over are exact complements, so no roll is a push", () => {
  for (let target = dice.MIN_TARGET; target <= dice.MAX_TARGET; target += 1) {
    const under = dice.winChance(target, "under");
    const over = dice.winChance(target, "over");
    assert.ok(Math.abs(under + over - 1) < 1e-12, `target ${target} leaves a gap`);
  }
});

test("a longer shot pays more", () => {
  assert.ok(dice.winPoints(10, "under") > dice.winPoints(50, "under"));
  assert.ok(dice.winPoints(90, "over") > dice.winPoints(50, "over"));
});

test("dice refuses a line outside the board", () => {
  assert.equal(dice.isValidTarget(1), false);
  assert.equal(dice.isValidTarget(99), false);
  assert.equal(dice.isValidTarget(50.5), false);
});

test("the roll decides the call the way the odds say", async () => {
  let wins = 0;
  const runs = 4000;
  for (let nonce = 0; nonce < runs; nonce += 1) {
    const stream = await createStream(SEED, "dice", nonce, dice.BYTE_BUDGET);
    const result = dice.play(stream, 25, "under");
    const detail = result.detail as unknown as dice.DiceDetail;
    assert.equal(detail.won, detail.roll < 25, `roll ${detail.roll} judged wrong`);
    assert.ok(detail.roll >= 0 && detail.roll < 100);
    if (detail.won) wins += 1;
  }
  const rate = wins / runs;
  assert.ok(rate > 0.22 && rate < 0.28, `win rate ${rate} is off 0.25`);
});

/* ------------------------------------------------------------------ wheel */

test("every wheel tier is worth the same", () => {
  for (const tier of wheel.TIERS) assertOnTarget(`wheel ${tier}`, wheel.expectedPoints(tier));
});

test("wheel tiers differ in shape, not in value", () => {
  // The point of the tier picker: low pays often and small, high pays rarely
  // and hugely. If these ever converge the choice becomes cosmetic.
  assert.ok(wheel.hitChance("low") > wheel.hitChance("medium"));
  assert.ok(wheel.hitChance("medium") > wheel.hitChance("high"));
  assert.ok(Math.max(...wheel.WHEELS.high) > Math.max(...wheel.WHEELS.low) * 5);
});

test("every wheel has the same number of segments", () => {
  for (const tier of wheel.TIERS) {
    assert.equal(wheel.WHEELS[tier].length, wheel.SEGMENTS, tier);
  }
});

test("a wheel spin lands on a real segment and pays what it says", async () => {
  for (const tier of wheel.TIERS) {
    for (let nonce = 0; nonce < 60; nonce += 1) {
      const stream = await createStream(SEED, `wheel-${tier}`, nonce, wheel.BYTE_BUDGET);
      const result = wheel.play(stream, tier);
      const detail = result.detail as unknown as wheel.WheelDetail;
      assert.ok(detail.segment >= 0 && detail.segment < wheel.SEGMENTS);
      assert.equal(detail.multiplier, wheel.WHEELS[tier][detail.segment]);
      assert.equal(result.points, wheel.segmentPoints(tier, detail.segment));
      // A segment that shows a multiplier must pay, and a blank must not.
      assert.equal(result.points > 0, detail.multiplier > 0);
    }
  }
});

test("wheel refuses an unknown tier", () => {
  assert.equal(wheel.isValidTier("insane"), false);
});

/* --------------------------------------------------------------- roulette */

test("every roulette bet is worth the same, including the straight-up", () => {
  const bets: roulette.Bet[] = [
    { kind: "red", selection: 0 },
    { kind: "black", selection: 0 },
    { kind: "odd", selection: 0 },
    { kind: "even", selection: 0 },
    { kind: "low", selection: 0 },
    { kind: "high", selection: 0 },
    { kind: "dozen", selection: 0 },
    { kind: "dozen", selection: 2 },
    { kind: "column", selection: 1 },
    ...Array.from({ length: 37 }, (_, n): roulette.Bet => ({ kind: "straight", selection: n })),
  ];
  for (const bet of bets) {
    assertOnTarget(`roulette ${bet.kind}/${bet.selection}`, roulette.expectedPoints(bet));
  }
});

test("the wheel has thirty-seven pockets and the even-money bets cover eighteen", () => {
  assert.equal(roulette.POCKETS, 37);
  for (const kind of ["red", "black", "odd", "even", "low", "high"] as const) {
    assert.equal(roulette.coverCount({ kind, selection: 0 }), 18, kind);
  }
  assert.equal(roulette.coverCount({ kind: "dozen", selection: 0 }), 12);
  assert.equal(roulette.coverCount({ kind: "column", selection: 0 }), 12);
  assert.equal(roulette.coverCount({ kind: "straight", selection: 17 }), 1);
});

test("zero loses every bet except a straight-up on zero", () => {
  for (const kind of ["red", "black", "odd", "even", "low", "high"] as const) {
    assert.equal(roulette.covers({ kind, selection: 0 }, 0), false, kind);
  }
  assert.equal(roulette.covers({ kind: "dozen", selection: 0 }, 0), false);
  assert.equal(roulette.covers({ kind: "column", selection: 0 }, 0), false);
  assert.equal(roulette.covers({ kind: "straight", selection: 0 }, 0), true);
});

test("red and black partition the non-zero pockets", () => {
  let red = 0;
  let black = 0;
  for (let pocket = 1; pocket <= 36; pocket += 1) {
    const isRed = roulette.covers({ kind: "red", selection: 0 }, pocket);
    const isBlack = roulette.covers({ kind: "black", selection: 0 }, pocket);
    assert.notEqual(isRed, isBlack, `pocket ${pocket} is both or neither`);
    if (isRed) red += 1;
    else black += 1;
  }
  assert.equal(red, 18);
  assert.equal(black, 18);
});

test("dozens and columns each partition 1-36", () => {
  for (let pocket = 1; pocket <= 36; pocket += 1) {
    const dozens = [0, 1, 2].filter((s) => roulette.covers({ kind: "dozen", selection: s }, pocket));
    const columns = [0, 1, 2].filter((s) => roulette.covers({ kind: "column", selection: s }, pocket));
    assert.equal(dozens.length, 1, `pocket ${pocket} dozens`);
    assert.equal(columns.length, 1, `pocket ${pocket} columns`);
  }
});

test("roulette refuses a bet that is not on the table", () => {
  assert.equal(roulette.isValidBet({ kind: "straight", selection: 37 }), false);
  assert.equal(roulette.isValidBet({ kind: "dozen", selection: 3 }), false);
  assert.equal(roulette.isValidBet({ kind: "column", selection: -1 }), false);
});

/* ------------------------------------------------------------------- keno */

test("every keno pick count is worth the same", () => {
  for (let picks = 1; picks <= keno.MAX_PICKS; picks += 1) {
    assertOnTarget(`keno pick ${picks}`, keno.expectedPoints(picks));
  }
});

test("the hypergeometric distribution is a proper distribution", () => {
  for (let picks = 1; picks <= keno.MAX_PICKS; picks += 1) {
    let total = 0;
    for (let matches = 0; matches <= picks; matches += 1) total += keno.matchChance(picks, matches);
    assert.ok(Math.abs(total - 1) < 1e-9, `pick ${picks} sums to ${total}`);
  }
});

test("keno odds match hand-checked values", () => {
  // One pick matches when it is among the ten drawn from forty.
  assert.ok(Math.abs(keno.matchChance(1, 1) - 10 / 40) < 1e-12);
  assert.ok(Math.abs(keno.matchChance(1, 0) - 30 / 40) < 1e-12);
  assert.equal(keno.choose(40, 10), 847660528);
});

test("picking more numbers makes a paying card rarer", () => {
  assert.ok(keno.hitChance(2) < keno.hitChance(1));
  assert.ok(keno.hitChance(10) < keno.hitChance(6));
});

test("a draw is ten distinct numbers from the pool", async () => {
  for (let nonce = 0; nonce < 60; nonce += 1) {
    const stream = await createStream(SEED, "keno", nonce, keno.BYTE_BUDGET);
    const drawn = keno.drawNumbers(stream);
    assert.equal(drawn.length, keno.DRAWN);
    assert.equal(new Set(drawn).size, keno.DRAWN, "a number was drawn twice");
    for (const n of drawn) assert.ok(n >= 1 && n <= keno.POOL);
  }
});

test("keno scores only the numbers actually matched", async () => {
  const stream = await createStream(SEED, "keno-score", 1, keno.BYTE_BUDGET);
  const result = keno.play(stream, [1, 2, 3, 4, 5]);
  const detail = result.detail as unknown as keno.KenoDetail;
  const drawn = new Set(detail.drawn);
  assert.deepEqual(detail.matched, detail.picks.filter((p) => drawn.has(p)));
  assert.equal(result.points, keno.matchPoints(5, detail.matched.length));
});

test("keno refuses duplicates and out-of-range numbers", async () => {
  const stream = await createStream(SEED, "keno-bad", 0, keno.BYTE_BUDGET);
  assert.throws(() => keno.play(stream, [1, 1, 2]), /once/);
  assert.throws(() => keno.play(stream, [0]), /1 to 40/);
  assert.throws(() => keno.play(stream, [41]), /1 to 40/);
  assert.throws(() => keno.play(stream, []), /between 1 and/);
});

/* ---------------------------------------------------------------- scratch */

test("a scratch card is worth the shared value", () => {
  assertOnTarget("scratch", scratch.expectedWeight() * scratch.scale());
});

test("a card is nine cells of real symbols", async () => {
  for (let nonce = 0; nonce < 80; nonce += 1) {
    const stream = await createStream(SEED, "scratch", nonce, scratch.BYTE_BUDGET);
    const detail = scratch.play(stream).detail as unknown as scratch.ScratchDetail;
    assert.equal(detail.cells.length, scratch.CELLS);
    for (const cell of detail.cells) {
      assert.ok(cell >= 0 && cell < scratch.FACES.length, `drew ${cell}`);
    }
  }
});

test("a card pays exactly the symbols that reached three", async () => {
  for (let nonce = 0; nonce < 120; nonce += 1) {
    const stream = await createStream(SEED, "scratch-pay", nonce, scratch.BYTE_BUDGET);
    const detail = scratch.play(stream).detail as unknown as scratch.ScratchDetail;
    const counts = new Array<number>(scratch.FACES.length).fill(0);
    for (const cell of detail.cells) counts[cell] += 1;
    const expected = counts
      .map((count, symbol) => ({ count, symbol }))
      .filter(({ count }) => count >= 3)
      .map(({ symbol, count }) => ({ symbol, count, points: scratch.symbolPoints(symbol, count) }));
    assert.deepEqual(detail.wins, expected, `nonce ${nonce}`);
    assert.equal(detail.points, expected.reduce((sum, w) => sum + w.points, 0));
  }
});

test("more of a kind always pays more", () => {
  for (let symbol = 0; symbol < scratch.FACES.length; symbol += 1) {
    for (let count = 4; count <= scratch.CELLS; count += 1) {
      assert.ok(
        scratch.symbolPoints(symbol, count) > scratch.symbolPoints(symbol, count - 1),
        `symbol ${symbol} at ${count}`,
      );
    }
  }
});

/* ------------------------------------------------------------------ tower */

test("every tower difficulty and stopping floor is worth the same", () => {
  for (const difficulty of tower.LEVELS) {
    for (let floors = 1; floors <= tower.FLOORS; floors += 1) {
      assertOnTarget(`tower ${difficulty} stop at ${floors}`, tower.expectedPoints(difficulty, floors));
    }
  }
});

test("the tower multiplier is the reciprocal of the climb's risk", () => {
  assert.ok(Math.abs(tower.multiplierAfter("medium", 1) - 3) < 1e-12);
  assert.ok(Math.abs(tower.multiplierAfter("easy", 1) - 1.5) < 1e-12);
  assert.ok(Math.abs(tower.multiplierAfter("hard", 2) - 16) < 1e-12);
});

test("a harder climb pays more at the same floor", () => {
  for (let floors = 1; floors <= tower.FLOORS; floors += 1) {
    assert.ok(tower.pointsFor("hard", floors) > tower.pointsFor("medium", floors));
    assert.ok(tower.pointsFor("medium", floors) > tower.pointsFor("easy", floors));
  }
});

test("banking before climbing pays nothing", () => {
  assert.equal(tower.pointsFor("medium", 0), 0);
  assert.ok(tower.pointsFor("medium", 1) > 0);
});

test("a tower layout has the right safe tiles on every floor", async () => {
  for (const difficulty of tower.LEVELS) {
    const { tiles, safe } = tower.DIFFICULTIES[difficulty];
    for (let nonce = 0; nonce < 40; nonce += 1) {
      const stream = await createStream(SEED, `tower-${difficulty}`, nonce, tower.BYTE_BUDGET);
      const layout = tower.layout(stream, difficulty);
      assert.equal(layout.safeTiles.length, tower.FLOORS);
      for (const floor of layout.safeTiles) {
        assert.equal(floor.length, safe, difficulty);
        assert.equal(new Set(floor).size, safe, "a safe tile was placed twice");
        for (const tile of floor) assert.ok(tile >= 0 && tile < tiles);
      }
    }
  }
});

test("safe tiles are spread across the row, not stuck at the start", async () => {
  const seen = new Set<number>();
  for (let nonce = 0; nonce < 200; nonce += 1) {
    const stream = await createStream(SEED, "tower-spread", nonce, tower.BYTE_BUDGET);
    for (const floor of tower.layout(stream, "hard").safeTiles) {
      for (const tile of floor) seen.add(tile);
    }
  }
  assert.equal(seen.size, tower.DIFFICULTIES.hard.tiles, "some tiles are never safe");
});

test("a busted tower pays nothing and reveals the layout", async () => {
  const stream = await createStream(SEED, "tower-settle", 0, tower.BYTE_BUDGET);
  const layout = tower.layout(stream, "medium");
  const bust = tower.settle(layout, [0, 1], false);
  assert.equal(bust.points, 0);
  assert.equal((bust.detail as { safeTiles: number[][] }).safeTiles.length, tower.FLOORS);
  const banked = tower.settle(layout, [0, 1], true);
  assert.equal(banked.points, tower.pointsFor("medium", 2));
});

test("tower refuses an unknown difficulty or an off-row tile", async () => {
  const stream = await createStream(SEED, "tower-bad", 0, tower.BYTE_BUDGET);
  assert.throws(() => tower.layout(stream, "impossible" as tower.Difficulty), /Difficulty must be/);
  assert.equal(tower.isValidTile("medium", 3), false);
  assert.equal(tower.isValidTile("hard", 3), true);
  assert.equal(tower.isValidTile("hard", 4), false);
});

/* ------------------------------------------------------------------ hi-lo */

test("every hi-lo chain is worth the same, whatever the cards", () => {
  for (let rank = 1; rank <= hilo.RANKS; rank += 1) {
    for (const call of ["higher", "lower"] as hilo.Call[]) {
      for (const length of [1, 2, 4, 8]) {
        const cards = Array.from({ length: length + 1 }, () => ({ rank, suit: 0 }));
        const calls = Array.from({ length }, () => call);
        assertOnTarget(`hi-lo rank ${rank} ${call} x${length}`, hilo.expectedPoints(cards, calls));
      }
    }
  }
});

test("ties count for both calls, so the odds overlap by one rank", () => {
  // Calling higher on a 7 wins on 7 through king; calling lower wins on ace
  // through 7. The shared rank is why the two chances sum to more than one.
  assert.ok(Math.abs(hilo.callChance(7, "higher") - 7 / 13) < 1e-12);
  assert.ok(Math.abs(hilo.callChance(7, "lower") - 7 / 13) < 1e-12);
  assert.ok(hilo.callChance(7, "higher") + hilo.callChance(7, "lower") > 1);
  assert.equal(hilo.succeeds(7, 7, "higher"), true);
  assert.equal(hilo.succeeds(7, 7, "lower"), true);
});

test("the safest call pays the least", () => {
  // Calling higher on an ace is nearly certain, so it must barely move the
  // multiplier; calling higher on a king is the long shot.
  assert.ok(hilo.callChance(1, "higher") > hilo.callChance(13, "higher"));
  const easy = hilo.pointsFor([{ rank: 1, suit: 0 }, { rank: 5, suit: 0 }], ["higher"]);
  const hard = hilo.pointsFor([{ rank: 13, suit: 0 }, { rank: 5, suit: 0 }], ["higher"]);
  assert.ok(hard > easy);
});

test("a longer chain always pays more", () => {
  const cards = Array.from({ length: 9 }, () => ({ rank: 7, suit: 0 }));
  let last = 0;
  for (let length = 1; length <= 8; length += 1) {
    const points = hilo.pointsFor(cards, Array.from({ length }, () => "higher" as hilo.Call));
    assert.ok(points > last, `chain of ${length} did not beat ${length - 1}`);
    last = points;
  }
});

test("a hi-lo round deals every card it could need up front", async () => {
  const stream = await createStream(SEED, "hilo", 3, hilo.BYTE_BUDGET);
  const layout = hilo.layout(stream, hilo.MAX_CALLS);
  assert.equal(layout.cards.length, hilo.MAX_CALLS + 1);
  for (const card of layout.cards) {
    assert.ok(card.rank >= 1 && card.rank <= hilo.RANKS, `rank ${card.rank}`);
    assert.ok(card.suit >= 0 && card.suit < hilo.SUITS.length, `suit ${card.suit}`);
  }
});

test("banking with no calls pays nothing", () => {
  const cards = [{ rank: 7, suit: 0 }];
  assert.equal(hilo.pointsFor(cards, []), 0);
});

test("a hi-lo bust pays nothing", async () => {
  const stream = await createStream(SEED, "hilo-settle", 0, hilo.BYTE_BUDGET);
  const layout = hilo.layout(stream, hilo.MAX_CALLS);
  assert.equal(hilo.settle(layout, ["higher"], false).points, 0);
  assert.ok(hilo.settle(layout, ["higher"], true).points > 0);
});

test("ranks drawn cover the whole deck", async () => {
  const seen = new Set<number>();
  for (let nonce = 0; nonce < 80; nonce += 1) {
    const stream = await createStream(SEED, "hilo-spread", nonce, hilo.BYTE_BUDGET);
    for (const card of hilo.layout(stream, hilo.MAX_CALLS).cards) seen.add(card.rank);
  }
  assert.equal(seen.size, hilo.RANKS, "some ranks never appear");
});
