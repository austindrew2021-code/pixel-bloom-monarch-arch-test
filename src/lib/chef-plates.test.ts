import assert from "node:assert/strict";
import test from "node:test";
import { isUnlocked } from "./access.ts";
import { CHEF_FREE_WEEK, CHEF_PACK_15, CHEF_PACK_40 } from "./ranks.ts";
import { ADDONS, RECIPES } from "./recipes.ts";

const addon = (id: string) => ADDONS.find((a) => a.id === id);

test("the free week is three Chef plates", () => {
  assert.equal(CHEF_FREE_WEEK, 3);
});

test("more plates are sold at the two prices that already exist", () => {
  const fifteen = addon("plates-15");
  const forty = addon("plates-40");
  assert.ok(fifteen, "+15 Chef plates is missing");
  assert.ok(forty, "+40 Chef plates is missing");
  assert.equal(fifteen.price, 2.99);
  assert.equal(forty.price, 5.99);
  assert.equal(CHEF_PACK_15, 15);
  assert.equal(CHEF_PACK_40, 40);
});

test("no new price sneaks into the plate packs", () => {
  const platePrices = ADDONS.filter((a) => /chef plates/i.test(a.name)).map((a) => a.price).sort((x, y) => x - y);
  assert.deepEqual(platePrices, [2.99, 5.99]);
});

test("Family stays $4.99 a month", () => {
  const family = addon("family");
  assert.ok(family);
  assert.equal(family.price, 4.99);
  assert.equal(family.period, "month");
});

test("the free core is never behind a purchase", () => {
  // AI Chef, Body Sync and the nutrition read are free to every kitchen; the
  // only paid thing in this lane is more Chef plates.
  for (const id of ["ai-chef", "body-sync", "nutrition", "weeknight", "protein", "batch", "bundle"] as const) {
    assert.equal(isUnlocked([], id), true, `${id} should be free`);
  }
});

test("a guest with nothing bought still has a library to search", () => {
  const free = RECIPES.filter((r) => r.pack === "free");
  assert.ok(free.length > 100, `only ${free.length} free titles`);
});
