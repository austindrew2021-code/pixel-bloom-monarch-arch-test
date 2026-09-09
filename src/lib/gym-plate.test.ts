import assert from "node:assert/strict";
import test from "node:test";
import {
  GYM_FOODS,
  buildGymPlate,
  defaultPlateFoods,
  foodsInRole,
  type GymPlate,
} from "./gym-plate.ts";

const target = { cal: 800, protein: 60, carbs: 80, fat: 22 };

function macrosOf(plate: GymPlate) {
  return { protein: plate.totals.protein, carbs: plate.totals.carbs, fat: plate.totals.fat };
}

test("chicken, rice, broccoli and oil lands on the macros", () => {
  const plate = buildGymPlate({
    target,
    protein: "chicken-breast",
    carb: "white-rice",
    veg: "broccoli",
    fat: "olive-oil",
  });
  assert.ok(plate);
  assert.equal(plate.onTarget, true, JSON.stringify(plate.off));
  assert.equal(plate.items.length, 4);
  // And the grams are real portions, not a rounding artefact.
  for (const item of plate.items) {
    assert.ok(item.grams >= item.food.minG, `${item.food.id} ${item.grams}g`);
    assert.ok(item.grams <= item.food.maxG, `${item.food.id} ${item.grams}g`);
    assert.equal(item.grams % 5, 0, `${item.food.id} ${item.grams}g is not weighable`);
  }
});

test("the totals it reports are the totals of what it listed", () => {
  const plate = buildGymPlate({
    target,
    protein: "chicken-breast",
    carb: "potato",
    veg: "green-beans",
    fat: "almonds",
  });
  assert.ok(plate);
  const sum = plate.items.reduce(
    (acc, i) => ({
      cal: acc.cal + (i.food.per100.cal * i.grams) / 100,
      protein: acc.protein + (i.food.per100.protein * i.grams) / 100,
      carbs: acc.carbs + (i.food.per100.carbs * i.grams) / 100,
      fat: acc.fat + (i.food.per100.fat * i.grams) / 100,
    }),
    { cal: 0, protein: 0, carbs: 0, fat: 0 },
  );
  assert.equal(plate.totals.protein, Math.round(sum.protein));
  assert.equal(plate.totals.carbs, Math.round(sum.carbs));
  assert.equal(plate.totals.fat, Math.round(sum.fat));
  assert.equal(plate.totals.cal, Math.round(sum.cal));
});

test("foods that carry more than one macro are still solved, not fudged", () => {
  // Peanut butter is a fat with 25 g of protein and 20 g of carbs per 100 g,
  // and oats are a carb with fat in them. Solving one macro at a time leaves an
  // error here; solving together should not.
  const plate = buildGymPlate({
    target: { cal: 700, protein: 45, carbs: 70, fat: 20 },
    protein: "greek-yogurt",
    carb: "oats",
    veg: "spinach",
    fat: "peanut-butter",
  });
  assert.ok(plate);
  assert.ok(Math.abs(plate.off.protein) <= 8, `protein off by ${plate.off.protein}`);
  assert.ok(Math.abs(plate.off.carbs) <= 12, `carbs off by ${plate.off.carbs}`);
  assert.ok(Math.abs(plate.off.fat) <= 6, `fat off by ${plate.off.fat}`);
});

test("a bigger target means more food, not the same plate", () => {
  const small = buildGymPlate({ target, protein: "chicken-breast", carb: "white-rice", veg: "broccoli", fat: "olive-oil" });
  const big = buildGymPlate({
    target: { cal: 1200, protein: 90, carbs: 130, fat: 30 },
    protein: "chicken-breast",
    carb: "white-rice",
    veg: "broccoli",
    fat: "olive-oil",
  });
  assert.ok(small && big);
  assert.ok(big.items[0]!.grams > small.items[0]!.grams, "more protein target, more chicken");
  assert.ok(big.items[1]!.grams > small.items[1]!.grams, "more carb target, more rice");
  assert.ok(macrosOf(big).protein > macrosOf(small).protein);
});

test("a cut plate and a bulk plate are different plates", () => {
  const cut = buildGymPlate({
    target: { cal: 600, protein: 55, carbs: 45, fat: 15 },
    protein: "chicken-breast", carb: "white-rice", veg: "broccoli", fat: "olive-oil",
  });
  const bulk = buildGymPlate({
    target: { cal: 1100, protein: 60, carbs: 140, fat: 30 },
    protein: "chicken-breast", carb: "white-rice", veg: "broccoli", fat: "olive-oil",
  });
  assert.ok(cut && bulk);
  assert.ok(bulk.items[1]!.grams > cut.items[1]!.grams * 1.5, "a bulk should carry far more rice");
});

test("it never asks for a portion nobody would eat", () => {
  // A tiny fat target with a fatty protein would solve to negative oil.
  const plate = buildGymPlate({
    target: { cal: 500, protein: 50, carbs: 40, fat: 5 },
    protein: "salmon",
    carb: "white-rice",
    veg: "broccoli",
    fat: "olive-oil",
  });
  assert.ok(plate);
  for (const item of plate.items) {
    assert.ok(item.grams > 0, `${item.food.id} came out at ${item.grams}g`);
    assert.ok(item.grams >= item.food.minG);
  }
  // Clamping means it cannot land, and it must say so rather than pretend.
  assert.equal(plate.onTarget, false);
  assert.ok(plate.off.fat < 0, "should admit it overshot the fat");
});

test("vegetables are a portion, not a variable", () => {
  const a = buildGymPlate({ target, protein: "chicken-breast", carb: "white-rice", veg: "broccoli", fat: "olive-oil" });
  const b = buildGymPlate({
    target: { cal: 1400, protein: 100, carbs: 150, fat: 35 },
    protein: "chicken-breast", carb: "white-rice", veg: "broccoli", fat: "olive-oil",
  });
  assert.ok(a && b);
  const vegOf = (p: GymPlate) => p.items.find((i) => i.food.role === "veg")!.grams;
  assert.equal(vegOf(a), vegOf(b), "nobody scales their broccoli to hit a macro");
});

test("a plate can be built without a vegetable", () => {
  const plate = buildGymPlate({ target, protein: "chicken-breast", carb: "white-rice", fat: "olive-oil" });
  assert.ok(plate);
  assert.equal(plate.items.length, 3);
  assert.equal(plate.onTarget, true, JSON.stringify(plate.off));
});

test("an unknown food is refused rather than guessed at", () => {
  assert.equal(
    buildGymPlate({ target, protein: "unicorn", carb: "white-rice", fat: "olive-oil" }),
    null,
  );
});

test("a vegan kitchen is offered only vegan foods", () => {
  for (const role of ["protein", "carb", "veg", "fat"] as const) {
    const options = foodsInRole(role, { vegan: true });
    assert.ok(options.length > 0, `nothing vegan in ${role}`);
    for (const food of options) assert.equal(food.vegan, true, food.id);
  }
  const vegan = defaultPlateFoods({ vegan: true });
  assert.equal(vegan.protein, "tofu");
  const plate = buildGymPlate({ target, ...vegan });
  assert.ok(plate);
});

test("a vegetarian kitchen keeps eggs and dairy but loses the meat", () => {
  const proteins = foodsInRole("protein", { vegetarian: true }).map((f) => f.id);
  assert.ok(proteins.includes("greek-yogurt"));
  assert.ok(proteins.includes("eggs"));
  assert.equal(proteins.includes("chicken-breast"), false);
});

test("every food's calories match its own macros", () => {
  for (const food of GYM_FOODS) {
    const fromMacros = food.per100.protein * 4 + food.per100.carbs * 4 + food.per100.fat * 9;
    // Atwater factors are rounded per food, so allow a little slack; a typo
    // in a macro shows up as a much bigger gap than this.
    assert.ok(
      Math.abs(fromMacros - food.per100.cal) <= Math.max(25, food.per100.cal * 0.12),
      `${food.id}: ${food.per100.cal} kcal listed, ${Math.round(fromMacros)} from macros`,
    );
  }
});

test("portion bounds are sane for every food", () => {
  for (const food of GYM_FOODS) {
    assert.ok(food.minG > 0 && food.minG < food.typicalG, food.id);
    assert.ok(food.typicalG < food.maxG, food.id);
  }
});
