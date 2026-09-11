import { test } from "node:test";
import assert from "node:assert/strict";
import { RECIPES } from "./recipes.ts";
import { SOUTHERN_RECIPES } from "./catalog-southern.ts";
import { HERITAGE_RECIPES } from "./catalog-heritage.ts";
import { BOOK_RECIPES } from "./catalog-books.ts";
import { CLASSIC_RECIPES } from "./catalog-classics.ts";
import { SWEET_ERA_RECIPES } from "./catalog-sweet.ts";
import { TABLE_RECIPES } from "./catalog-table.ts";
import { WARTIME_RECIPES } from "./catalog-wartime.ts";
import { VERIFIED_AGAINST_SOURCE } from "./source-verified.ts";

/**
 * A recipe on the verified list has been read line by line against the book it
 * credits. The promise that makes that worth doing is that the text survives
 * the trip to the cook unchanged.
 *
 * It did not, before this test existed. The polish layer turned "three minutes
 * in deep hot lard" into "in deep hot the 4 cups of lard", folded checked steps
 * into each other, appended a second cooking clause to a finished method, and
 * bought an egg off the back of "a piece of butter as big as an egg". Each of
 * those was caught by eye, which is not a mechanism.
 */
// Every catalog that carries a source credit, so a newly verified book does not
// silently fall out of the freeze check by living in a file this list forgot.
const RAW = new Map<string, (typeof SOUTHERN_RECIPES)[number]>();
for (const r of [
  ...SOUTHERN_RECIPES,
  ...HERITAGE_RECIPES,
  ...BOOK_RECIPES,
  ...CLASSIC_RECIPES,
  ...SWEET_ERA_RECIPES,
  ...TABLE_RECIPES,
  ...WARTIME_RECIPES,
])
  RAW.set(r.id, r);

test("every verified recipe reaches the app exactly as the catalog stores it", () => {
  for (const id of VERIFIED_AGAINST_SOURCE) {
    const raw = RAW.get(id);
    const out = RECIPES.find((r) => r.id === id);
    assert.ok(raw, `${id}: on the verified list but not in any catalog`);
    assert.ok(out, `${id}: on the verified list but not in RECIPES`);
    assert.deepEqual(out.steps, raw.steps, `${id}: steps were rewritten between the catalog and the app`);
    assert.deepEqual(
      out.ingredients.map((i) => `${i.qty} ${i.unit} ${i.name}`),
      raw.ingredients.map((i) => `${i.qty} ${i.unit} ${i.name}`),
      `${id}: the ingredient list was altered between the catalog and the app`,
    );
  }
});

test("the verified list names real recipes and holds no duplicates", () => {
  const seen = new Set<string>();
  for (const id of VERIFIED_AGAINST_SOURCE) {
    assert.ok(!seen.has(id), `${id}: listed twice`);
    seen.add(id);
    const r = RECIPES.find((x) => x.id === id);
    assert.ok(r, `${id}: no such recipe`);
    assert.ok(r.source, `${id}: verified against a source but carries no source credit`);
    assert.ok(r.steps.length >= 3, `${id}: only ${r.steps.length} steps, which is too few to be a checked method`);
  }
});
