import assert from "node:assert/strict";
import test from "node:test";
import { fitsGoal, fitsInventedGoal, isCutOffGoal, strictestGoal } from "./goal-fit.ts";
import type { Recipe } from "./types.ts";

function fake(partial: Partial<Recipe> & Pick<Recipe, "name">): Recipe {
  return {
    id: partial.id ?? "x",
    minutes: 30,
    servings: 4,
    protein: "veg",
    plate: "skillet",
    pack: "free",
    tags: [],
    description: "",
    nutrition: { cal: 260, protein: 6, carbs: 36, fat: 10 },
    ingredients: [{ name: "cornmeal", qty: 2, unit: "cups", aisle: "Pantry" }],
    steps: ["Fry."],
    ...partial,
  };
}

test("hush puppies and cornbread never fit a Cut dinner", () => {
  const hush = fake({ name: "Tallahassee hush puppies" });
  const corn = fake({ name: "Cornbread dressing", id: "so-cornbread-dressing" });
  const fritters = fake({ name: "Cornbread fritters" });
  assert.equal(isCutOffGoal(hush), true);
  assert.equal(isCutOffGoal(corn), true);
  assert.equal(isCutOffGoal(fritters), true);
  assert.equal(fitsGoal(hush, "lose"), false);
  assert.equal(fitsGoal(corn, "lose"), false);
  assert.equal(fitsGoal(fritters, "lose"), false);
});

test("Chef inventions named cornbread fritters are rejected on a Cut", () => {
  assert.equal(
    fitsInventedGoal({ name: "Cornbread fritters", nutrition: { cal: 410, protein: 8, carbs: 48, fat: 18 } }, "lose"),
    false,
  );
});

test("high-protein skillet chicken still fits a Cut", () => {
  const chicken = fake({
    name: "Lemon garlic roast chicken",
    protein: "chicken",
    plate: "roast",
    nutrition: { cal: 420, protein: 38, carbs: 6, fat: 26 },
    ingredients: [{ name: "whole chicken", qty: 1, unit: "bird", aisle: "Meat & Seafood" }],
  });
  assert.equal(isCutOffGoal(chicken), false);
  assert.equal(fitsGoal(chicken, "lose"), true);
});

test("family table follows the strictest seat", () => {
  assert.equal(strictestGoal(["lean", "lose", "performance"]), "lose");
  assert.equal(strictestGoal(["performance", "maintain"]), "maintain");
});

test("affogato and desserts never fit a Cut dinner", () => {
  const affogato = fake({
    id: "it-affogato",
    name: "Affogato",
    plate: "dessert",
    tags: ["dessert"],
    nutrition: { cal: 220, protein: 4, carbs: 22, fat: 12 },
    ingredients: [
      { name: "vanilla ice cream", qty: 4, unit: "scoops", aisle: "Frozen" },
      { name: "espresso", qty: 4, unit: "shots", aisle: "Other" },
    ],
  });
  assert.equal(isCutOffGoal(affogato), true);
  assert.equal(fitsGoal(affogato, "lose"), false);
  assert.equal(
    fitsInventedGoal({ name: "Affogato", nutrition: { cal: 220, protein: 4, carbs: 22, fat: 12 } }, "lose"),
    false,
  );
  assert.equal(
    fitsInventedGoal({ name: "Vanilla ice cream sundae", nutrition: { cal: 380, protein: 6, carbs: 42, fat: 18 } }, "lose"),
    false,
  );
});
