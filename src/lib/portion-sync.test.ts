import assert from "node:assert/strict";
import test from "node:test";
import { portionSyncFor } from "./portion-sync.ts";
import type { Recipe } from "./types.ts";

function almondChicken(): Recipe {
  return {
    id: "almond-chicken",
    name: "Almond chicken",
    description: "",
    minutes: 30,
    servings: 4,
    protein: "chicken",
    plate: "bowl",
    pack: "free",
    tags: [],
    ingredients: [
      { name: "chicken breast", qty: 1.5, unit: "lb", aisle: "Meat & Seafood" },
      { name: "almonds", qty: 0.5, unit: "cup", aisle: "Pantry" },
      { name: "broccoli", qty: 2, unit: "cups", aisle: "Produce" },
      { name: "carrots", qty: 2, unit: "", aisle: "Produce" },
      { name: "soy sauce", qty: 3, unit: "tbsp", aisle: "Pantry" },
    ],
    steps: [],
    nutrition: { cal: 600, protein: 45, carbs: 40, fat: 25 },
  };
}

test("a small swing (within the deadband) makes no change", () => {
  assert.equal(portionSyncFor(almondChicken(), 610), null);
  assert.equal(portionSyncFor(almondChicken(), 580), null);
});

test("a bigger-than-planned burn scales the portion up, produce more than protein", () => {
  const result = portionSyncFor(almondChicken(), 900); // 1.5x the recipe's calories
  assert.ok(result);
  assert.ok(result!.mult > 1, `expected mult > 1, got ${result!.mult}`);

  const base = almondChicken();
  const chicken = result!.ingredients.find((i) => i.name === "chicken breast")!;
  const broccoli = result!.ingredients.find((i) => i.name === "broccoli")!;
  const baseChicken = base.ingredients.find((i) => i.name === "chicken breast")!.qty;
  const baseBroccoli = base.ingredients.find((i) => i.name === "broccoli")!.qty;

  const chickenGrowth = chicken.qty / baseChicken;
  const broccoliGrowth = broccoli.qty / baseBroccoli;
  assert.ok(broccoliGrowth > chickenGrowth, `produce (${broccoliGrowth}) should grow more than protein (${chickenGrowth})`);
  // The 1.15 band cap plus scaleQty's nearest-quarter-unit rounding at this base
  // quantity can land a hair over — allow that rounding slack, not a looser cap.
  assert.ok(chickenGrowth <= 1.2, `protein should stay near its capped band, got ${chickenGrowth}`);
});

test("a lighter-than-planned day scales the portion down without implying a bigger purchase", () => {
  const result = portionSyncFor(almondChicken(), 400); // well under the recipe's calories
  assert.ok(result);
  assert.ok(result!.mult < 1, `expected mult < 1, got ${result!.mult}`);
  assert.match(result!.note, /lighter day/i);
  assert.match(result!.note, /instead of buying more/i);
});

test("scaled nutrition is derived from the scaled macros, not guessed independently", () => {
  const result = portionSyncFor(almondChicken(), 900)!;
  const expectedCal = Math.round(result.nutrition.protein * 4 + result.nutrition.carbs * 4 + result.nutrition.fat * 9);
  assert.equal(result.nutrition.cal, expectedCal);
});

test("the note names the actual ingredients that changed", () => {
  const result = portionSyncFor(almondChicken(), 900)!;
  assert.match(result.note, /broccoli/i);
  assert.match(result.note, /chicken breast/i);
});

test("the overall swing is capped so nobody is told to eat double dinner", () => {
  const huge = portionSyncFor(almondChicken(), 5000)!;
  assert.ok(huge.mult <= 1.4, `expected mult capped at 1.4, got ${huge.mult}`);
  const tiny = portionSyncFor(almondChicken(), 10)!;
  assert.ok(tiny.mult >= 0.7, `expected mult floored at 0.7, got ${tiny.mult}`);
});

test("returns null when there is nothing to scale from", () => {
  const noCalRecipe = { ...almondChicken(), nutrition: { cal: 0, protein: 0, carbs: 0, fat: 0 } };
  assert.equal(portionSyncFor(noCalRecipe, 600), null);
  assert.equal(portionSyncFor(almondChicken(), 0), null);
  assert.equal(portionSyncFor(almondChicken(), -50), null);
});
