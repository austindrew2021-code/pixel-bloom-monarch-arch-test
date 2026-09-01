import assert from "node:assert/strict";
import test from "node:test";
import { mealSavings, plateCost, takeoutCost } from "./shield.ts";
import type { Protein, Recipe } from "./types.ts";

const PROTEINS: Protein[] = ["chicken", "beef", "pork", "fish", "seafood", "veg", "eggs", "turkey"];

function mk(protein: Protein, servings = 4, ingredientCount = 6): Recipe {
  return {
    id: `test-${protein}`,
    name: "Test plate",
    description: "",
    minutes: 30,
    servings,
    protein,
    plate: "bowl",
    pack: "free",
    tags: [],
    ingredients: Array.from({ length: ingredientCount }, (_, i) => ({
      name: `ingredient ${i}`,
      qty: 1,
      unit: "",
      aisle: "Pantry",
    })),
    steps: [],
    nutrition: { cal: 500, protein: 30, carbs: 40, fat: 15 },
  };
}

test("takeoutCost is always higher than plateCost, for every protein", () => {
  for (const protein of PROTEINS) {
    const recipe = mk(protein);
    assert.ok(
      takeoutCost(recipe, 4) > plateCost(recipe, 4),
      `${protein}: expected takeout cost to exceed grocery cost`,
    );
  }
});

test("mealSavings is never negative and matches the takeout/grocery delta", () => {
  for (const protein of PROTEINS) {
    const recipe = mk(protein);
    const savings = mealSavings(recipe, 4);
    assert.equal(savings, takeoutCost(recipe, 4) - plateCost(recipe, 4));
    assert.ok(savings > 0, `${protein}: expected positive savings on a typical plate`);
  }
});

test("cost scales with household size relative to servings", () => {
  const recipe = mk("chicken", 4);
  const forTwo = plateCost(recipe, 2);
  const forEight = plateCost(recipe, 8);
  assert.ok(forEight > forTwo);
  const ratio = (forEight / forTwo) * 100;
  assert.ok(ratio > 380 && ratio < 420, `expected ~4x scaling, got ${ratio}%`);
});

test("household is floored at 1 even if passed as 0", () => {
  const recipe = mk("veg");
  assert.ok(takeoutCost(recipe, 0) > 0);
});
