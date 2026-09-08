import assert from "node:assert/strict";
import test from "node:test";
import {
  isSilentZeroNutrition,
  mealsCountTowardFuel,
  snackCountsTowardFuel,
  sumSnacksForFuel,
} from "./eaten.ts";

test("favorites plate is not eaten until the day is logged", () => {
  assert.equal(mealsCountTowardFuel("2026-09-05", []), false);
  assert.equal(mealsCountTowardFuel("2026-09-05", ["2026-09-04"]), false);
  assert.equal(mealsCountTowardFuel("2026-09-05", ["2026-09-05"]), true);
});

test("unknown-macro snacks stay off Fuel totals", () => {
  assert.equal(snackCountsTowardFuel({}), true);
  assert.equal(snackCountsTowardFuel({ unknownMacros: true }), false);
  const sum = sumSnacksForFuel(
    [
      { id: "a", date: "2026-09-05", name: "Yogurt", nutrition: { cal: 150, protein: 15, carbs: 8, fat: 4 } },
      {
        id: "b",
        date: "2026-09-05",
        name: "Mystery barcode",
        nutrition: { cal: 0, protein: 0, carbs: 0, fat: 0 },
        unknownMacros: true,
      },
    ],
    "2026-09-05",
  );
  assert.equal(sum.cal, 150);
  assert.equal(sum.protein, 15);
});

test("0/0 is a silent empty log", () => {
  assert.equal(isSilentZeroNutrition({ cal: 0, protein: 0, carbs: 0, fat: 0 }), true);
  assert.equal(isSilentZeroNutrition({ cal: 210, protein: 7, carbs: 42, fat: 1 }), false);
});
