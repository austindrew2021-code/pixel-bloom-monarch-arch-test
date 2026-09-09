import assert from "node:assert/strict";
import test from "node:test";
import { goalPlan, type BodyProfile, type GoalKind } from "./body.ts";
import { dayFuel, goalBurnShare } from "./fuel.ts";
import type { Workout } from "./types.ts";
import { chefGoalRules, fitsGoal, goalRankBoost, isCutOffGoal, strictestGoal } from "./goal-fit.ts";
import { RECIPES } from "./recipes.ts";

const ALL: GoalKind[] = ["lose", "recomp", "maintain", "lean", "performance"];

const body: BodyProfile = {
  sex: "male",
  age: 30,
  heightCm: 180,
  weightKg: 90,
  activity: "sedentary",
  goalKind: "maintain",
  units: "metric",
};

/** Dinners this goal will eat, best first — what a fill actually reaches for. */
function topFor(goal: GoalKind, n = 40) {
  return RECIPES.filter((r) => fitsGoal(r, goal, "dinner"))
    .map((r) => ({ r, score: goalRankBoost(r, goal) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((x) => x.r);
}

const avg = (rows: typeof RECIPES, key: "cal" | "protein" | "carbs") =>
  rows.reduce((s, r) => s + r.nutrition[key], 0) / rows.length;

test("swapping the goal moves every number that depends on it", () => {
  const plans = ALL.map((goalKind) => goalPlan({ ...body, goalKind }));
  assert.equal(new Set(plans.map((p) => p.cal)).size, ALL.length, "calories must differ");
  assert.equal(new Set(plans.map((p) => p.protein)).size >= 4, true, "protein must differ");
  assert.equal(new Set(plans.map((p) => p.carbs)).size, ALL.length, "carbs must differ");
  assert.equal(new Set(ALL.map((g) => chefGoalRules(g))).size, ALL.length, "chef rules must differ");
});

test("no goal is left without enough dinners to eat", () => {
  for (const goal of ALL) {
    const pool = RECIPES.filter((r) => fitsGoal(r, goal, "dinner"));
    assert.ok(pool.length >= 300, `${goal} only has ${pool.length} dinners`);
  }
});

test("the dinners a cut reaches for are leaner than a bulk's", () => {
  const cut = topFor("lose");
  const bulk = topFor("performance");
  assert.ok(avg(cut, "protein") >= 30, `cut picks average ${avg(cut, "protein").toFixed(0)}g protein`);
  assert.ok(avg(bulk, "carbs") > avg(cut, "carbs"), "a bulk should reach for more carbohydrate");
  assert.ok(avg(cut, "cal") < avg(bulk, "cal"), "a cut should reach for lighter plates");
});

test("a cut never gets handed fried batter or a dessert as dinner", () => {
  for (const recipe of RECIPES) {
    if (!isCutOffGoal(recipe)) continue;
    assert.equal(fitsGoal(recipe, "lose", "dinner"), false, `${recipe.name} passed a cut`);
  }
  // And something obviously off-goal is really caught.
  const fritters = RECIPES.filter((r) => /fritter|funnel cake|mac(aroni)? and cheese/i.test(r.name));
  assert.ok(fritters.length > 0, "the catalog should still contain the food a cut avoids");
  for (const dish of fritters) assert.equal(fitsGoal(dish, "lose", "dinner"), false, dish.name);
});

test("the same dish can suit one goal and not another", () => {
  const split = RECIPES.filter(
    (r) => fitsGoal(r, "maintain", "dinner") && !fitsGoal(r, "lose", "dinner"),
  );
  assert.ok(split.length > 50, `only ${split.length} dishes separate maintain from a cut`);
  const leanOnly = RECIPES.filter(
    (r) => fitsGoal(r, "lean", "dinner") && !fitsGoal(r, "performance", "dinner"),
  );
  assert.ok(leanOnly.length > 0, "lean and bodybuilder should not be the same filter");
});

test("a family table follows its strictest seat", () => {
  assert.equal(strictestGoal(["performance", "lose", "maintain"]), "lose");
  assert.equal(strictestGoal(["lean", "maintain"]), "maintain", "maintain is stricter than a bulk");
  assert.equal(strictestGoal(["maintain", "recomp"]), "recomp");
  assert.equal(strictestGoal([]), "maintain");
  assert.equal(strictestGoal([undefined, "lose"]), "lose");
});

test("the chef is told which phase it is cooking for", () => {
  assert.match(chefGoalRules("lose"), /cut/i);
  assert.match(chefGoalRules("recomp"), /recomp/i);
  assert.match(chefGoalRules("lean"), /lean/i);
  assert.match(chefGoalRules("performance"), /performance|carb/i);
  for (const goal of ALL) assert.ok(chefGoalRules(goal).length > 40, goal);
});

test("swapping back and forth returns exactly where it started", () => {
  // A goal is a pure function of the body, so a round trip must be lossless —
  // otherwise a cook who changed their mind twice ends up on different numbers.
  const start = goalPlan({ ...body, goalKind: "lose" });
  const wandered = ["performance", "maintain", "lean", "recomp", "lose"] as const;
  let last = start;
  for (const goalKind of wandered) last = goalPlan({ ...body, goalKind });
  assert.deepEqual(last, start);
});

test("every goal keeps the day's macros self-consistent", () => {
  for (const goalKind of ALL) {
    const plan = goalPlan({ ...body, goalKind });
    assert.ok(plan.protein > 0 && plan.carbs > 0 && plan.fat > 0, goalKind);
    assert.ok(plan.cal >= 1200, `${goalKind}: ${plan.cal}`);
    assert.ok(plan.maintenanceKcal > 0);
  }
});

test("the day's target reconciles: base plus the burn this goal earns back", () => {
  // What the Fuel screen shows at the top is the base target plus the burn
  // already logged today, scaled by the goal. If these two numbers do not close
  // exactly, the explainer under them is telling the cook something the
  // headline contradicts.
  const nothingEaten = { cal: 0, protein: 0, carbs: 0, fat: 0 };
  const workouts: Workout[] = [{ id: "w1", date: "2026-01-05", kind: "lift", minutes: 60 }];
  for (const goalKind of ALL) {
    const profile = { ...body, goalKind };
    const plan = goalPlan(profile);
    const day = dayFuel({ goal: plan, eaten: nothingEaten, workouts, steps: 12000, body: profile });
    assert.ok(day.burn > 0, `${goalKind} logged no burn to reconcile`);
    assert.equal(
      day.target.cal,
      plan.cal + Math.round(day.burn * goalBurnShare(goalKind)),
      goalKind,
    );
  }
  // And a cut earns back less of it than a bulk, or the deficit leaks away on
  // exactly the days a lifter trains hardest.
  assert.ok(goalBurnShare("lose") < 1, "a cut must not be paid in full for its burn");
  assert.ok(goalBurnShare("performance") > 1, "a bulk should eat over its burn");
  assert.equal(goalBurnShare("maintain"), 1);
});
