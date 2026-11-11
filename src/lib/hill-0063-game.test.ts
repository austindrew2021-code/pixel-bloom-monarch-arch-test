import assert from "node:assert/strict";
import test from "node:test";
import { RECIPES } from "./recipes.ts";
import {
  isDairyFree,
  isGlutenFree,
  isKeto,
  isPescatarian,
  isSugarFree,
  isVegan,
  isVegetarian,
} from "./diet.ts";
import { recipeAllergens } from "./shield.ts";

/**
 * hill-0063 Artichoke Salad (Janet McKenzie Hill, Gutenberg #19077).
 * The printed subtitle is "(_For game._)" — a serving suggestion, not an ingredient.
 * The parser turned that into a stray "game" row. Line flagged it (LINE-AUDIT-8D30).
 */
test("hill-0063 has no stray game ingredient row", () => {
  const r = RECIPES.find((x) => x.id === "hill-0063");
  assert.ok(r, "hill-0063 is in the catalog");
  assert.equal(r?.name, "Artichoke Salad");
  const foods = (r?.ingredients ?? []).map((i) => String(i.name ?? "").toLowerCase());
  assert.equal(foods.includes("game"), false);
  // Printed foods from the method are still present.
  for (const need of ["olive oil", "lemon juice", "salt", "paprica", "oranges", "celery", "artichokes"]) {
    assert.ok(foods.includes(need), `missing printed food: ${need}`);
  }
  const steps = (r?.steps ?? []).join("\n").toLowerCase();
  assert.match(steps, /oranges/);
  assert.match(steps, /celery/);
  assert.match(steps, /olive oil/);
  assert.match(steps, /lemon juice/);
  assert.match(steps, /artichokes/);
  assert.doesNotMatch(steps, /\bgame\b/);
});

test("hill-0063 diet and shield passes do not gain from dropping the game row", () => {
  const r = RECIPES.find((x) => x.id === "hill-0063");
  assert.ok(r);
  assert.equal(isPescatarian(r!), true);
  // These were already failing before the row was removed; they must not newly pass.
  assert.equal(isVegetarian(r!), false);
  assert.equal(isVegan(r!), false);
  assert.equal(isGlutenFree(r!), false);
  assert.equal(isDairyFree(r!), false);
  assert.equal(isSugarFree(r!), false);
  assert.equal(isKeto(r!), false);
  const allergens = new Set(recipeAllergens(r!));
  for (const s of ["gluten", "dairy", "nuts", "shellfish", "spicy", "egg", "soy", "sesame", "fish"] as const) {
    assert.ok(allergens.has(s), `shield still fails ${s}`);
  }
});
