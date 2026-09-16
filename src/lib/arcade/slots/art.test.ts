import assert from "node:assert/strict";
import test from "node:test";
import { TARGET_EV } from "../games/types.ts";
import {
  LINEUPS, SHAPES, SHAPE_IDS, THEMED_LINEUP_IDS,
  ambientFor, lineupFor, shapeFor,
} from "./art.ts";
import { BIG_WIN_MULTIPLE, MEGA_WIN_MULTIPLE, bonusFor } from "./bonus.ts";
import { catalog } from "./catalog.ts";
import { THEMES } from "./themes.ts";

/* ------------------------------------------------------------------ shapes */

test("every shape has drawable path data", () => {
  for (const id of SHAPE_IDS) {
    const shape = SHAPES[id];
    assert.ok(shape.body.length > 20, `${id} has no body path`);
    // Paths must start with a move command or nothing renders.
    assert.match(shape.body, /^M/, `${id} body does not start with a move`);
    if (shape.detail) assert.match(shape.detail, /^M/, `${id} detail does not start with a move`);
    // Absolute coordinates should sit inside the 100x100 box. Only uppercase
    // M and L are checked: relative commands and arc flags carry negative
    // offsets that are perfectly legal and say nothing about placement.
    for (const [, x, y] of shape.body.matchAll(/(?:[ML])\s*(-?\d+(?:\.\d+)?)[\s,]+(-?\d+(?:\.\d+)?)/g)) {
      for (const n of [Number(x), Number(y)]) {
        assert.ok(n >= -10 && n <= 110, `${id} places a point off the canvas: ${n}`);
      }
    }
    // And nothing but legal path syntax.
    assert.doesNotMatch(shape.body, /[^MmLlHhVvCcSsQqTtAaZz0-9.,\s-]/, `${id} has stray characters`);
  }
});

test("every lineup is eight shapes the library actually has", () => {
  for (const lineup of LINEUPS) {
    assert.equal(lineup.shapes.length, 8, `${lineup.id} is not eight shapes`);
    for (const shape of lineup.shapes) {
      assert.ok(SHAPES[shape], `${lineup.id} names a shape that does not exist: ${shape}`);
    }
  }
  assert.equal(new Set(LINEUPS.map((l) => l.id)).size, LINEUPS.length, "duplicate lineup id");
});

test("a lineup does not repeat a shape across its paying symbols", () => {
  // Two paying symbols drawn identically would be unreadable on the reels.
  for (const lineup of LINEUPS) {
    const paying = lineup.shapes.slice(0, 6);
    assert.equal(new Set(paying).size, paying.length, `${lineup.id} repeats a paying shape`);
  }
});

/* ------------------------------------------------------------------ themes */

test("every theme in the catalogue has been given a lineup", () => {
  for (const theme of THEMES) {
    assert.ok(
      THEMED_LINEUP_IDS.includes(theme.id),
      `${theme.id} has no lineup and would fall back to the default`,
    );
  }
});

test("an unknown theme falls back rather than throwing", () => {
  // A missing lineup should degrade to plain reels, never to a blank machine.
  const fallback = lineupFor("not-a-theme");
  assert.ok(fallback.shapes.length === 8);
  assert.ok(SHAPES[shapeFor("not-a-theme", 0)]);
});

test("every symbol index of every title resolves to a real shape", () => {
  for (const entry of catalog()) {
    for (let symbol = 0; symbol < entry.symbols.length; symbol += 1) {
      const shape = shapeFor(entry.theme.id, symbol);
      assert.ok(SHAPES[shape], `${entry.id} symbol ${symbol} has no art`);
    }
  }
});

test("a symbol index past the lineup clamps instead of coming back undefined", () => {
  assert.ok(SHAPES[shapeFor("olympus", 99)]);
  assert.ok(SHAPES[shapeFor("olympus", -3)]);
});

test("every theme declares an ambient effect", () => {
  const known = new Set(LINEUPS.map((l) => l.ambient));
  for (const theme of THEMES) {
    assert.ok(known.has(ambientFor(theme.id)), `${theme.id} has no ambient effect`);
  }
});

test("storm themes get the lightning", () => {
  // The one effect that is explicitly per-theme rather than decorative.
  assert.equal(ambientFor("olympus"), "storm");
  assert.equal(ambientFor("frost-vault"), "snow");
  assert.equal(ambientFor("ember-peak"), "embers");
  assert.equal(ambientFor("deep-trench"), "bubbles");
  assert.equal(ambientFor("nebula"), "stars");
});

test("themes are spread across the lineups rather than piled on one", () => {
  const used = new Map<string, number>();
  for (const theme of THEMES) {
    const id = lineupFor(theme.id).id;
    used.set(id, (used.get(id) ?? 0) + 1);
  }
  assert.ok(used.size >= 7, `only ${used.size} lineups are in use`);
  for (const [id, count] of used) {
    assert.ok(count <= THEMES.length / 3, `${id} is worn by ${count} themes`);
  }
});

/* ------------------------------------------------------------------- bonus */

test("a feature always takes over, whatever it pays", () => {
  // The feature landing is the moment; a quiet free-spin round still earns it.
  assert.equal(bonusFor(0, TARGET_EV, true), "free-spins");
  assert.equal(bonusFor(TARGET_EV * 100, TARGET_EV, true), "free-spins");
});

test("big and mega wins fire at their multiples of a normal play", () => {
  assert.equal(bonusFor(TARGET_EV * BIG_WIN_MULTIPLE, TARGET_EV, false), "big-win");
  assert.equal(bonusFor(TARGET_EV * MEGA_WIN_MULTIPLE, TARGET_EV, false), "mega-win");
  assert.equal(bonusFor(TARGET_EV * (BIG_WIN_MULTIPLE - 1), TARGET_EV, false), null);
});

test("an ordinary win gets no takeover", () => {
  // A celebration on every spin is not a celebration.
  for (const points of [0, 1, TARGET_EV, TARGET_EV * 2, TARGET_EV * 7]) {
    assert.equal(bonusFor(points, TARGET_EV, false), null, `${points} should be quiet`);
  }
});

test("the thresholds are relative, so they mean the same on every title", () => {
  // The same multiple of two different targets must reach the same verdict.
  assert.equal(bonusFor(10 * MEGA_WIN_MULTIPLE, 10, false), "mega-win");
  assert.equal(bonusFor(1000 * MEGA_WIN_MULTIPLE, 1000, false), "mega-win");
  assert.equal(bonusFor(10 * BIG_WIN_MULTIPLE, 10, false), "big-win");
  assert.equal(bonusFor(1000 * BIG_WIN_MULTIPLE, 1000, false), "big-win");
});
