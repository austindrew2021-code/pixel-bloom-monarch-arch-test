import assert from "node:assert/strict";
import test from "node:test";
import { LEFTOVER_PASTA, parseIngredientLines } from "./easy-kitchen.ts";

test("leftover pasta is ordinary pantry + dairy, no figs", () => {
  const n = LEFTOVER_PASTA.ingredients.map((i) => i.name.toLowerCase());
  assert.deepEqual(n.sort(), ["milk", "pasta", "tomato sauce"].sort());
  assert.ok(!n.some((x) => x.includes("fig") || x.includes("truffle") || x.includes("saffron")));
});

test("parseIngredientLines keeps a typed leftover list", () => {
  const parsed = parseIngredientLines("pasta, 12 oz\ntomato sauce, 1 jar\nmilk, 1 cup");
  assert.equal(parsed.length, 3);
  assert.equal(parsed[0]?.name, "pasta");
  assert.equal(parsed[2]?.name, "milk");
});
