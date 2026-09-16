import assert from "node:assert/strict";
import test from "node:test";
import { createStream } from "../games/rng.ts";
import { TARGET_EV } from "../games/types.ts";
import { catalog, catalogSize, lobby, slotById } from "./catalog.ts";
import {
  byteBudget,
  countScatters,
  evaluate,
  paylinesFor,
  playRound,
  pointsFor,
  spinGrid,
  waysCount,
} from "./engine.ts";
import {
  advertisedWays,
  expectedRoundPay,
  expectedSpinPay,
  scatterDistribution,
  triggerChance,
} from "./ev.ts";
import { MECHANICS } from "./mechanics.ts";
import { THEMES } from "./themes.ts";

/* -------------------------------------------------------------- catalogue */

test("the catalogue is every theme crossed with every mechanic", () => {
  assert.equal(catalogSize(), THEMES.length * MECHANICS.length);
  assert.equal(catalogSize(), 280);
});

test("every title has a unique id and a unique name", () => {
  const all = catalog();
  assert.equal(new Set(all.map((e) => e.id)).size, all.length);
  assert.equal(new Set(all.map((e) => e.name)).size, all.length);
});

test("every single game is calibrated to the arcade's shared value", () => {
  // The rule the whole catalogue rests on. 280 games, one leaderboard, one
  // budget of free drops — if any game paid more per play, the other 279 would
  // be decoration and everyone would grind that one.
  for (const entry of catalog()) {
    const ev = expectedRoundPay(entry) * entry.scale;
    assert.ok(
      Math.abs(ev - TARGET_EV) < 1e-6,
      `${entry.id} pays ${ev}, expected ${TARGET_EV}`,
    );
  }
});

test("no game has a degenerate scale", () => {
  for (const entry of catalog()) {
    assert.ok(entry.scale > 0, `${entry.id} has scale ${entry.scale}`);
    assert.ok(Number.isFinite(entry.scale), `${entry.id} scale is not finite`);
  }
});

test("volatility is spread across the catalogue, not stuck on one tier", () => {
  const tiers = new Set(catalog().map((e) => e.volatility.id));
  assert.ok(tiers.size >= 5, `only ${tiers.size} volatility tiers in use`);
});

test("every theme supplies a full symbol set and palette", () => {
  for (const theme of THEMES) {
    assert.equal(theme.glyphs.length, 8, `${theme.id} glyphs`);
    assert.equal(theme.palette.length, 6, `${theme.id} palette`);
    assert.equal(theme.backdrop.length, 2, `${theme.id} backdrop`);
    for (const colour of [...theme.palette, theme.glow, ...theme.backdrop]) {
      assert.match(colour, /^#[0-9a-f]{6}$/i, `${theme.id} has a bad colour: ${colour}`);
    }
  }
});

test("each game has six paying symbols plus one wild and one scatter", () => {
  for (const entry of catalog()) {
    const kinds = entry.symbols.map((s) => s.kind);
    assert.equal(kinds.filter((k) => k === "pay").length, 6, entry.id);
    assert.equal(kinds.filter((k) => k === "wild").length, 1, entry.id);
    assert.equal(kinds.filter((k) => k === "scatter").length, 1, entry.id);
  }
});

test("paying symbols are ordered low to high and pay more for longer runs", () => {
  for (const entry of catalog().slice(0, 40)) {
    const { minRun, reels } = entry.mechanic;
    const pays = entry.symbols.filter((s) => s.kind === "pay");
    for (let i = 1; i < pays.length; i += 1) {
      assert.ok(
        (pays[i]!.pays[minRun] ?? 0) > (pays[i - 1]!.pays[minRun] ?? 0),
        `${entry.id}: symbol ${i} does not out-pay ${i - 1}`,
      );
    }
    for (const symbol of pays) {
      for (let run = minRun + 1; run <= reels; run += 1) {
        assert.ok(
          (symbol.pays[run] ?? 0) > (symbol.pays[run - 1] ?? 0),
          `${entry.id}: ${symbol.id} does not pay more at run ${run}`,
        );
      }
    }
  }
});

test("wilds never appear on the first reel", () => {
  // A wild on reel one would start runs out of nothing; it should feel like a
  // rescue, not a gift.
  for (const entry of catalog()) {
    const wildIndex = entry.symbols.findIndex((s) => s.kind === "wild");
    assert.equal(entry.weights[0]![wildIndex], 0, entry.id);
    assert.ok(entry.weights[1]![wildIndex]! > 0, `${entry.id} has no wilds at all`);
  }
});

test("lobby rows cover the catalogue without leaking reel weights", () => {
  const rows = lobby();
  assert.equal(rows.length, catalogSize());
  for (const row of rows.slice(0, 20)) {
    assert.ok(row.name.length > 0);
    assert.ok(row.ways > 0);
    // Weights and paytables decide outcomes; the lobby has no business with them.
    assert.equal("weights" in row, false);
    assert.equal("symbols" in row, false);
  }
});

test("slotById finds a real game and refuses an invented one", () => {
  assert.ok(slotById("olympus-classic3"));
  assert.equal(slotById("not-a-game"), null);
});

/* ----------------------------------------------------------------- engine */

test("paylines stay inside the grid and are as many as the mechanic claims", () => {
  for (const mechanic of MECHANICS) {
    if (mechanic.payMode !== "lines") continue;
    const lines = paylinesFor(mechanic.reels, mechanic.rows, mechanic.lines);
    assert.equal(lines.length, mechanic.lines, mechanic.id);
    for (const line of lines) {
      assert.equal(line.length, mechanic.reels);
      for (const row of line) {
        assert.ok(row >= 0 && row < mechanic.rows, `${mechanic.id} line leaves the grid`);
      }
    }
  }
});

test("ways count is rows to the power of reels", () => {
  assert.equal(waysCount(5, 3), 243);
  assert.equal(waysCount(6, 4), 4096);
});

test("advertised ways match what the mechanic actually offers", () => {
  for (const entry of catalog()) {
    const ways = advertisedWays(entry);
    assert.ok(ways > 0, entry.id);
    if (entry.mechanic.payMode === "ways") {
      assert.equal(ways, waysCount(entry.mechanic.reels, entry.mechanic.rows));
    } else {
      assert.equal(ways, entry.mechanic.lines);
    }
  }
});

test("a spun grid is the right shape and holds only real symbols", async () => {
  for (const entry of catalog().slice(0, 30)) {
    const stream = await createStream("grid", "p", 1, byteBudget(entry));
    const grid = spinGrid(stream, entry);
    assert.equal(grid.length, entry.mechanic.reels, entry.id);
    for (const column of grid) {
      assert.equal(column.length, entry.mechanic.rows, entry.id);
      for (const cell of column) {
        assert.ok(cell >= 0 && cell < entry.symbols.length, `${entry.id} drew ${cell}`);
      }
    }
  }
});

test("a round replays identically from the same seed", async () => {
  const entry = slotById("nebula-line20")!;
  const a = playRound(await createStream("s", "c", 4, byteBudget(entry)), entry);
  const b = playRound(await createStream("s", "c", 4, byteBudget(entry)), entry);
  assert.deepEqual(a, b);
});

test("a round never draws more bytes than its budget", async () => {
  // Free spins multiply how much entropy a round needs; a budget that was too
  // tight would throw mid-round on exactly the best spins.
  for (const entry of catalog()) {
    const budget = byteBudget(entry);
    const stream = await createStream("budget", entry.id, 0, budget);
    playRound(stream, entry);
    assert.ok(stream.used <= budget, `${entry.id} used ${stream.used} of ${budget}`);
  }
});

test("a round with the feature forced still fits its budget", async () => {
  // Find a genuine trigger and confirm the full free-spin sequence fits.
  const entry = slotById("gem-cut-line10")!;
  const budget = byteBudget(entry);
  let triggered = false;
  for (let nonce = 0; nonce < 400 && !triggered; nonce += 1) {
    const stream = await createStream("feature", "p", nonce, budget);
    const round = playRound(stream, entry);
    if (round.featureTriggered) {
      triggered = true;
      assert.equal(round.freeSpins.length, entry.mechanic.feature.spins);
      assert.ok(stream.used <= budget);
    }
  }
  assert.ok(triggered, "no feature landed in 400 spins — check the trigger rate");
});

test("wins only ever cite cells that exist", async () => {
  for (const entry of catalog().slice(0, 40)) {
    for (let nonce = 0; nonce < 12; nonce += 1) {
      const result = playRound(await createStream("cells", entry.id, nonce, byteBudget(entry)), entry);
      for (const spinResult of [result.base, ...result.freeSpins]) {
        for (const win of spinResult.wins) {
          assert.ok(win.run >= entry.mechanic.minRun, `${entry.id} paid a short run`);
          assert.ok(win.pay > 0, `${entry.id} recorded a zero win`);
          for (const [reel, row] of win.cells) {
            assert.ok(reel >= 0 && reel < entry.mechanic.reels, `${entry.id} bad reel`);
            assert.ok(row >= 0 && row < entry.mechanic.rows, `${entry.id} bad row`);
          }
        }
      }
    }
  }
});

test("points are never negative", async () => {
  for (const entry of catalog().slice(0, 60)) {
    const result = playRound(await createStream("neg", entry.id, 3, byteBudget(entry)), entry);
    assert.ok(result.points >= 0, entry.id);
  }
});

test("a hand-built grid evaluates the way the rules describe", () => {
  const entry = slotById("olympus-line10")!;
  const wildIndex = entry.symbols.findIndex((s) => s.kind === "wild");
  const scatterIndex = entry.symbols.findIndex((s) => s.kind === "scatter");

  // Reel 0 row 1 is the first payline; three of symbol 0 across reels 0-2.
  const grid = Array.from({ length: 5 }, () => [1, 1, 1] as number[]);
  grid[0]![1] = 0;
  grid[1]![1] = 0;
  grid[2]![1] = 0;
  const result = evaluate(entry, grid);
  const win = result.wins.find((w) => w.line === 0);
  assert.ok(win, "the centre line should have paid");
  assert.equal(win.symbol, 0);
  assert.equal(win.run, 3);

  // A wild extends that run to four.
  grid[3]![1] = wildIndex;
  const extended = evaluate(entry, grid).wins.find((w) => w.line === 0);
  assert.equal(extended?.run, 4, "a wild should have extended the run");

  // A scatter stops it dead.
  grid[3]![1] = scatterIndex;
  const stopped = evaluate(entry, grid).wins.find((w) => w.line === 0);
  assert.equal(stopped?.run, 3, "a scatter should end the run");
});

test("scatters are counted anywhere on the grid", () => {
  const entry = slotById("nile-line20")!;
  const scatterIndex = entry.symbols.findIndex((s) => s.kind === "scatter");
  const grid = Array.from({ length: 5 }, () => [0, 0, 0] as number[]);
  grid[0]![0] = scatterIndex;
  grid[2]![2] = scatterIndex;
  grid[4]![1] = scatterIndex;
  assert.equal(countScatters(entry, grid), 3);
});

/* --------------------------------------------------------------------- ev */

test("the scatter distribution is a proper distribution", () => {
  for (const entry of catalog().slice(0, 30)) {
    const distribution = scatterDistribution(entry);
    const total = distribution.reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(total - 1) < 1e-9, `${entry.id} sums to ${total}`);
    assert.equal(distribution.length, entry.mechanic.reels * entry.mechanic.rows + 1);
  }
});

test("features trigger often enough to matter but stay a moment", () => {
  for (const entry of catalog()) {
    const rate = triggerChance(entry);
    assert.ok(rate > 0.002, `${entry.id} triggers only ${(rate * 100).toFixed(3)}% of spins`);
    assert.ok(rate < 0.2, `${entry.id} triggers ${(rate * 100).toFixed(1)}% — not special`);
  }
});

test("the feature is a real share of what a game pays", () => {
  // If free spins contributed almost nothing, the calibration would be honest
  // but the feature would be decoration.
  const entry = slotById("gem-cut-line10")!;
  const withFeature = expectedRoundPay(entry);
  const baseOnly = expectedSpinPay(entry);
  assert.ok(withFeature > baseOnly * 1.02, "free spins barely move the value");
});

test("the closed form agrees with what the engine actually pays", async () => {
  // The whole calibration rests on ev.ts modelling engine.ts exactly. This runs
  // the real engine over a large sample and checks the two meet. A structural
  // mismatch — a misread rule, an off-by-one in a run — shows up here.
  const picks = ["olympus-classic3", "frost-vault-ways243"];
  for (const id of picks) {
    const entry = slotById(id)!;
    const budget = byteBudget(entry);
    const runs = 8_000;
    let total = 0;
    for (let nonce = 0; nonce < runs; nonce += 1) {
      total += playRound(await createStream("agree", id, nonce, budget), entry).points;
    }
    const mean = total / runs;
    // Slot means are dominated by rare large wins, so a sample this size moves
    // a lot; the band is wide on purpose. It catches structural error — a
    // misread rule, an off-by-one in a run — not sampling noise. Convergence to
    // the exact figure was verified separately over 300,000 spins.
    assert.ok(
      mean > TARGET_EV * 0.6 && mean < TARGET_EV * 1.5,
      `${id}: sampled ${mean.toFixed(1)} against exact ${TARGET_EV}`,
    );
  }
});

test("observed feature rate matches the computed one", async () => {
  const entry = slotById("nebula-line20")!;
  const budget = byteBudget(entry);
  const runs = 5_000;
  let triggered = 0;
  for (let nonce = 0; nonce < runs; nonce += 1) {
    if (playRound(await createStream("rate", "p", nonce, budget), entry).featureTriggered) {
      triggered += 1;
    }
  }
  const observed = triggered / runs;
  const exact = triggerChance(entry);
  assert.ok(
    Math.abs(observed - exact) < exact * 0.35,
    `observed ${observed.toFixed(4)} against exact ${exact.toFixed(4)}`,
  );
});

test("titles sharing a theme get distinct cover art", () => {
  // Regression: every mechanic used the theme's top-paying face, so seven
  // games in a row showed the same glyph and the shelf read as one game
  // listed seven times.
  const byTheme = new Map<string, Set<string>>();
  for (const row of lobby()) {
    const seen = byTheme.get(row.themeId) ?? new Set<string>();
    seen.add(row.glyph);
    byTheme.set(row.themeId, seen);
  }
  for (const [themeId, glyphs] of byTheme) {
    assert.ok(glyphs.size >= 4, `${themeId} reuses cover art across mechanics`);
  }
});

test("cover art comes from the theme's own symbol set", () => {
  const themes = new Map(THEMES.map((t) => [t.id, t]));
  for (const row of lobby()) {
    assert.ok(
      themes.get(row.themeId)!.glyphs.includes(row.glyph),
      `${row.id} uses a glyph its theme does not define`,
    );
  }
});

test("a spin that won something always pays at least a point", async () => {
  // Regression: on high-ways games the calibrated scale is tiny, so plain
  // rounding sent about one winning spin in six to zero points — the grid lit
  // the winning cells and the screen said "No win".
  for (const id of ["nebula-ways4096", "helio-ways4096", "gem-cut-ways243"]) {
    const entry = slotById(id)!;
    const budget = byteBudget(entry);
    for (let nonce = 0; nonce < 500; nonce += 1) {
      const round = playRound(await createStream("floor", id, nonce, budget), entry);
      const won =
        round.base.wins.length > 0 || round.freeSpins.some((s) => s.wins.length > 0);
      if (won) {
        assert.ok(round.points > 0, `${id} nonce ${nonce}: won but paid ${round.points}`);
      } else {
        assert.equal(round.points, 0, `${id} nonce ${nonce}: paid without a win`);
      }
    }
  }
});

test("pointsFor never loses a win and never invents one", () => {
  assert.equal(pointsFor(0, 5), 0);
  assert.equal(pointsFor(0, 0.0001), 0);
  assert.equal(pointsFor(0.0001, 0.0001), 1, "a real win rounds up, not away");
  assert.equal(pointsFor(100, 1), 100);
  assert.equal(pointsFor(2, 0.0228), 1);
});

test("flooring small wins moves expected value by a negligible amount", async () => {
  // The floor is the one place a game can drift above its calibration. Bound it
  // so the drift stays far below anything that could tilt a season.
  const entry = slotById("nebula-ways4096")!;
  const budget = byteBudget(entry);
  const runs = 12_000;
  let floored = 0;
  let plain = 0;
  for (let nonce = 0; nonce < runs; nonce += 1) {
    const round = playRound(await createStream("drift", entry.id, nonce, budget), entry);
    floored += round.points;
    plain += Math.round(round.rawPay * entry.scale);
  }
  const drift = (floored - plain) / runs;
  assert.ok(drift >= 0, "the floor can only add");
  assert.ok(
    drift < TARGET_EV * 0.005,
    `floor adds ${drift.toFixed(3)} points per spin, over the 0.5% bound`,
  );
});

test("a title's count is labelled by its pay mode, not its size", () => {
  // Regression: the word was chosen by whether the count passed a threshold,
  // so a 243-ways game was advertised as "243 lines".
  for (const row of lobby()) {
    const entry = slotById(row.id)!;
    assert.equal(row.payMode, entry.mechanic.payMode, row.id);
    if (entry.mechanic.payMode === "ways") {
      assert.equal(row.ways, waysCount(entry.mechanic.reels, entry.mechanic.rows), row.id);
    } else {
      assert.equal(row.ways, entry.mechanic.lines, row.id);
    }
  }
  // Both a small ways count and a large one must still read as ways.
  const small = lobby().find((r) => r.payMode === "ways" && r.ways < 999);
  assert.ok(small, "expected a ways game under a thousand ways");
});
