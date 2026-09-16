import assert from "node:assert/strict";
import test from "node:test";
import { createStream } from "./rng.ts";
import { TARGET_EV } from "./types.ts";
import * as carrier from "./carrier.ts";
import * as viking from "./viking.ts";

const SEED = "voyage-seed";

/* ----------------------------------------------------------------- viking */

test("the wheel, track and bonuses are internally consistent", () => {
  assert.equal(viking.BASE_SPINS, viking.ROWS * viking.SPINS_PER_ROW);
  assert.ok(viking.MAX_SPINS > viking.BASE_SPINS, "bonuses must have room to add spins");
  assert.ok(viking.WHEEL.some((s) => s.kind === "power"));
  assert.ok(viking.WHEEL.some((s) => s.kind === "lightning"));
  assert.ok(viking.WHEEL.some((s) => s.kind === "move"));
  // Every milestone sits on the track and the last one is the end of it.
  for (const milestone of viking.MILESTONES) {
    assert.ok(milestone.space > 0 && milestone.space <= viking.TRACK);
  }
  assert.equal(viking.MILESTONES[viking.MILESTONES.length - 1]!.space, viking.TRACK);
});

test("milestones pay more the further up the river they sit", () => {
  for (let i = 1; i < viking.MILESTONES.length; i += 1) {
    assert.ok(
      viking.MILESTONES[i]!.reward > viking.MILESTONES[i - 1]!.reward,
      `milestone ${i} does not beat the one below it`,
    );
    assert.ok(viking.MILESTONES[i]!.space > viking.MILESTONES[i - 1]!.space);
  }
});

test("a voyage replays identically from the same seed", async () => {
  const a = viking.play(await createStream(SEED, "p", 9, viking.BYTE_BUDGET));
  const b = viking.play(await createStream(SEED, "p", 9, viking.BYTE_BUDGET));
  assert.deepEqual(a, b);
});

test("a voyage stays inside its entropy budget", async () => {
  let worst = 0;
  for (let nonce = 0; nonce < 300; nonce += 1) {
    const stream = await createStream(SEED, "budget", nonce, viking.BYTE_BUDGET);
    viking.play(stream);
    worst = Math.max(worst, stream.used);
  }
  assert.ok(worst < viking.BYTE_BUDGET, `used ${worst} of ${viking.BYTE_BUDGET}`);
});

test("ships never sail past the last milestone or behind the shore", async () => {
  for (let nonce = 0; nonce < 200; nonce += 1) {
    const stream = await createStream(SEED, "bounds", nonce, viking.BYTE_BUDGET);
    const detail = viking.play(stream).detail as unknown as viking.VikingDetail;
    assert.equal(detail.positions.length, viking.ROWS);
    for (const position of detail.positions) {
      assert.ok(position >= 0 && position <= viking.TRACK, `ship at ${position}`);
    }
    for (const spin of detail.spins) {
      assert.ok(spin.position >= 0 && spin.position <= viking.TRACK);
      assert.ok(spin.row >= 0 && spin.row < viking.ROWS);
    }
  }
});

test("rows take the wheel strictly in turn", async () => {
  const stream = await createStream(SEED, "rotation", 1, viking.BYTE_BUDGET);
  const detail = viking.play(stream).detail as unknown as viking.VikingDetail;
  detail.spins.forEach((spin, index) => {
    assert.equal(spin.spin, index, "spins must be logged in order");
    assert.equal(spin.row, index % viking.ROWS, "the wheel must pass round the rows");
  });
});

test("lightning sends its row back to the shore", async () => {
  let sawReset = false;
  for (let nonce = 0; nonce < 200 && !sawReset; nonce += 1) {
    const stream = await createStream(SEED, "lightning", nonce, viking.BYTE_BUDGET);
    const detail = viking.play(stream).detail as unknown as viking.VikingDetail;
    for (const spin of detail.spins) {
      if (spin.slot.kind === "lightning") {
        assert.equal(spin.position, 0, "a struck ship must be back at the start");
        sawReset = true;
      }
    }
  }
  assert.ok(sawReset, "no lightning landed in 200 voyages — check the wheel");
});

test("a milestone is banked once, on the spin that passes it", async () => {
  for (let nonce = 0; nonce < 120; nonce += 1) {
    const stream = await createStream(SEED, "milestones", nonce, viking.BYTE_BUDGET);
    const detail = viking.play(stream).detail as unknown as viking.VikingDetail;
    // A row that never got struck should bank each milestone below it exactly
    // once; counting them per row catches double-crediting on a single pass.
    const perRow = new Map<number, number[]>();
    for (const spin of detail.spins) {
      if (spin.slot.kind === "lightning") perRow.set(spin.row, []);
      else {
        const banked = perRow.get(spin.row) ?? [];
        banked.push(...spin.milestones);
        perRow.set(spin.row, banked);
      }
    }
    for (const [row, banked] of perRow) {
      assert.equal(
        new Set(banked).size,
        banked.length,
        `row ${row} banked a milestone twice on nonce ${nonce}`,
      );
    }
  }
});

test("three power-ups open the shield and three bolts open the runes", async () => {
  let shields = 0;
  let runes = 0;
  for (let nonce = 0; nonce < 400; nonce += 1) {
    const stream = await createStream(SEED, "bonus", nonce, viking.BYTE_BUDGET);
    const detail = viking.play(stream).detail as unknown as viking.VikingDetail;
    shields += detail.shields.length;
    runes += detail.runes.length;
    for (const shield of detail.shields) {
      assert.ok(shield.slice >= 0 && shield.slice < viking.SHIELD.length);
      assert.deepEqual(shield.reward, viking.SHIELD[shield.slice]);
    }
    for (const rune of detail.runes) {
      assert.equal(rune.order.length, viking.RUNES.length, "the pool must be fully shuffled");
      assert.equal(new Set(rune.order).size, viking.RUNES.length, "a rune was duplicated");
      assert.ok(rune.turned.length >= 1);
      // A rune run stops on the first ending rune and not before.
      const last = viking.RUNES[rune.turned[rune.turned.length - 1]!]!;
      const stoppedEarly = rune.turned.length < viking.RUNES.length;
      if (stoppedEarly) assert.equal(last.kind, "end", "a run stopped on a paying rune");
      for (const index of rune.turned.slice(0, -1)) {
        assert.notEqual(viking.RUNES[index]!.kind, "end", "a run continued past an ending rune");
      }
    }
  }
  assert.ok(shields > 0, "the shield bonus never opened");
  assert.ok(runes > 0, "the rune bonus never opened");
});

test("extra spins actually lengthen the voyage", async () => {
  let sawExtra = false;
  for (let nonce = 0; nonce < 300 && !sawExtra; nonce += 1) {
    const stream = await createStream(SEED, "extra", nonce, viking.BYTE_BUDGET);
    const detail = viking.play(stream).detail as unknown as viking.VikingDetail;
    if (detail.extraSpins > 0) {
      assert.ok(
        detail.spins.length > viking.BASE_SPINS,
        "spins were awarded but the voyage did not run longer",
      );
      sawExtra = true;
    }
  }
  assert.ok(sawExtra, "no extra spins were ever awarded");
});

test("a voyage is calibrated to the arcade's shared value", async () => {
  // No closed form: the six rows share the power-up and lightning counters, so
  // PAY_SCALE is measured. This re-measures it, and fails if the wheel, track
  // or bonuses are changed without re-tuning.
  const runs = 4000;
  let total = 0;
  let home = 0;
  for (let nonce = 0; nonce < runs; nonce += 1) {
    const stream = await createStream("viking-ev", "player", nonce, viking.BYTE_BUDGET);
    const result = viking.play(stream);
    total += result.points;
    const detail = result.detail as unknown as viking.VikingDetail;
    if (detail.positions.some((p) => p >= viking.TRACK)) home += 1;
  }
  const mean = total / runs;
  assert.ok(
    mean > TARGET_EV * 0.7 && mean < TARGET_EV * 1.4,
    `voyage mean ${mean.toFixed(1)} against ${TARGET_EV}`,
  );
  // The top milestone has to be reachable or it is decoration, and rare or it
  // is not the prize the round is chasing.
  const rate = home / runs;
  assert.ok(rate > 0.01 && rate < 0.3, `a ship gets home on ${(rate * 100).toFixed(1)}% of voyages`);
});

/* ---------------------------------------------------------------- carrier */

test("breaking off is worth the same at every sector before the deck", () => {
  for (let sector = 1; sector < carrier.SECTORS; sector += 1) {
    const ev = carrier.expectedPoints(sector, false);
    assert.ok(
      Math.abs(ev - TARGET_EV) < TARGET_EV * 0.02,
      `breaking off at ${sector} is worth ${ev.toFixed(2)}`,
    );
  }
});

test("landing on the deck is worth more than breaking off short of it", () => {
  // The one place in the arcade where a choice beats another. It is the same
  // choice for everyone and it is stated on the game, so it tilts nobody.
  const landed = carrier.expectedPoints(carrier.SECTORS, true);
  const shortOf = carrier.expectedPoints(carrier.SECTORS - 1, false);
  assert.ok(landed > shortOf, "the landing premium is missing");
  assert.ok(
    Math.abs(landed - TARGET_EV * carrier.LANDING_BONUS) < TARGET_EV * 0.05,
    `landing is worth ${landed.toFixed(1)}`,
  );
});

test("the approach tightens and the multiplier climbs with it", () => {
  for (let sector = 1; sector < carrier.SECTORS; sector += 1) {
    assert.ok(
      carrier.multiplierAfter(sector + 1) >= carrier.multiplierAfter(sector),
      `the multiplier stalled at sector ${sector}`,
    );
  }
  // Early sectors are clear air; the bombs start once the deck is in sight.
  assert.equal(carrier.bombsIn(0), 0);
  assert.ok(carrier.bombsIn(carrier.SECTORS - 1) > 0);
  assert.ok(carrier.survivalChance(carrier.SECTORS) < 0.25, "the deck should be hard to reach");
});

test("an airspace has the right shape and no impossible sector", async () => {
  for (let nonce = 0; nonce < 150; nonce += 1) {
    const stream = await createStream(SEED, "airspace", nonce, carrier.BYTE_BUDGET);
    const layout = carrier.layout(stream);
    assert.equal(layout.grid.length, carrier.SECTORS);
    assert.equal(layout.values.length, carrier.SECTORS);
    layout.grid.forEach((lanes, sector) => {
      assert.equal(lanes.length, carrier.LANES);
      const bombs = lanes.filter((cell) => cell === "bomb").length;
      assert.equal(bombs, carrier.bombsIn(sector), `sector ${sector} has ${bombs} bombs`);
      // A sector where every lane is a bomb would be unsurvivable.
      assert.ok(bombs < carrier.LANES, `sector ${sector} has no way through`);
    });
    // Deeper bubbles are worth more, which is what makes pressing on tempting.
    for (let sector = 1; sector < carrier.SECTORS; sector += 1) {
      assert.ok(layout.values[sector]! > layout.values[sector - 1]!);
    }
  }
});

test("bombs land in every lane over many runs", async () => {
  const seen = new Set<number>();
  for (let nonce = 0; nonce < 300; nonce += 1) {
    const stream = await createStream(SEED, "bomb-spread", nonce, carrier.BYTE_BUDGET);
    const layout = carrier.layout(stream);
    layout.grid[carrier.SECTORS - 1]!.forEach((cell, lane) => {
      if (cell === "bomb") seen.add(lane);
    });
  }
  assert.equal(seen.size, carrier.LANES, "some lanes are never mined");
});

test("a crash pays nothing and a bank pays the run", async () => {
  const stream = await createStream(SEED, "settle", 0, carrier.BYTE_BUDGET);
  const layout = carrier.layout(stream);
  const crashed = carrier.settle(layout, [0, 1, 2], false);
  assert.equal(crashed.points, 0);
  assert.equal((crashed.detail as { crashed: boolean }).crashed, true);

  const banked = carrier.settle(layout, [0, 1, 2], true);
  assert.equal(banked.points, carrier.pointsFor(3, false));
  assert.ok(banked.points > 0);

  const full = carrier.settle(layout, Array(carrier.SECTORS).fill(0), true);
  assert.equal((full.detail as { landed: boolean }).landed, true);
  assert.ok(full.points > banked.points);
});

test("breaking off before flying a sector pays nothing", () => {
  assert.equal(carrier.pointsFor(0, false), 0);
  assert.ok(carrier.pointsFor(1, false) > 0);
});

test("lane bounds are enforced", () => {
  assert.equal(carrier.isValidLane(0), true);
  assert.equal(carrier.isValidLane(carrier.LANES - 1), true);
  assert.equal(carrier.isValidLane(carrier.LANES), false);
  assert.equal(carrier.isValidLane(-1), false);
  assert.equal(carrier.isValidLane(1.5), false);
});
