import assert from "node:assert/strict";
import test from "node:test";
import {
  ACTIVITY,
  GOAL_KINDS,
  bmrKcal,
  bmrMethod,
  clampAge,
  floorKcal,
  MAX_DEFICIT_PCT,
  goalDelta,
  goalLabel,
  goalPlan,
  goalSpec,
  leanMassKg,
  macrosFromBody,
  normalizeBody,
  normalizeGoalKind,
  tdeeKcal,
  type BodyProfile,
  type GoalKind,
} from "./body.ts";

const base: BodyProfile = {
  sex: "male",
  age: 30,
  heightCm: 180,
  weightKg: 90,
  activity: "moderate",
  goalKind: "lose",
  units: "metric",
};

const ALL: GoalKind[] = ["lose", "recomp", "maintain", "lean", "performance"];

test("maps old Build goal to Lean bulk", () => {
  assert.equal(normalizeGoalKind("gain"), "lean");
  assert.equal(normalizeGoalKind("lose"), "lose");
});

test("Mifflin when fat % is missing; Katch when it is set", () => {
  assert.equal(bmrMethod(base), "Mifflin–St Jeor");
  const withFat = { ...base, bodyFatPct: 20 };
  assert.equal(bmrMethod(withFat), "Katch–McArdle");
  assert.equal(leanMassKg(withFat), 72);
  assert.equal(bmrKcal(withFat), Math.round(370 + 21.6 * 72));
  assert.ok(Math.abs(bmrKcal(withFat) - bmrKcal(base)) > 20);
});

// ---------------------------------------------------------------- activity --

test("the activity ladder describes life, not training", () => {
  // The old ladder ran to 1.9 ("two-a-days"), which counted exercise that
  // dayFuel then added again. Nothing here may reach that far.
  for (const level of ACTIVITY) {
    assert.ok(level.factor >= 1.2 && level.factor <= 1.75, `${level.id} is ${level.factor}`);
    assert.doesNotMatch(
      `${level.label} ${level.hint}`,
      /\bgym\b|\btrain(?!ing counts)\w*\b|\bworkout\b/i,
      `${level.id} still describes training`,
    );
  }
  // And every level says what it assumes you already walk.
  for (const level of ACTIVITY) {
    assert.ok(level.impliedSteps > 0, level.id);
  }
  const steps = ACTIVITY.map((a) => a.impliedSteps);
  assert.deepEqual([...steps].sort((x, y) => x - y), steps, "implied steps must rise with the level");
});

// ------------------------------------------------------------------- phases --

test("every phase is genuinely a different prescription", () => {
  const plans = ALL.map((goalKind) => ({ goalKind, plan: goalPlan({ ...base, goalKind }) }));
  const cals = plans.map((p) => p.plan.cal);
  assert.equal(new Set(cals).size, ALL.length, `calories collide: ${JSON.stringify(cals)}`);

  const byId = Object.fromEntries(plans.map((p) => [p.goalKind, p.plan]));
  // A cut eats least, a bodybuilder most, and they run in order.
  assert.ok(byId.lose!.cal < byId.recomp!.cal);
  assert.ok(byId.recomp!.cal < byId.maintain!.cal);
  assert.ok(byId.maintain!.cal < byId.lean!.cal);
  assert.ok(byId.lean!.cal < byId.performance!.cal);
});

test("a deficit scales with the body it is for", () => {
  // A flat -500 was a 17% cut for a big man and a 28% cut for a small woman.
  const big = goalPlan({ ...base, weightKg: 110, goalKind: "lose" });
  const small = goalPlan({ ...base, sex: "female", heightCm: 160, weightKg: 55, goalKind: "lose" });
  const pct = (p: { cal: number; maintenanceKcal: number }) =>
    (p.maintenanceKcal - p.cal) / p.maintenanceKcal;
  // Same phase, same proportion — within a point of each other.
  assert.ok(Math.abs(pct(big) - pct(small)) < 0.02, `${pct(big)} vs ${pct(small)}`);
  assert.ok(goalDelta("lose", base) < goalDelta("lose", { ...base, weightKg: 55 }));
});

test("the cut sits in the 15-25% band the literature uses", () => {
  const plan = goalPlan({ ...base, goalKind: "lose" });
  const cut = (plan.maintenanceKcal - plan.targetKcal) / plan.maintenanceKcal;
  assert.ok(cut >= 0.15 && cut <= 0.25, `cut is ${Math.round(cut * 100)}%`);
});

test("the bulks stay modest — a faster gain is mostly fat", () => {
  const lean = goalSpec("lean");
  const bb = goalSpec("performance");
  // Helms et al.: roughly 0.25-0.5%/week lean, up to ~1% pushing it.
  assert.ok(lean.weeklyPct > 0 && lean.weeklyPct <= 0.005, String(lean.weeklyPct));
  assert.ok(bb.weeklyPct > lean.weeklyPct && bb.weeklyPct <= 0.01, String(bb.weeklyPct));
  assert.ok(bb.energyPct > lean.energyPct);
});

// ------------------------------------------------------------------ protein --

test("protein lands in the ISSN band on bodyweight", () => {
  for (const goalKind of ALL) {
    const plan = goalPlan({ ...base, goalKind });
    const perKg = plan.protein / base.weightKg;
    assert.ok(perKg >= 1.4 && perKg <= 2.4, `${goalKind}: ${perKg.toFixed(2)} g/kg`);
  }
});

test("with body fat known, a cut uses the Helms lean-mass range", () => {
  const plan = goalPlan({ ...base, bodyFatPct: 15, goalKind: "lose" });
  const ffm = 90 * 0.85;
  const perKgFfm = plan.protein / ffm;
  // Helms et al. 2014: 2.3-3.1 g/kg fat-free mass in a deficit.
  assert.ok(perKgFfm >= 2.3 && perKgFfm <= 3.1, `${perKgFfm.toFixed(2)} g/kg FFM`);
});

test("a cut asks for more protein than a maintain", () => {
  const cut = goalPlan({ ...base, goalKind: "lose" });
  const hold = goalPlan({ ...base, goalKind: "maintain" });
  assert.ok(cut.protein > hold.protein, `${cut.protein} vs ${hold.protein}`);
  // Even though it eats less.
  assert.ok(cut.cal < hold.cal);
});

test("the bodybuilder gets the carbs, not the fat", () => {
  const bb = goalPlan({ ...base, goalKind: "performance" });
  const hold = goalPlan({ ...base, goalKind: "maintain" });
  assert.ok(bb.carbs > hold.carbs, `${bb.carbs} vs ${hold.carbs}`);
  assert.ok(bb.protein >= hold.protein);
  // Fat share is the lowest of any phase, so the surplus fuels training.
  assert.equal(Math.min(...GOAL_KINDS.map((g) => g.fatPct)), goalSpec("performance").fatPct);
});

// ------------------------------------------------------------------- floors --

test("macros always add up to the calories they claim", () => {
  for (const goalKind of ALL) {
    for (const body of [base, { ...base, sex: "female" as const, weightKg: 58, heightCm: 163 }]) {
      const plan = goalPlan({ ...body, goalKind });
      const fromMacros = plan.protein * 4 + plan.carbs * 4 + plan.fat * 9;
      // Floors can push the parts above the total; they may never fall short.
      assert.ok(
        fromMacros >= plan.cal - 60,
        `${goalKind} ${body.sex}: macros ${fromMacros} vs ${plan.cal}`,
      );
    }
  }
});

test("fat never drops below 0.8 g/kg", () => {
  for (const goalKind of ALL) {
    const plan = goalPlan({ ...base, goalKind });
    assert.ok(plan.fat >= 0.8 * base.weightKg - 1, `${goalKind}: ${plan.fat} g`);
  }
});

test("nobody is ever prescribed below resting metabolism or the clinical floor", () => {
  const tiny: BodyProfile = {
    sex: "female",
    age: 62,
    heightCm: 150,
    weightKg: 47,
    activity: "sedentary",
    goalKind: "lose",
    units: "metric",
  };
  const plan = goalPlan(tiny);
  assert.ok(plan.cal >= 1200, `${plan.cal} is under the 1200 kcal floor`);
  assert.equal(floorKcal(tiny), 1200);
  assert.equal(floorKcal({ ...tiny, sex: "male" }), 1500);
  // Whatever a phase asks for, the cut never exceeds a quarter of maintenance.
  for (const goalKind of ALL) {
    const p = goalPlan({ ...tiny, goalKind });
    const cut = (p.maintenanceKcal - p.cal) / p.maintenanceKcal;
    assert.ok(cut <= MAX_DEFICIT_PCT + 0.001, `${goalKind} cuts ${Math.round(cut * 100)}%`);
  }
});

test("a lean lifter's cut is not cancelled by a BMR floor", () => {
  // Katch on 14% body fat gives a high resting number; a desk job gives a
  // maintenance barely above it. A "never below BMR" rule would have quietly
  // handed this lifter maintenance calories and called it a cut.
  const lifter: BodyProfile = {
    sex: "male", age: 28, heightCm: 180, weightKg: 88, bodyFatPct: 14,
    activity: "sedentary", goalKind: "lose", units: "metric",
  };
  const plan = goalPlan(lifter);
  assert.equal(plan.floored, false, "the clinical floor should not bite here");
  const cut = (plan.maintenanceKcal - plan.cal) / plan.maintenanceKcal;
  assert.ok(cut > 0.18, `only cutting ${Math.round(cut * 100)}%`);
  assert.ok(plan.weeklyKg < -0.4, `predicts only ${plan.weeklyKg} kg/wk`);
});

test("a floored plan reports the slower rate it will really give", () => {
  const tiny: BodyProfile = {
    sex: "female", age: 62, heightCm: 150, weightKg: 47,
    activity: "sedentary", goalKind: "lose", units: "metric",
  };
  const plan = goalPlan(tiny);
  if (plan.floored) {
    const implied = ((plan.cal - plan.maintenanceKcal) * 7) / 7700;
    assert.ok(Math.abs(plan.weeklyKg - Math.round(implied * 100) / 100) < 0.02);
  }
});

test("a child is planned to maintain, and told why", () => {
  const kid: BodyProfile = { ...base, age: 13, weightKg: 45, heightCm: 155, goalKind: "lose" };
  const plan = goalPlan(kid);
  assert.equal(plan.cal, Math.max(floorKcal(kid), plan.maintenanceKcal));
  assert.equal(plan.weeklyKg, 0);
  assert.ok(plan.note, "a softened plan must say so");
  assert.match(plan.note!, /maintain/i);
  // The age itself is never rewritten.
  assert.equal(clampAge(13), 13);
  assert.equal(normalizeBody(kid).age, 13);
});

test("an adult on the same goal still gets the deficit", () => {
  const adult = goalPlan({ ...base, age: 16, goalKind: "lose" });
  assert.ok(adult.cal < adult.maintenanceKcal);
  assert.equal(adult.note, undefined);
});

// -------------------------------------------------------------- explainable --

test("the plan shows its work", () => {
  const plan = goalPlan({ ...base, bodyFatPct: 18 });
  assert.equal(plan.maintenanceKcal, tdeeKcal(normalizeBody({ ...base, bodyFatPct: 18 })));
  assert.equal(plan.method, "Katch–McArdle");
  assert.ok(plan.weeklyKg < 0, "a cut should predict losing weight");
  assert.ok(Math.abs(plan.weeklyKg) < 1.5, "and not an unsafe amount of it");
  assert.deepEqual(macrosFromBody({ ...base, bodyFatPct: 18 }), {
    cal: plan.cal, protein: plan.protein, carbs: plan.carbs, fat: plan.fat,
  });
});

test("the weekly rate matches the calories on the plate", () => {
  for (const goalKind of ALL) {
    const plan = goalPlan({ ...base, goalKind });
    if (plan.floored) continue;
    const implied = ((plan.cal - plan.maintenanceKcal) * 7) / 7700;
    assert.ok(
      Math.abs(implied - plan.weeklyKg) < 0.25,
      `${goalKind}: says ${plan.weeklyKg} kg/wk, calories imply ${implied.toFixed(2)}`,
    );
  }
});

test("every phase keeps its label and hint", () => {
  for (const goalKind of ALL) {
    assert.ok(goalLabel(goalKind).length > 2, goalKind);
    assert.ok(goalSpec(goalKind).hint.length > 10, goalKind);
  }
  assert.equal(goalLabel("maintain"), "Keep weight");
});
