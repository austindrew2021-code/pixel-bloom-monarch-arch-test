import assert from "node:assert/strict";
import test from "node:test";
import {
  bmrKcal,
  bmrMethod,
  goalDelta,
  leanMassKg,
  macrosFromBody,
  normalizeGoalKind,
  type BodyProfile,
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

test("maps old Build goal to Lean gain", () => {
  assert.equal(normalizeGoalKind("gain"), "lean");
  assert.equal(normalizeGoalKind("lose"), "lose");
});

test("Mifflin when fat % is missing; Katch when it is set", () => {
  assert.equal(bmrMethod(base), "Mifflin–St Jeor");
  const withFat = { ...base, bodyFatPct: 20 };
  assert.equal(bmrMethod(withFat), "Katch–McArdle");
  assert.equal(leanMassKg(withFat), 72);
  const katch = bmrKcal(withFat);
  const mifflin = bmrKcal(base);
  assert.equal(katch, Math.round(370 + 21.6 * 72));
  assert.ok(Math.abs(katch - mifflin) > 20);
});

test("Cut target is below TDEE and protein stays high", () => {
  assert.equal(goalDelta("lose"), -500);
  const macros = macrosFromBody(base);
  assert.ok(macros.protein >= 180, String(macros.protein));
  assert.ok(macros.cal < 2800);
});

test("body fat raises protein per lean kilo on a cut", () => {
  const noFat = macrosFromBody(base);
  const withFat = macrosFromBody({ ...base, bodyFatPct: 25 });
  assert.ok(withFat.protein !== noFat.protein);
  assert.ok(withFat.protein >= 160);
});
