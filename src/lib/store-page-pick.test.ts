import assert from "node:assert/strict";
import test from "node:test";
import { looksLikeBotWall, parseCardPrice, pickCheapestLiteral } from "./store-page-pick.ts";

test("butter picks the cheap salted brick, not peanut butter", () => {
  const pick = pickCheapestLiteral(
    [
      { name: "Kraft Smooth Peanut Butter 2 kg", priceCad: 7.98 },
      { name: "Compliments Salted Butter 454 g", priceCad: 5.99 },
      { name: "Lactantia Salted Butter 454 g", priceCad: 6.49 },
      { name: "Becel Margarine", priceCad: 4.99 },
    ],
    "salted butter",
  );
  assert.equal(pick?.name, "Compliments Salted Butter 454 g");
  assert.equal(pick?.priceCad, 5.99);
});

test("chicken breasts skip broth, nuggets, and deli", () => {
  const pick = pickCheapestLiteral(
    [
      { name: "No Name Chicken Broth 900 ml", priceCad: 1.79 },
      { name: "Zabiha Halal Chicken Breast Nuggets", priceCad: 9.99 },
      { name: "No Name Boneless Skinless Chicken Breasts", priceCad: 12.5 },
      { name: "PC Extra Lean Chicken Breasts", priceCad: 14.0 },
    ],
    "chicken breasts",
  );
  assert.match(pick?.name ?? "", /Boneless Skinless Chicken Breasts/);
});

test("when two literal packs match, the cheaper one wins", () => {
  const pick = pickCheapestLiteral(
    [
      { name: "No Name 2% Milk 2 L", priceCad: 4.79 },
      { name: "Neilson 2% Milk 2 L", priceCad: 5.49 },
    ],
    "2% milk",
  );
  assert.match(pick?.name ?? "", /No Name/);
});

test("no literal match does not fall back to a neighbour food", () => {
  const pick = pickCheapestLiteral(
    [
      { name: "Kraft Smooth Peanut Butter", priceCad: 5.0 },
      { name: "Chocolate Chip Cookies", priceCad: 3.0 },
    ],
    "salted butter",
  );
  assert.equal(pick, null);
});

test("plant-based butter is not dairy butter, even if cheaper", () => {
  const pick = pickCheapestLiteral(
    [
      { name: "Earth Balance Plant Based Unsalted Butter 427 g", priceCad: 4.49 },
      { name: "Becel Plant Butter Salted 454 g", priceCad: 4.99 },
      { name: "PC Plant Based Unsalted Buttery Spread", priceCad: 3.99 },
      { name: "Becel Margarine 907 g", priceCad: 3.99 },
      { name: "Compliments Salted Butter 454 g", priceCad: 5.99 },
      { name: "Lactantia Unsalted Butter 454 g", priceCad: 6.49 },
      { name: "No Name Salted Butter 454 g", priceCad: 5.47 },
    ],
    "butter",
  );
  assert.equal(pick?.name, "No Name Salted Butter 454 g");
});

test("organic black pepper still counts as black pepper and can win on price", () => {
  const pick = pickCheapestLiteral(
    [
      { name: "Club House Black Pepper 150 g", priceCad: 6.49 },
      { name: "No Name Organic Black Pepper 90 g", priceCad: 3.79 },
      { name: "Green Bell Pepper", priceCad: 1.49 },
    ],
    "black pepper",
  );
  assert.match(pick?.name ?? "", /Organic Black Pepper/);
});

test("bot-wall copy is caught so fill can pause", () => {
  assert.equal(looksLikeBotWall("We do not like robots we like real shoppers"), true);
  assert.equal(looksLikeBotWall("Max challenge attempts exceeded. Please refresh the page to try again!"), true);
  assert.equal(looksLikeBotWall("Compliments Salted Butter 454 g"), false);
  assert.equal(parseCardPrice("Add  $5.99  Save"), 5.99);
});

test("unit price /100g is not treated as the pack price", () => {
  assert.equal(parseCardPrice("$1.32/100g  $5.99"), 5.99);
  assert.equal(parseCardPrice("$6.49 $1.43 / 100 g"), 6.49);
});

test("Voila butter search skips plant Becel and prefers Compliments when prices are hidden", () => {
  const pick = pickCheapestLiteral(
    [
      { name: "Becel Plant Based Butter Unsalted 454 g", priceCad: null },
      { name: "Becel Plant Based Butter Salted 454 g", priceCad: null },
      { name: "Becel Lactose-Free Plant Butter Sticks Salted 454 g", priceCad: null },
      { name: "Becel Chef's Signature Butter Salted 454 g", priceCad: null },
      { name: "President Butter Sticks Unsalted 454 g", priceCad: null },
      { name: "Compliments Salted Butter 454 g", priceCad: null },
      { name: "Gay Lea Butter Stick Salted 454 g", priceCad: null },
      { name: "Gay Lea Grass Fed Butter Salted 250 g", priceCad: null },
    ],
    "salted butter",
  );
  assert.equal(pick?.name, "Compliments Salted Butter 454 g");
});
