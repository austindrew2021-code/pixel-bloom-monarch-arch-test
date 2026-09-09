import assert from "node:assert/strict";
import test from "node:test";
import { startAheadHours, startAheadLabel } from "./ahead.ts";
import { RECIPES } from "./recipes.ts";
import type { Recipe } from "./types";

const fake = (steps: string[], minutes = 20, tags: string[] = []): Recipe => ({
  id: "t",
  name: "Test",
  description: "",
  minutes,
  servings: 2,
  protein: "veg",
  plate: "bowl",
  pack: "free",
  tags,
  ingredients: [],
  steps,
  nutrition: { cal: 100, protein: 5, carbs: 5, fat: 5 },
});

test("a wait longer than the stated time is surfaced", () => {
  assert.equal(startAheadHours(fake(["Soak the beans overnight.", "Simmer."], 120)), 8);
  assert.equal(startAheadLabel(fake(["Soak the beans overnight."], 120)), "Start the night before");
  assert.equal(startAheadLabel(fake(["Chill 4 hours before serving."], 35)), "Start 4h ahead");
  assert.equal(startAheadLabel(fake(["Cure for 2 days."], 30)), "Start 2 days ahead");
});

test("cooking time is not a wait", () => {
  // An hour of simmering is work the stated time already covers, so it is not
  // something to warn a cook about before they start.
  assert.equal(startAheadHours(fake(["Simmer 1 hour until tender."], 75)), 0);
  assert.equal(startAheadLabel(fake(["Bake 2 hours."], 140)), null);
});

test("a wait the stated time already covers says nothing", () => {
  assert.equal(startAheadLabel(fake(["Rest 1 hour."], 90)), null);
});

test("a rub is not a dish that needs starting the night before", () => {
  // The rub takes eight minutes. The overnight rest belongs to the meat it goes
  // on, and eleven spice mixes were being labelled as overnight projects.
  const rub = fake(["Mix the spices.", "Rub the meat and refrigerate overnight."], 8, ["dry-rub"]);
  assert.equal(startAheadLabel(rub), null);
  assert.equal(startAheadLabel(fake(["Chill overnight."], 8, ["sauce"])), null);
});

test("the catalog's long waits are all called out", () => {
  const flagged = RECIPES.filter((r) => startAheadLabel(r));
  assert.ok(flagged.length > 40, `only ${flagged.length} dishes flagged`);
  // Salt cod soaks twelve hours against a stated forty minutes; that is the
  // case this exists for.
  const cod = RECIPES.find((r) => r.id === "vh-og-creamed-cod");
  if (cod) assert.ok(startAheadLabel(cod), "creamed salt cod should warn");
});

test("nothing quick and unattended gets a needless warning", () => {
  const quick = RECIPES.filter(
    (r) =>
      r.minutes <= 15 &&
      !/overnight|soak|chill|refrigerate|marinate|cure|brine|freeze|ferment|rise|proof|prove|steep|set\b/i.test(
        r.steps.join(" "),
      ),
  );
  assert.ok(quick.length > 50, `only ${quick.length} quick dishes to check`);
  for (const recipe of quick) assert.equal(startAheadLabel(recipe), null, `${recipe.id} warned for nothing`);
});
