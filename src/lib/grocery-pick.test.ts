import assert from "node:assert/strict";
import test from "node:test";
import {
  catalogOptions,
  coverWith,
  isRelevantProduct,
  matchCart,
  matchStaple,
  parsePackageSizing,
  overlaySearchQuery,
  pickCheapestEnough,
  pickForLine,
  searchTermFor,
} from "./grocery-pick.ts";
import { STAPLES } from "./grocery-staples.ts";

const store = { brand: "superstore" as const, name: "Atlantic Superstore" };

test("panko for one cup picks the cheap 227 g box, not the fancy bag", () => {
  const staple = matchStaple("panko breadcrumbs");
  assert.ok(staple);
  const products = staple!.products.filter((p) => p.brand === "superstore");
  const pick = pickCheapestEnough({ name: "panko", qty: 1, unit: "cup", aisle: "Pantry" }, products, staple!.gramsPerCup);
  assert.ok(pick);
  assert.match(pick!.product.name, /No Name/i);
  assert.equal(pick!.cover.packs, 1);
  assert.ok(pick!.cover.totalCad < 4, String(pick!.cover.totalCad));
});

test("a heavy panko meal buys one bigger bag instead of two small ones when that is cheaper", () => {
  const staple = matchStaple("panko");
  const products = staple!.products.filter((p) => p.brand === "superstore");
  const pick = pickCheapestEnough({ name: "panko", qty: 400, unit: "g", aisle: "Pantry" }, products, staple!.gramsPerCup);
  assert.ok(pick);
  assert.match(pick!.product.sizeLabel, /425/);
  assert.equal(pick!.cover.packs, 1);
  assert.ok(pick!.cover.totalCad < 5.5);
});

test("line pick for Superstore panko is a real search, not the store homepage", () => {
  const line = pickForLine(store, { name: "panko breadcrumbs", qty: 1, unit: "cup", aisle: "Pantry" });
  assert.equal(line.matched, true);
  assert.match(line.pickName, /Panko/i);
  assert.match(line.addUrl, /atlanticsuperstore.*search/i);
  assert.match(line.addUrl, /No%20Name|No\+Name/i);
  assert.match(line.why, /Cheapest/i);
});

test("unknown foods still get a store search, not a blank cart", () => {
  const line = pickForLine(store, { name: "sumac", qty: 1, unit: "tsp", aisle: "Herbs & Spices" });
  assert.equal(line.matched, false);
  assert.match(line.addUrl, /search/);
});

test("catalog has panko for the three nearby banners", () => {
  const staple = STAPLES.find((s) => s.keys.includes("panko"));
  const brands = new Set(staple!.products.map((p) => p.brand));
  assert.ok(brands.has("superstore") && brands.has("walmart") && brands.has("sobeys"));
});

test("12 oz pasta buys the small 454 g box, not the 900 g bag", () => {
  const line = pickForLine(store, { name: "spaghetti", qty: 12, unit: "oz", aisle: "Pantry" });
  assert.equal(line.matched, true);
  assert.match(line.pickSize, /454/);
  assert.ok(line.pickCad < 2.2);
});

test("a jar of tomato sauce still matches the cheap bottle", () => {
  const line = pickForLine(store, { name: "tomato sauce", qty: 1, unit: "jar", aisle: "Pantry" });
  assert.equal(line.matched, true);
  assert.match(line.pickName, /No Name/i);
  assert.ok(line.pickCad < 3);
});

test("matchCart skips pantry and totals the cheap packs", () => {
  const cart = matchCart(store, [
    { name: "panko breadcrumbs", qty: 1, unit: "cup", aisle: "Pantry" },
    { name: "onion", qty: 1, unit: "ea", aisle: "Produce", fromPantry: true },
    { name: "spaghetti", qty: 12, unit: "oz", aisle: "Pantry" },
  ]);
  assert.equal(cart.items.length, 2);
  assert.ok(cart.items.every((i) => i.addUrl.includes("search")));
  assert.ok(cart.totalCad > 3 && cart.totalCad < 20, String(cart.totalCad));
  const panko = cart.items.find((i) => /panko/i.test(i.name));
  assert.match(panko?.pickName ?? "", /No Name/i);
});

test("a generic cheese line does not steal parmesan", () => {
  const line = pickForLine(store, { name: "cheese", qty: 1, unit: "cup", aisle: "Dairy & Eggs" });
  assert.match(line.pickName, /Cheddar/i);
});

test("package size 227 g with a unit price still parses as grams", () => {
  const parsed = parsePackageSizing("227 g, $1.67/100g");
  assert.equal(parsed.grams, 227);
  assert.match(parsed.unitHint, /1\.67/);
});

test("view options lists the cheapest covering packs first", () => {
  const options = catalogOptions(store, { name: "panko breadcrumbs", qty: 1, unit: "cup", aisle: "Pantry" }, 5);
  assert.ok(options.length >= 2);
  assert.match(options[0]!.name, /No Name/i);
  assert.equal(options[0]!.packs, 1);
  assert.ok(options[0]!.totalCad <= options[1]!.totalCad);
});

test("chicken breasts is not deli meat or a frozen meal", () => {
  const wrong = [
    "Maple Leaf Natural Selections Sliced Deli Chicken Breast, Oven Roasted",
    "Maple Leaf Natural Selections Shaved Deli Chicken Breast, Hickory Smoked",
    "Crave Spicy Szechuan Style Fried Chicken on Rice Frozen Meal",
    "Crave Creamy Cajun Alfredo with Chicken",
    "Crave Cheesy Chicken Alfredo Macaroni & Cheese Single Serve Meal",
    "Mina Spicy Chicken Burgers",
    "Knorr Bouillon Cubes chicken flavour",
    "Chicken Breast - Souvlaki",
    "No Name Chicken Broth",
    "PC Blue Menu Blue Menu Chicken Breast Seasoned Chunk",
    "Marcangelo Chicken Breast Medallions Bacon Wrapped",
    "President's Choice Free From Oven-Roasted Chicken Breast Slices",
    "Zabiha Halal Chicken Breast Nuggets",
  ];
  for (const name of wrong) {
    assert.equal(isRelevantProduct(name, "chicken breasts"), false, name);
  }
});

test("chicken breasts matches raw breast packs from the store", () => {
  const right = [
    "PC Blue Menu Extra Lean Boneless Skinless Chicken Breasts",
    "PC Blue Menu Boneless Skinless Chicken Breasts",
    "Sufra Halal Boneless Skinless Chicken Breast",
    "Chicken Breast, Club Pack Boneless Skinless",
    "No Name Club Pack Chicken Breasts, Boneless Skinless",
    "PC Blue Menu Extra Lean Chicken Breast Fillets",
    "PC Blue Menu Extra Lean Boneless Skinless Chicken Cutlets",
    "President's Choice Free From Chicken Breast, Boneless, Skinless",
    "Watson Ridge Chicken Breasts",
    "Boneless Skinless Chicken Breast",
  ];
  for (const name of right) {
    assert.equal(isRelevantProduct(name, "chicken breasts"), true, name);
  }
});

test("panko breadcrumbs still matches bread crumbs, not plain crumbs", () => {
  assert.equal(isRelevantProduct("No Name Panko Bread Crumbs", "panko breadcrumbs"), true);
  assert.equal(isRelevantProduct("No Name Plain Bread Crumbs", "panko breadcrumbs"), false);
});

test("chicken broth stays broth, not breast", () => {
  assert.equal(isRelevantProduct("No Name Chicken Broth", "chicken broth"), true);
  assert.equal(isRelevantProduct("Boneless Skinless Chicken Breast", "chicken broth"), false);
  assert.equal(isRelevantProduct("No Name Chicken Broth", "chicken breasts"), false);
});

test("sliced chicken is allowed when the list actually says sliced", () => {
  assert.equal(
    isRelevantProduct("Maple Leaf Natural Selections Sliced Deli Chicken Breast", "sliced chicken"),
    true,
  );
});

test("a generic chicken line still matches chicken breasts", () => {
  assert.equal(isRelevantProduct("Boneless Skinless Chicken Breast", "chicken"), true);
});

test("tomato sauce is still sauce", () => {
  assert.equal(isRelevantProduct("No Name Tomato Sauce", "tomato sauce"), true);
  assert.equal(isRelevantProduct("Boneless Skinless Chicken Breast", "tomato sauce"), false);
});

test("plant-based and margarine are not dairy butter", () => {
  const fakes = [
    "Earth Balance Plant Based Unsalted Butter",
    "Becel Plant Butter Salted 454 g",
    "PC Plant Based Unsalted Buttery Spread",
    "Violife Plant Butter",
    "President's Choice Plant Based Butter Alternative",
    "Becel Margarine",
    "I Can't Believe It's Not Butter",
    "Country Crock Plant Butter",
    "Flora Plant Butter Salted",
    "Earth Balance Original Buttery Spread",
  ];
  for (const name of fakes) {
    assert.equal(isRelevantProduct(name, "butter"), false, name);
    assert.equal(isRelevantProduct(name, "unsalted butter"), false, name);
    assert.equal(isRelevantProduct(name, "salted butter"), false, name);
  }
  const real = [
    "Compliments Unsalted Butter 454 g",
    "Lactantia Salted Butter 454 g",
    "No Name Salted Butter 454 g",
    "Gay Lea Unsalted Butter",
    "Organic Meadow Salted Butter 454 g",
  ];
  for (const name of real) {
    assert.equal(isRelevantProduct(name, "butter"), true, name);
  }
});

test("organic black pepper is still black pepper; bell pepper is not", () => {
  assert.equal(isRelevantProduct("No Name Organic Black Pepper", "black pepper"), true);
  assert.equal(isRelevantProduct("Club House Ground Black Pepper", "pepper"), true);
  assert.equal(isRelevantProduct("Green Bell Pepper", "black pepper"), false);
  assert.equal(isRelevantProduct("Green Bell Pepper", "pepper"), false);
});

test("search term singularizes the ingredient, not the whole phrase", () => {
  assert.equal(searchTermFor("chicken breasts"), "chicken breast");
  assert.equal(searchTermFor("panko breadcrumbs"), "panko breadcrumb");
});

test("overlay fill searches the ingredient, not a Superstore catalog name", () => {
  const line = pickForLine(store, { name: "salted butter", qty: 1, unit: "tbsp", aisle: "Dairy & Eggs" });
  assert.equal(overlaySearchQuery(line.name), "salted butter");
  assert.doesNotMatch(overlaySearchQuery(line.name), /no name/i);
  assert.equal(overlaySearchQuery("chicken breasts"), "chicken breast");
  assert.equal(overlaySearchQuery("garlic cloves"), "garlic");
  assert.equal(overlaySearchQuery("fresh basil"), "basil");
  assert.equal(overlaySearchQuery("extra virgin olive oil"), "olive oil");
  assert.equal(overlaySearchQuery("large eggs"), "eggs");
});

test("a per-kg chicken tray covers 3/4 lb with one pack", () => {
  const pick = pickCheapestEnough(
    { name: "chicken breasts", qty: 0.75, unit: "lb", aisle: "Meat & Seafood" },
    [
      { brand: "superstore", name: "Chicken Breast Club Pack", sizeLabel: "per kg", priceCad: 15.73, each: 1 },
      {
        brand: "superstore",
        name: "Boneless Skinless Chicken Breasts",
        sizeLabel: "1.1 kg",
        priceCad: 21,
        grams: 1100,
      },
    ],
  );
  assert.ok(pick);
  assert.equal(pick!.cover.packs, 1);
  assert.equal(pick!.product.sizeLabel, "per kg");
  assert.equal(pick!.cover.totalCad, 15.73);
});

test("a 1-ea chicken tray still covers a weighed meal", () => {
  const cover = coverWith(
    { brand: "superstore", name: "PC Blue Menu Chicken Breasts", sizeLabel: "1 ea", priceCad: 13, each: 1 },
    { name: "chicken breasts", qty: 0.75, unit: "lb", aisle: "Meat & Seafood" },
  );
  assert.ok(cover);
  assert.equal(cover!.packs, 1);
  assert.equal(cover!.totalCad, 13);
});

test("package size priced per kg stays per kg, not per lb", () => {
  const parsed = parsePackageSizing("$15.23/1kg $6.91/1lb");
  assert.equal(parsed.sizeLabel, "per kg");
  assert.equal(parsed.each, 1);
});

test("eggs is eggs, not egg noodles or eggplant", () => {
  assert.equal(isRelevantProduct("No Name Large Size Eggs 12 Pack", "eggs"), true);
  assert.equal(isRelevantProduct("Burnbrae Farms Nature's Best White Eggs, Large", "eggs"), true);
  assert.equal(isRelevantProduct("No Name Extra Large Size Eggs 12 Pack", "eggs"), true);
  assert.equal(isRelevantProduct("No Name Egg Noodles", "eggs"), false);
  assert.equal(isRelevantProduct("Catelli Egg Noodles Broad", "eggs"), false);
  assert.equal(isRelevantProduct("Eggplant", "eggs"), false);
  assert.equal(isRelevantProduct("Egg Salad Sandwich", "eggs"), false);
  assert.equal(isRelevantProduct("Kinder SURPRISE Milk Chocolate Egg with Toy, Classic Edition", "eggs"), false);
  assert.equal(isRelevantProduct("Cadbury Micro Mini Eggs, Chocolatey Candy Eggs", "eggs"), false);
});

test("milk is milk, not milk chocolate", () => {
  assert.equal(isRelevantProduct("Northumberland 2% Milk", "milk"), true);
  assert.equal(isRelevantProduct("Neilson 2% Microfiltered Milk", "milk"), true);
  assert.equal(isRelevantProduct("Cadbury Dairy Milk Chocolate", "milk"), false);
  assert.equal(isRelevantProduct("Milk Chocolate Chip Cookies", "milk"), false);
});

test("onion is onions, not onion soup", () => {
  assert.equal(isRelevantProduct("Farmer's Market Yellow Onions, 3 lb Bag", "onion"), true);
  assert.equal(isRelevantProduct("Green Onion", "onion"), true);
  assert.equal(isRelevantProduct("Lipton Onion Soup Mix", "onion"), false);
});

test("butter is butter, not peanut butter or apple butter", () => {
  assert.equal(isRelevantProduct("No Name Salted Butter", "butter"), true);
  assert.equal(isRelevantProduct("Lactantia Salted Butter", "butter"), true);
  assert.equal(isRelevantProduct("President's Choice Unsalted Butter", "butter"), true);
  assert.equal(isRelevantProduct("Kraft Smooth Peanut Butter", "butter"), false);
  assert.equal(isRelevantProduct("Skippy Natural Peanut Butter", "butter"), false);
  assert.equal(isRelevantProduct("President's Choice Apple Butter", "butter"), false);
  assert.equal(isRelevantProduct("Almond Butter", "butter"), false);
});

test("chicken breasts is the cut, not thighs or sliced deli", () => {
  assert.equal(isRelevantProduct("Boneless Skinless Chicken Breasts", "chicken breasts"), true);
  assert.equal(isRelevantProduct("Chicken Thighs Bone In", "chicken breasts"), false);
  assert.equal(isRelevantProduct("Maple Leaf Natural Selections Sliced Deli Chicken Breast", "chicken breasts"), false);
});
