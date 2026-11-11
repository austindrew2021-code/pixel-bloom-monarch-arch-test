import assert from "node:assert/strict";
import test from "node:test";
import { formatQty, pluralUnitWord } from "./format.ts";
import { scaleMethodSteps } from "./cook-steps.ts";

const UNITS = ["quart", "pint", "gallon", "cup", "ounce", "pound"];

test("units above one display plural (2 and 1½)", () => {
  for (const u of UNITS) {
    assert.equal(formatQty(2, u), `2 ${u}s`);
    assert.equal(formatQty(1.5, u), `1½ ${u}s`);
  }
});

test("one and below keep the singular forms unchanged", () => {
  for (const u of UNITS) {
    assert.equal(formatQty(1, u), `1 ${u}`);
    assert.equal(formatQty(0.5, u), `½ ${u}`);
    assert.equal(formatQty(1, `${u}s`), `1 ${u}`);
  }
});

test("abbreviations and already-plural words are left alone", () => {
  assert.equal(formatQty(2, "oz"), "2 oz");
  assert.equal(formatQty(2, "lb"), "2 lb");
  assert.equal(formatQty(2, "cups"), "2 cups");
  assert.equal(pluralUnitWord("Cup", 2), "Cups");
  assert.equal(pluralUnitWord("cup", 1), "cup");
  assert.equal(pluralUnitWord("clove", 2), "clove");
});

test("printed steps scaled above one carry the plural; native and hyphenated stay printed", () => {
  const ings = [{ name: "milk", qty: 1, unit: "quart" }, { name: "cherry tomatoes", qty: 1, unit: "pint" }];
  const steps = ["Scald 1 quart of milk. Add 1 pint cherry tomatoes to a 1-quart dish."];
  assert.deepEqual(scaleMethodSteps(steps, ings, 4, 4, { catalogFinal: true }), steps);
  assert.deepEqual(scaleMethodSteps(steps, ings, 8, 4, { catalogFinal: true }), [
    "Scald 2 quarts of milk. Add 2 pints cherry tomatoes to a 1-quart dish.",
  ]);
  assert.deepEqual(scaleMethodSteps(["Add 1 cup milk."], [{ name: "milk", qty: 1, unit: "cup" }], 2, 4, { catalogFinal: true }), ["Add ½ cup milk."]);
});
