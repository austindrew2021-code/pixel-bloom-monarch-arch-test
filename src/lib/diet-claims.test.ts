import assert from "node:assert/strict";
import test from "node:test";
import {
  isDairyFree,
  isGlutenFree,
  isPescatarian,
  isSugarFree,
  isVegan,
  isVegetarian,
} from "./diet.ts";
import { RECIPES } from "./recipes.ts";

/**
 * A dietary claim is a promise, and the ingredient list is the only thing that
 * can keep it.
 *
 * Every check in diet.ts used to open with `if (tags.includes(claim)) return
 * true`, so a hand-written tag switched the ingredient test off. 234 claims
 * were false: a vegan filter offered goose-fat roast potatoes, lard refried
 * beans and ghee dal; a gluten-free filter offered tourtière and baked kibbeh;
 * 98 dishes with sugar in them were sugar-free. Someone with celiac disease
 * trusts that filter, so these hold the line.
 */
const CLAIMS: [string, (r: (typeof RECIPES)[number]) => boolean][] = [
  ["vegetarian", isVegetarian],
  ["vegan", isVegan],
  ["plant-based", isVegan],
  ["gluten-free", isGlutenFree],
  ["dairy-free", isDairyFree],
  ["sugar-free", isSugarFree],
  ["pescatarian", isPescatarian],
];

test("no recipe carries a dietary claim its ingredients deny", () => {
  const broken: string[] = [];
  for (const recipe of RECIPES) {
    for (const [claim, earns] of CLAIMS) {
      if (recipe.tags.includes(claim) && !earns(recipe)) {
        broken.push(`${recipe.id} (${recipe.name}) claims ${claim}: ${recipe.ingredients.map((i) => i.name).join(", ")}`);
      }
    }
  }
  assert.deepEqual(broken, [], broken.slice(0, 12).join("\n"));
});

test("a tag cannot grant a claim the ingredients deny", () => {
  // The exact shape of the old bug, held as a unit so it cannot come back by
  // some other route.
  const lardy = {
    ...RECIPES.find((r) => r.protein === "veg")!,
    id: "t-lard",
    name: "Test beans",
    tags: ["vegan", "vegetarian", "gluten-free", "dairy-free", "sugar-free"],
    ingredients: [
      { name: "pinto beans", qty: 2, unit: "cups", aisle: "Pantry" as const },
      { name: "lard", qty: 2, unit: "tbsp", aisle: "Pantry" as const },
    ],
  };
  assert.equal(isVegan(lardy), false, "lard is not vegan");
  assert.equal(isVegetarian(lardy), false, "lard is not vegetarian");
});

test("two ingredient rows never fuse into a third ingredient", () => {
  // "grated coconut" next to "butter" is not coconut butter, and "short-grain
  // rice" next to "milk" is not rice milk. Both slipped past as vegan when the
  // rows were joined with a space.
  const base = RECIPES.find((r) => r.protein === "veg")!;
  const praline = {
    ...base,
    id: "t-praline",
    name: "Test praline",
    tags: ["vegan"],
    ingredients: [
      { name: "grated coconut", qty: 1, unit: "cup", aisle: "Pantry" as const },
      { name: "butter", qty: 2, unit: "tbsp", aisle: "Dairy & Eggs" as const },
    ],
  };
  assert.equal(isVegan(praline), false, "dairy butter is not vegan");

  const pudding = {
    ...base,
    id: "t-pudding",
    name: "Test pudding",
    tags: ["vegan"],
    ingredients: [
      { name: "short-grain rice", qty: 1, unit: "cup", aisle: "Pantry" as const },
      { name: "milk", qty: 3, unit: "cups", aisle: "Dairy & Eggs" as const },
    ],
  };
  assert.equal(isVegan(pudding), false, "dairy milk is not vegan");

  // And the real lookalikes still pass.
  const oatmeal = {
    ...base,
    id: "t-oat",
    name: "Test oats",
    tags: [],
    ingredients: [
      { name: "rolled oats", qty: 1, unit: "cup", aisle: "Pantry" as const },
      { name: "oat milk", qty: 1, unit: "cup", aisle: "Dairy & Eggs" as const },
      { name: "almond butter", qty: 1, unit: "tbsp", aisle: "Pantry" as const },
    ],
  };
  assert.equal(isVegan(oatmeal), true, "oat milk and almond butter are vegan");
});
