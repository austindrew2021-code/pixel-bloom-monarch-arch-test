import assert from "node:assert/strict";
import test from "node:test";
import { isAlwaysHave } from "./grocery-always.ts";
import { isOffFood, isRelevantProduct, overlaySearchQuery, pickForLine } from "./grocery-pick.ts";
import { pickCheapestLiteral } from "./store-page-pick.ts";

const store = { brand: "superstore" as const, name: "Atlantic Superstore" };

/** A different week: pie, carbonara, meatballs — not last week's chicken cutlets. */
const WEEK_INGS = [
  "ground beef",
  "potato",
  "butter",
  "salt",
  "black pepper",
  "onion",
  "spaghetti",
  "eggs",
  "parmesan",
  "pancetta",
  "garlic",
  "olive oil",
];

test("a different week still shops salt until they check the cupboard", () => {
  assert.equal(isAlwaysHave("salt", []), false);
  assert.equal(isAlwaysHave("black pepper", []), false);
  assert.equal(isAlwaysHave("olive oil", []), false);
  assert.equal(isAlwaysHave("salt", ["salt"]), true);
  assert.ok(WEEK_INGS.includes("salt"));
});

test("that week's butter is dairy butter, pepper is spice, not a bell pepper", () => {
  const butter = pickForLine(store, { name: "butter", qty: 2, unit: "tbsp", aisle: "Dairy & Eggs" });
  assert.equal(overlaySearchQuery("butter"), "butter");
  assert.doesNotMatch(butter.pickName, /plant|becel|violife|margarine/i);

  const shelf = pickCheapestLiteral(
    [
      { name: "Club House Black Pepper 150 g", priceCad: 6.49 },
      { name: "No Name Organic Black Pepper 90 g", priceCad: 3.79 },
      { name: "Green Bell Pepper", priceCad: 1.49 },
      { name: "Earth Balance Plant Based Unsalted Butter", priceCad: 4.49 },
    ],
    "black pepper",
  );
  assert.match(shelf?.name ?? "", /Black Pepper/);
});

test("shelf playthrough: chicken, pasta, and butter stay the real foods", () => {
  const chicken = pickCheapestLiteral(
    [
      { name: "No Name Chicken Broth 900 ml", priceCad: 1.79 },
      { name: "Zabiha Halal Chicken Breast Nuggets", priceCad: 9.99 },
      { name: "No Name Boneless Skinless Chicken Breasts", priceCad: 12.5 },
      { name: "PC Extra Lean Chicken Breasts", priceCad: 14.0 },
    ],
    "chicken breasts",
  );
  assert.match(chicken?.name ?? "", /Boneless Skinless Chicken Breasts/);

  const butter = pickCheapestLiteral(
    [
      { name: "Earth Balance Plant Based Unsalted Butter 427 g", priceCad: 4.49 },
      { name: "Becel Plant Butter Salted", priceCad: 4.99 },
      { name: "No Name Salted Butter 454 g", priceCad: 5.47 },
      { name: "Lactantia Unsalted Butter 454 g", priceCad: 6.49 },
    ],
    "butter",
  );
  assert.equal(butter?.name, "No Name Salted Butter 454 g");

  assert.equal(isRelevantProduct("Becel Plant Butter Salted", "butter"), false);
  assert.equal(isOffFood("PC Plant Based Unsalted Buttery Spread", "butter"), true);
  assert.equal(isRelevantProduct("No Name Organic Black Pepper", "black pepper"), true);
});

test("spaghetti week search queries are the ingredient, not a SKU", () => {
  for (const name of WEEK_INGS) {
    const q = overlaySearchQuery(name);
    assert.ok(q.length > 0, name);
    assert.doesNotMatch(q, /no name|president/i);
  }
  const line = pickForLine(store, { name: "spaghetti", qty: 12, unit: "oz", aisle: "Pantry" });
  assert.equal(line.matched, true);
  assert.match(line.pickName, /spaghetti|pasta/i);
});
