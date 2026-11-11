import assert from "node:assert/strict";
import test from "node:test";
import { ALLERGIES, recipeAllergens, recipeSafe } from "./shield.ts";
import { shield4TermFail } from "./shields4.ts";
import { SHIELD4_BOUGHT_ALL, XREF4_EGG } from "./shields4-doubt.ts";
import { RECIPES } from "./recipes.ts";
import type { Recipe } from "./types";

const mk = (rows: string[], steps: string[] = [], name = "Test dish"): Recipe =>
  ({ id: "t-1", name, description: "", tags: [], servings: 4, ingredients: rows.map((n) => ({ name: n, qty: 1, unit: "" })), steps } as unknown as Recipe);

test("four new shields are listed after the existing five", () => {
  assert.deepEqual(ALLERGIES.map((a) => a.id), ["gluten", "dairy", "nuts", "shellfish", "spicy", "egg", "soy", "sesame", "fish"]);
});

test("rows fail the matching shield", () => {
  assert.ok(shield4TermFail(mk(["mayonnaise"]), "egg"));
  assert.ok(shield4TermFail(mk(["egg noodles"]), "egg"));
  assert.ok(shield4TermFail(mk(["sponge cake"]), "egg"));
  assert.ok(shield4TermFail(mk(["white miso"]), "soy"));
  assert.ok(shield4TermFail(mk(["Worcestershire"]), "soy"));
  assert.ok(shield4TermFail(mk(["tahini"]), "sesame"));
  assert.ok(shield4TermFail(mk(["hummus"]), "sesame"));
  assert.ok(shield4TermFail(mk(["Worcestershire"]), "fish"));
  assert.ok(shield4TermFail(mk(["fish sauce"]), "fish"));
  assert.ok(shield4TermFail(mk(["haddock"]), "fish"));
  assert.ok(shield4TermFail(mk(["imitation crab"]), "fish"));
});

test("steps count too", () => {
  assert.ok(shield4TermFail(mk(["flour"], ["Brush with beaten egg."]), "egg"));
  assert.ok(shield4TermFail(mk(["rice"], ["Sprinkle sesame over."]), "sesame"));
});

test("lookalikes do not fail; plain rows pass", () => {
  assert.equal(shield4TermFail(mk(["eggplant", "olive oil"]), "egg"), false);
  assert.equal(shield4TermFail(mk(["rice"], ["Halve the onions."]), "sesame"), false);
  assert.equal(shield4TermFail(mk(["shellfish stock"], ["Use a fish-kettle."]), "fish"), false);
  assert.equal(shield4TermFail(mk(["sugar"], ["Heat to 240° on a candy thermometer."]), "soy"), false);
  const plain = mk(["potatoes", "salt", "olive oil"]);
  for (const t of ["egg", "soy", "sesame", "fish"] as const) assert.ok(recipeSafe(plain, [t]));
});

test("bought multi-ingredient products and inherited cross-references fail all four", () => {
  const bought = RECIPES.find((r) => r.id === "chicken-stir-fry")!; // soy sauce
  for (const t of ["egg", "soy", "sesame", "fish"] as const) assert.ok(recipeAllergens(bought).includes(t));
  for (const id of [...SHIELD4_BOUGHT_ALL].slice(0, 20)) {
    const r = RECIPES.find((x) => x.id === id);
    if (r) for (const t of ["egg", "soy", "sesame", "fish"] as const) assert.ok(!recipeSafe(r, [t]), `${id} ${t}`);
  }
  for (const id of XREF4_EGG) { const r = RECIPES.find((x) => x.id === id); if (r) assert.ok(!recipeSafe(r, ["egg"]), id); }
});

test("size comparisons are not egg (Nov 7)", () => {
  for (const s of ["butter the size of an egg", "a piece of butter the size of a small egg", "an egg-sized lump of lard", "suet as big as an egg", "butter size of two eggs"])
    assert.equal(shield4TermFail(mk(["flour", s]), "egg"), false, s);
  assert.ok(shield4TermFail(mk(["butter the size of an egg", "2 eggs"]), "egg"));
  assert.ok(shield4TermFail(mk(["flour"], ["Add butter the size of an egg, then 1 beaten egg."]), "egg"));
});

test("badges read the same shields, in full words", async () => {
  const { passBadges } = await import("./badges.ts");
  const plain = mk(["potatoes", "salt", "olive oil"]);
  const b = passBadges(plain);
  for (const w of ["Egg-free", "Soy-free", "Sesame-free", "Fish-free"]) assert.ok(b.includes(w as never), w);
  for (const r of RECIPES.slice(0, 600)) {
    const has = new Set(recipeAllergens(r));
    const pb = new Set<string>(passBadges(r));
    assert.equal(pb.has("Egg-free"), !has.has("egg"), r.id);
    assert.equal(pb.has("Soy-free"), !has.has("soy"), r.id);
    assert.equal(pb.has("Sesame-free"), !has.has("sesame"), r.id);
    assert.equal(pb.has("Fish-free"), !has.has("fish"), r.id);
  }
});

test("gym plate honours the four new shields", async () => {
  const { foodsInRole } = await import("./gym-plate.ts");
  const ids = (a: ("egg" | "soy" | "sesame" | "fish")[]) => new Set(["protein", "carb", "veg", "fat"].flatMap((r) => foodsInRole(r as never, { allergies: a }).map((f) => f.id)));
  const noEgg = ids(["egg"]), noSoy = ids(["soy"]), noSes = ids(["sesame"]), noFish = ids(["fish"]);
  for (const id of ["eggs", "egg-whites", "pasta", "bagel"]) assert.ok(!noEgg.has(id), id);
  for (const id of ["tofu", "tempeh", "whey"]) assert.ok(!noSoy.has(id), id);
  assert.ok(!noSes.has("bagel"));
  for (const id of ["salmon", "white-fish"]) assert.ok(!noFish.has(id), id);
  assert.ok(noFish.has("chicken-breast") && noEgg.has("chicken-breast"));
});

test("fish stays separate from shellfish", () => {
  assert.ok(shield4TermFail(mk(["haddock"]), "fish"));
  assert.equal(recipeAllergens(mk(["haddock", "potatoes"])).includes("shellfish"), false);
  assert.equal(shield4TermFail(mk(["shrimp"]), "fish"), false);
});
