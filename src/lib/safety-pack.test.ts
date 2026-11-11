import assert from "node:assert/strict";
import test from "node:test";
import { passBadges } from "./badges.ts";
import { dropsPrintedNumbers, scaleMethodSteps } from "./cook-steps.ts";
import { scaleQty } from "./cuisine.ts";
import { isDairyFree, isVegan, isVegetarian } from "./diet.ts";
import { formatQty, formatQtyFor } from "./format.ts";
import { allowedPlateFoods, foodsInRole, GYM_FOODS } from "./gym-plate.ts";
import { ideasAllowed } from "./pantry-match.ts";
import { ingredientDisplay, scaleStickNote } from "./phrase-qty.ts";
import { RECIPES } from "./recipes.ts";
import { recipeAllergens } from "./shield.ts";

const EGG = /\b(eggs?|egg whites?|egg yolks?|mayonnaise)\b/i;

test("badges: no pass badge sits next to a contains entry", () => {
  const pair = { "Gluten-free": "gluten", "Dairy-free": "dairy", "Nut-free": "nuts", "Shellfish-free": "shellfish", Mild: "spicy" } as const;
  for (const r of RECIPES) {
    const has = new Set(recipeAllergens(r));
    for (const b of passBadges(r)) {
      const a = pair[b as keyof typeof pair];
      if (a) assert.ok(!has.has(a), `${r.id} shows ${b} but contains ${a}`);
    }
  }
});

test("badges: vegan implies vegetarian, dairy-free and egg-free", () => {
  for (const r of RECIPES) {
    if (!isVegan(r)) continue;
    assert.ok(isVegetarian(r) && isDairyFree(r), r.id);
    assert.ok(!r.ingredients.some((i) => EGG.test(i.name)), `${r.id} vegan with egg`);
    const b = passBadges(r);
    assert.ok(b.includes("Vegetarian") && b.includes("Dairy-free"), r.id);
  }
});

test("badges are spelled out, positive only", () => {
  const ok = new Set(["Vegetarian", "Vegan", "Gluten-free", "Dairy-free", "No added sugar", "Nut-free", "Shellfish-free", "Mild", "Egg-free", "Soy-free", "Sesame-free", "Fish-free"]);
  for (const r of RECIPES.slice(0, 400)) for (const b of passBadges(r)) assert.ok(ok.has(b), b);
});

test("item 3: gym plate foods obey allergies and diet prefs, failing in doubt", () => {
  const nutFree = foodsInRole("fat", { allergies: ["nuts"] }).map((f) => f.id);
  assert.ok(!nutFree.includes("almonds") && !nutFree.includes("peanut-butter"));
  const gf = foodsInRole("carb", { glutenFree: true }).map((f) => f.id);
  for (const id of ["oats", "pasta", "bagel", "tortilla"]) assert.ok(!gf.includes(id), id);
  const df = foodsInRole("protein", { allergies: ["dairy"] }).map((f) => f.id);
  for (const id of ["greek-yogurt", "cottage-cheese", "whey"]) assert.ok(!df.includes(id), id);
  const sh = foodsInRole("protein", { allergies: ["shellfish"] }).map((f) => f.id);
  assert.ok(!sh.includes("white-fish"));
  const pesc = foodsInRole("protein", { pescatarian: true }).map((f) => f.id);
  assert.ok(pesc.includes("salmon") && !pesc.includes("chicken-breast"));
  const sf = foodsInRole("fat", { sugarFree: true }).map((f) => f.id);
  assert.ok(!sf.includes("peanut-butter"));
  const saved = allowedPlateFoods({ protein: "whey", carb: "pasta", veg: "broccoli", fat: "almonds" }, { allergies: ["dairy", "nuts", "gluten"] });
  for (const id of Object.values(saved)) {
    const f = GYM_FOODS.find((x) => x.id === id)!;
    assert.ok(!(f.contains ?? []).some((a) => ["dairy", "nuts", "gluten"].includes(a)), id);
  }
});

test("item 3: Snap AI extras fail in doubt when a filter is on", () => {
  const ideas = [
    { title: "Catalog", why: "", have: [], need: [], minutes: 20, recipeId: "ok" },
    { title: "Catalog bad", why: "", have: [], need: [], minutes: 20, recipeId: "bad" },
    { title: "AI shrimp thing", why: "", have: [], need: [], minutes: 20 },
  ];
  const allow = (id: string) => id === "ok";
  assert.deepEqual(ideasAllowed(ideas, allow, true).map((i) => i.title), ["Catalog"]);
  assert.deepEqual(ideasAllowed(ideas, allow, false).map((i) => i.title), ["Catalog", "AI shrimp thing"]);
});

test("vessel sizes: '12 quart pot' keeps its number and singular word at 0.5x/2x/3x", () => {
  for (const k of [0.5, 2, 3]) {
    const out = scaleMethodSteps(["Bring water to a boil in a 12 quart pot. Add 2 cups rice."], [{ name: "rice", qty: 2, unit: "cups" }], 4 * k, 4, {});
    assert.match(out[0]!, /12 quart pot/, `${k}x`);
  }
  assert.equal(formatQtyFor(2, "gallon", "crocks of brine"), formatQty(2, "gallon").replace(/s$/, ""));
  assert.equal(formatQty(2, "quart"), "2 quarts");
});

test("stick note scales; native servings text is unchanged", () => {
  assert.equal(scaleStickNote("butter (1 stick)", 0.5, 1), "butter (2 sticks)");
  assert.equal(scaleStickNote("butter (1 stick)", 0.5, 0.5), "butter (1 stick)");
  const ing = { name: "butter (1 stick)", qty: 0.5, unit: "cup", aisle: "Dairy & Eggs" as const };
  assert.equal(ingredientDisplay(ing, 0.5, formatQty, true).name, "butter (1 stick)");
});

test("small amounts never scale to 0", () => {
  for (const q of [0.125, 0.25, 0.5, 1]) for (const k of [0.5, 2, 3]) assert.ok(scaleQty(q, 4 * k, 4) > 0);
});

test("hand review B: a rewrite that drops a printed temperature or time keeps the printed steps", () => {
  assert.ok(dropsPrintedNumbers(["Roast 250°F until 125°F inside, then 500°F 8 minutes."], ["Roast until done."]));
  assert.ok(!dropsPrintedNumbers(["Bake 20 minutes at 350°."], ["Heat the oven to 350°. Bake 20 minutes."]));
  const pr = RECIPES.find((r) => r.id === "hd-prime-rib")!;
  assert.match(pr.steps.join(" "), /500°F 8 minutes/);
});

test("peanut butter ¼ cup (4 servings) scales: ⅛ at 2, ¼ at 4, ⅜ at 5", () => {
  const pb = { qty: 0.25, unit: "cup" };
  assert.equal(formatQty(scaleQty(pb.qty, 2, 4), pb.unit), "⅛ cup");
  assert.equal(formatQty(scaleQty(pb.qty, 4, 4), pb.unit), "¼ cup");
  assert.equal(formatQty(scaleQty(pb.qty, 5, 4), pb.unit), "⅜ cup");
  for (const id of ["cn-sesame-noodles", "bcx-062"]) {
    const r = RECIPES.find((x) => x.id === id)!;
    const g = r.ingredients.find((i) => /peanut butter/i.test(i.name))!;
    const at = (n: number) => formatQty(scaleQty(g.qty, n, r.servings), g.unit);
    assert.deepEqual([at(2), at(4), at(5)].map((s) => s.split(" ")[0]), ["⅛", "¼", "⅜"], id);
  }
});
