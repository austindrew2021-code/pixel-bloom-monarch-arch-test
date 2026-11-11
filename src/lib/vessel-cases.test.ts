import assert from "node:assert/strict";
import test from "node:test";
import { scaleMethodSteps } from "./cook-steps.ts";
import { formatQty } from "./format.ts";
import { ingredientDisplay } from "./phrase-qty.ts";
import { RECIPES } from "./recipes.ts";

// Line audit (LINE-AUDIT-3119-NOV02.md): vessel/size words must never be pluralised or scaled.
const byId = (id: string) => {
  const r = RECIPES.find((x) => x.id === id);
  assert.ok(r, `${id} is live`);
  return r!;
};

const STEP_CASES: [string, string][] = [
  ["trp-014", "6 quart pot"],
  ["trp-025", "1 quart jar"],
  ["pp-009", "2 quart baking dish"],
  ["pta-170", "1 1/2 quart casserole"],
  ["so-india-relish", "5 to 6 pint jars"],
  ["lfo-018", "3 quart jars"],
  ["ds-feb-09-cranberry-shape", "1 pint mould"],
  ["ac-0004", "15 pound piece"],
];

for (const [id, phrase] of STEP_CASES) {
  test(`vessel at native: ${id} keeps "${phrase}"`, () => {
    const r = byId(id);
    const i = r.steps.findIndex((s) => s.includes(phrase));
    assert.ok(i >= 0, `${id} prints "${phrase}"`);
    const out = scaleMethodSteps(r.steps, r.ingredients, r.servings, r.servings, { catalogFinal: true });
    assert.equal(out[i], r.steps[i]);
  });
}

test("vessel at native: kleber-0150 '1 pound package grated cocoanut'", () => {
  const g = byId("kleber-0150").ingredients.find((x) => /^package grated cocoanut/.test(x.name))!;
  assert.deepEqual(ingredientDisplay(g, g.qty, formatQty, true), { qty: "1 pound", name: "package grated cocoanut" });
});

test("vessel at native: kleber-0250 '2 gallon crocks' stays singular", () => {
  const g = byId("kleber-0250").ingredients.find((x) => /^crocks of/.test(x.name))!;
  assert.deepEqual(ingredientDisplay(g, g.qty, formatQty, true), { qty: "2 gallon", name: "crocks of sliced green tomatoes" });
});

test("vessel at 2x: 'Slice 1 pound cake.' never becomes 'pounds cake'", () => {
  const out = scaleMethodSteps(["Slice 1 pound cake."], [{ name: "pound cake", qty: 1, unit: "" }], 8, 4, { catalogFinal: true });
  assert.doesNotMatch(out[0]!, /pounds\s+cake/);
  assert.equal(out[0], "Slice 1 pound cake.");
});

for (const [id, phrase] of [["pp-017", "two 1 lb. coffee cans"], ["pp-022", "12 cup bundt pan"]] as const) {
  test(`vessel at 0.5x/2x/3x: ${id} keeps "${phrase}"`, () => {
    const r = byId(id);
    const i = r.steps.findIndex((s) => s.includes(phrase));
    assert.ok(i >= 0, `${id} prints "${phrase}"`);
    for (const k of [0.5, 2, 3]) {
      const out = scaleMethodSteps(r.steps, r.ingredients, r.servings * k, r.servings, { catalogFinal: true });
      assert.ok(out[i]!.includes(phrase), `${id} ${k}x: ${out[i]}`);
    }
  });
}
