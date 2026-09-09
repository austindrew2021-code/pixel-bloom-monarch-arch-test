import assert from "node:assert/strict";
import test from "node:test";
import { ADDONS } from "./recipes.ts";
import { freeSkins, packOf, skinsInPack, THEMES } from "./themes.ts";

test("the everyday kitchen looks are free, and there are seven of them", () => {
  const free = freeSkins().map((t) => t.id).sort();
  assert.deepEqual(free, ["aether", "brass", "midnight", "nebula", "neon", "paper", "terminal"].sort());
});

test("the packs hold the rest, and nothing is in both", () => {
  const world = skinsInPack("skins-world").map((t) => t.id);
  const season = skinsInPack("skins-season").map((t) => t.id);
  assert.deepEqual(world.sort(), ["anime", "athens", "pharaoh", "rome", "sparta", "west"].sort());
  assert.deepEqual(season.sort(), ["autumn", "spring", "summer", "winter"].sort());
  assert.equal(world.filter((id) => season.includes(id)).length, 0);
  assert.equal(freeSkins().length + world.length + season.length, THEMES.length);
});

test("Midnight is free — the store calls it included", () => {
  assert.equal(packOf("midnight"), undefined);
  const midnight = ADDONS.find((a) => a.id === "midnight");
  assert.equal(midnight?.price, 0);
});

test("both packs are one price, once, and cheaper than a month of anything", () => {
  const monthly = ADDONS.filter((a) => a.period === "month").map((a) => a.price);
  for (const id of ["skins-world", "skins-season"] as const) {
    const pack = ADDONS.find((a) => a.id === id);
    assert.ok(pack, id);
    assert.equal(pack.price, 3.99);
    assert.equal(pack.period, "once");
    assert.ok(
      monthly.every((m) => pack.price < m),
      "a cosmetic pack should never cost more than a month of the kitchen",
    );
  }
});

test("a pack skin names its pack, a free skin names none", () => {
  for (const theme of THEMES) {
    if (theme.pack) {
      assert.ok(skinsInPack(theme.pack).some((t) => t.id === theme.id), theme.id);
    } else {
      assert.equal(packOf(theme.id), undefined, theme.id);
    }
  }
});

test("every pack skin still has its art, so a locked one can be seen before it is bought", () => {
  for (const theme of [...skinsInPack("skins-world"), ...skinsInPack("skins-season")]) {
    assert.ok(theme.art, `${theme.id} has no art to preview`);
  }
});
