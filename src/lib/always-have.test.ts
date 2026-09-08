import assert from "node:assert/strict";
import test from "node:test";
import { BASIC_STAPLES, isAlwaysHave } from "./grocery-always.ts";

test("salt on the list is a staple, salted butter is not", () => {
  assert.equal(isAlwaysHave("salt", BASIC_STAPLES), true);
  assert.equal(isAlwaysHave("kosher salt", BASIC_STAPLES), true);
  assert.equal(isAlwaysHave("salted butter", BASIC_STAPLES), false);
  assert.equal(isAlwaysHave("unsalted butter", BASIC_STAPLES), false);
});

test("black pepper is a staple, bell pepper is a vegetable", () => {
  assert.equal(isAlwaysHave("black pepper", BASIC_STAPLES), true);
  assert.equal(isAlwaysHave("pepper", BASIC_STAPLES), true);
  assert.equal(isAlwaysHave("bell pepper", BASIC_STAPLES), false);
  assert.equal(isAlwaysHave("green pepper", BASIC_STAPLES), false);
  assert.equal(isAlwaysHave("chili pepper", BASIC_STAPLES), false);
});

test("olive oil is a staple, peanut oil still counts as oil", () => {
  assert.equal(isAlwaysHave("olive oil", BASIC_STAPLES), true);
  assert.equal(isAlwaysHave("oil", BASIC_STAPLES), true);
});

test("nothing is skipped until they check it off", () => {
  assert.equal(isAlwaysHave("salt", []), false);
  assert.equal(isAlwaysHave("black pepper", []), false);
  assert.equal(isAlwaysHave("flour", []), false);
});
