import assert from "node:assert/strict";
import test from "node:test";
import { isGlutenFree, isPescatarian, isSugarFree } from "./diet.ts";
import { recipeAllergens } from "./shield.ts";
import { RECIPES } from "./recipes.ts";

// Nov 10 r5: Line's FA0D HOLD (LINE-AUDIT-FA0D-NOV07.md) #1 and #5, plus the leaks the new detector found.
const byId = new Map(RECIPES.map((r) => [r.id, r]));
const get = (id: string) => {
  const r = byId.get(id);
  assert.ok(r, id);
  return r;
};

test("hill-0303 Moulded Halibut with Creamed Peas inherits Creamed Peas' flour and sugar", () => {
  const r = get("hill-0303");
  assert.equal(isGlutenFree(r), false);
  assert.equal(isSugarFree(r), false);
  assert.ok(recipeAllergens(r).includes("gluten"));
});

test("the 15-tag counts Line expects after hill-0303", () => {
  const count = (f: (id: string) => boolean) => RECIPES.filter((r) => f(r.id)).length;
  const has = new Map(RECIPES.map((r) => [r.id, new Set<string>(recipeAllergens(r))]));
  assert.equal(count((id) => isGlutenFree(get(id))), 761);
  assert.equal(count((id) => !has.get(id)!.has("gluten")), 761);
  assert.equal(count((id) => isSugarFree(get(id))), 668);
  assert.equal(count((id) => !has.get(id)!.has("egg")), 790);
  assert.equal(count((id) => !has.get(id)!.has("soy")), 1141);
  assert.equal(count((id) => !has.get(id)!.has("sesame")), 1312);
  assert.equal(count((id) => !has.get(id)!.has("fish")), 1149);
});

test("Line's 11 pescatarian losses", () => {
  for (const id of ["hill-0232", "kleber-0119", "so-cornmeal-dodger", "ds-oct-30-oranges-filled-with-jelly", "hill-0273", "mb-042", "bcx-261", "kleber-0042", "hill-0099", "so-chesapeake-turtle", "so-cornbread-dressing"])
    assert.equal(isPescatarian(get(id)), false, id);
});

test("pescatarian: gelatine products, aspic, franks, calf's feet, foie gras and schmaltz fail; fish stock and fish do not", () => {
  for (const id of ["pta-149", "km-057", "hill-0216", "kleber-0197", "ys-021", "ds-sep-11-calf-s-foot-jelly", "hill-0137", "vh-jw-latkes", "ds-jul-11-stuffed-spanish-cake"])
    assert.equal(isPescatarian(get(id)), false, id);
  assert.equal(isPescatarian(get("hill-0171")), true, "hill-0171 Fish Stock (\"for use in fish aspic\" is a note, not a row)");
  assert.equal(isPescatarian(get("hill-0283")), true, "hill-0283 Plain Lobster");
});

test("pescatarian: Amelia Simmons' paste No. 7 (lard) reaches the pies laid in it", () => {
  assert.equal(isPescatarian(get("ac-0044-7")), false);
  for (const id of ["ac-0037", "ac-0040-1", "ac-0042", "ac-0054"]) assert.equal(isPescatarian(get(id)), false, id);
  assert.equal(isPescatarian(get("ac-0043-3")), true, "paste No. 3 is butter");
});
