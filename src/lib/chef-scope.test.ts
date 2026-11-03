import assert from "node:assert/strict";
import test from "node:test";
import { chefJoke, classifyChefAsk, localAppAnswer } from "./chef-scope.ts";

test("a dinner request stays a recipe", () => {
  assert.equal(classifyChefAsk("Georgian khachapuri, vegetarian, under 40 minutes."), "recipe");
  assert.equal(classifyChefAsk("I'm exhausted. One pan, 20 minutes."), "recipe");
});

test("app questions stay on the app", () => {
  assert.equal(classifyChefAsk("How do I scan a barcode at Superstore?"), "app");
  assert.equal(classifyChefAsk("Where are the privacy terms?"), "app");
  assert.equal(classifyChefAsk("How does the pantry check work?"), "app");
});

test("trivia is not a plate", () => {
  assert.equal(classifyChefAsk("What is the capital of France?"), "other");
  assert.equal(classifyChefAsk("Write me a python script"), "other");
  assert.match(chefJoke("What is bitcoin?"), /chef|dinner|plate|stove/i);
});

test("local app answers name the real control", () => {
  assert.match(localAppAnswer("How do I scan a barcode?"), /Snap/i);
  assert.match(localAppAnswer("What does Kitchen Table cost?"), /7\.99/);
});
