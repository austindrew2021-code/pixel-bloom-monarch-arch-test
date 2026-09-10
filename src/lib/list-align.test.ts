import assert from "node:assert/strict";
import test from "node:test";
import { alignListToCook, unlistedFoodsInSteps, withoutDenials } from "./list-align.ts";
import { RECIPES, recipeById } from "./recipes.ts";
import type { Recipe } from "./types.ts";

function fake(partial: Partial<Recipe> & Pick<Recipe, "id" | "name" | "ingredients" | "steps">): Recipe {
  return {
    protein: "veg",
    plate: "bowl",
    minutes: 20,
    servings: 4,
    pack: "free",
    tags: [],
    description: "",
    nutrition: { cal: 200, protein: 8, carbs: 24, fat: 8 },
    ...partial,
  };
}

const names = (r: Recipe) => r.ingredients.map((i) => i.name.toLowerCase());

test("every wired title lists the food its steps cook", () => {
  const bad = RECIPES.filter((r) => unlistedFoodsInSteps(r).length > 0).map(
    (r) => `${r.name} (${r.id}) misses ${unlistedFoodsInSteps(r).join(", ")}`,
  );
  assert.deepEqual(bad, [], bad.slice(0, 12).join("\n"));
});

test("no title ships an empty ingredient row", () => {
  for (const r of RECIPES) {
    assert.ok(r.ingredients.length > 0, r.id);
    for (const i of r.ingredients) {
      assert.ok(i.name.trim().length > 0, `${r.id} has a blank row`);
    }
  }
});

test("the named leaveners are on the list, not only in the step", () => {
  const pancakes = recipeById("blueberry-pancakes");
  assert.ok(pancakes);
  for (const need of ["baking powder", "sugar", "salt"]) {
    assert.ok(names(pancakes).includes(need), `pancakes miss ${need}`);
  }

  const cookies = recipeById("chip-cookies");
  assert.ok(cookies);
  assert.ok(names(cookies).includes("vanilla"));
  assert.ok(names(cookies).includes("baking soda"));

  const tonkatsu = recipeById("jp-tonkatsu");
  assert.ok(tonkatsu);
  assert.ok(names(tonkatsu).includes("flour"));
});

test("a title whose step says rice either lists rice or stops saying it", () => {
  // "Rice the avocado" is the verb, and a rice noodle is not a bag of rice.
  const notTheGrain = /rice (?:noodles?|cakes?|flour|vinegar|wine|paper)|\brice\s+(?:the|them|it)\b|\briced\b/gi;
  const bad = RECIPES.filter((r) => {
    const saysRice = r.steps.some((s) => /\brice\b/i.test(withoutDenials(s).replace(notTheGrain, " ")));
    return saysRice && !names(r).some((n) => /\brice\b/.test(n.replace(notTheGrain, " ")));
  }).map((r) => `${r.name} (${r.id})`);
  assert.deepEqual(bad, [], bad.join("\n"));
});

test("lamb plates carry the lamb protein tag, not beef", () => {
  for (const id of ["in-lamb-tagine", "ip-lamb-stew", "sp-lamb-meatballs", "gf-lamb-chops", "so-barbecued-lamb"]) {
    const r = recipeById(id);
    assert.ok(r, id);
    assert.equal(r.protein, "lamb", id);
  }
});

test("a diet badge never contradicts the rows under it", () => {
  const dairy = /\b(butter|milk|cream|cheese|yogurt|ghee)\b/i;
  const bad: string[] = [];
  for (const r of RECIPES) {
    const tags = r.tags ?? [];
    if (!tags.includes("dairy-free") && !tags.includes("vegan")) continue;
    const hit = r.ingredients.find(
      (i) =>
        dairy.test(i.name) &&
        // A row that offers a way out ("ghee or oil") is not a dairy row.
        !/\bor\b/i.test(i.name) &&
        // cream of tartar is a grape salt, not dairy.
        !/buttermilk|butternut|peanut butter|almond butter|coconut (milk|cream)|oat milk|soy milk|plant milk|rice milk|cashew milk|nut butter|butter beans|butter lettuce|cocoa butter|cream of tartar|nutritional yeast|vegan/i.test(
          i.name,
        ),
    );
    if (hit) bad.push(`${r.name} (${r.id}) is tagged ${tags.join("/")} but lists ${hit.name}`);
  }
  assert.deepEqual(bad, [], bad.join("\n"));
});

test("alignListToCook adds only what the method actually names", () => {
  const before = fake({
    id: "t-pancake",
    name: "Test pancake",
    ingredients: [{ name: "flour", qty: 1, unit: "cup", aisle: "Pantry" }],
    steps: ["Whisk flour, baking powder, and salt.", "Cook on a hot pan."],
  });
  const after = alignListToCook(before);
  assert.ok(names(after).includes("baking powder"));
  assert.ok(names(after).includes("salt"));
  assert.equal(names(after).includes("rice"), false);
});

test("alignListToCook leaves a list that already covers the method alone", () => {
  const recipe = fake({
    id: "t-covered",
    name: "Test covered",
    ingredients: [
      { name: "flour", qty: 1, unit: "cup", aisle: "Pantry" },
      { name: "kosher salt", qty: 1, unit: "tsp", aisle: "Herbs & Spices" },
    ],
    steps: ["Whisk the flour with salt."],
  });
  assert.equal(alignListToCook(recipe), recipe);
});

test("the verb 'to rice' does not order a bag of rice", () => {
  const recipe = fake({
    id: "t-riced",
    name: "Test croquettes",
    ingredients: [{ name: "potatoes", qty: 2, unit: "lb", aisle: "Produce" }],
    steps: ["Boil the potatoes, then rice them while hot.", "Shape and fry."],
  });
  assert.equal(names(alignListToCook(recipe)).includes("rice"), false);
});

test("a loaf the cook bakes is not a loaf to buy", () => {
  const recipe = fake({
    id: "t-fry-bread",
    name: "Test fry bread",
    ingredients: [
      { name: "flour", qty: 2, unit: "cups", aisle: "Pantry" },
      { name: "oil", qty: 1, unit: "cup", aisle: "Pantry" },
    ],
    steps: ["Stir the flour and water to a soft dough.", "Fry each round. Pile the beef on the fry bread."],
  });
  assert.equal(names(alignListToCook(recipe)).includes("bread"), false);
});

test("a hand-tagged vegan plate is never handed a butter", () => {
  const recipe = fake({
    id: "t-vegan",
    name: "Test vegan crumble",
    tags: ["vegan", "plant-based"],
    ingredients: [{ name: "coconut oil", qty: 4, unit: "tbsp", aisle: "Pantry" }],
    steps: ["Rub the butter into the oats."],
  });
  assert.equal(names(alignListToCook(recipe)).includes("butter"), false);
});
