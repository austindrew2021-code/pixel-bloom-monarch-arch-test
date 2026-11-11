import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { NO_ORGANIC, NO_ORGANIC_TOGGLE, groceryProfile, noOrganicOn, toggleIn } from "./grocery-prefs.ts";
import { pickExact } from "./grocery-match.ts";
import { parsePackageSizing } from "./grocery-pick.ts";

const here = dirname(fileURLToPath(import.meta.url));
const read = (rel: string) => readFileSync(join(here, rel), "utf8");

function P(name: string, size: string, price: number) {
  const s = parsePackageSizing(size);
  return { brand: "superstore" as const, name, sizeLabel: s.sizeLabel, priceCad: price, grams: s.grams, ml: s.ml, each: s.each, productId: name };
}
const carrots = [P("PC Organics Organic Carrots", "1.36 kg", 2.29), P("Carrots", "1.36 kg", 2.49)];
const line = { name: "carrots", qty: 1, unit: "kg", aisle: "Produce" };

test("No organic is off by default: a new profile has no prefs and organic can win on total", () => {
  const store = read("spoonful-store.ts");
  assert.match(store, /\n\s+prefs: \[\],/, "the store's default prefs must be empty");
  assert.equal(noOrganicOn([]), false);
  assert.equal(noOrganicOn(undefined), false);
  const r = pickExact({ line, products: carrots, profile: groceryProfile([], []) });
  assert.equal(r.pick?.product.name, "PC Organics Organic Carrots");
});

test("toggling No organic on adds no-organic to the profile and the picker excludes organic; off again restores it", () => {
  const on = toggleIn<string>([], NO_ORGANIC);
  assert.deepEqual(on, ["no-organic"]);
  assert.equal(noOrganicOn(on), true);
  const picked = pickExact({ line, products: carrots, profile: groceryProfile(["nuts"], on as never) });
  assert.equal(picked.pick?.product.name, "Carrots");
  assert.ok(picked.ranked.every((r) => !/organic/i.test(r.product.name)));
  const off = toggleIn(on, NO_ORGANIC);
  assert.deepEqual(off, []);
  assert.equal(pickExact({ line, products: carrots, profile: groceryProfile([], off as never) }).pick?.product.name, "PC Organics Organic Carrots");
  // Other prefs are untouched by the toggle.
  assert.deepEqual(toggleIn<string>(["vegan"], NO_ORGANIC), ["vegan", "no-organic"]);
});

test("the settings screen has a No organic switch wired to the no-organic pref", () => {
  const ui = read("../components/store-view.tsx");
  const at = ui.indexOf('data-testid="no-organic-toggle"');
  assert.ok(at > 0, "toggle missing from the settings screen");
  const block = ui.slice(ui.lastIndexOf("<button", at), ui.indexOf("</button>", at));
  assert.match(block, /role="switch"/);
  assert.match(block, /aria-checked=\{noOrganic\}/);
  assert.match(block, /onClick=\{\(\) => togglePref\(NO_ORGANIC\)\}/);
  assert.match(ui, /const noOrganic = noOrganicOn\(prefs\);/);
  // It sits with the existing allergy settings.
  assert.ok(ui.indexOf("Allergies</h2>") < at);
  assert.equal(NO_ORGANIC_TOGGLE.label, "No organic");
});

test("the setting reaches the picker: shop screen profile and the search route both carry no-organic", () => {
  assert.match(read("../components/grocery-near.tsx"), /groceryProfile\(allergies, prefs\)/);
  assert.match(read("../routes/api/grocery-search.ts"), /"no-organic"/);
  assert.match(read("types.ts"), /\| "no-organic"/);
  // Recipes ignore it: the recipe filter never reads no-organic.
  const store = read("spoonful-store.ts");
  const fn = store.slice(store.indexOf("export function recipeMatchesPrefs"), store.indexOf("export function recipeAllowed"));
  assert.doesNotMatch(fn, /no-organic/);
});
