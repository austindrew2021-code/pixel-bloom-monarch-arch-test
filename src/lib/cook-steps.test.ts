import assert from "node:assert/strict";
import test from "node:test";
import { polishSteps, scaleMethodSteps } from "./cook-steps.ts";
import { formatQty } from "./format.ts";
import type { Recipe } from "./types.ts";

function fake(partial: Partial<Recipe> & Pick<Recipe, "id" | "name" | "ingredients" | "steps">): Recipe {
  return {
    protein: "veg",
    plate: "bowl",
    minutes: 20,
    servings: 4,
    pack: "free",
    tags: [],
    description: "",
    nutrition: { cal: 200, protein: 8, carbs: 24, fat: 8 },
    ...partial,
  };
}

test("overnight oats and cocoa never go in a skillet", () => {
  const oats = polishSteps(
    fake({
      id: "pk-oats",
      name: "Pumpkin overnight oats",
      protein: "veg",
      plate: "bowl",
      minutes: 10,
      ingredients: [
        { name: "rolled oats", qty: 1, unit: "cup", aisle: "Pantry" },
        { name: "pumpkin puree", qty: 0.5, unit: "cup", aisle: "Pantry" },
        { name: "milk", qty: 1, unit: "cup", aisle: "Dairy & Eggs" },
      ],
      steps: ["Stir everything in a jar.", "Fridge overnight. Eat cold."],
    }),
  ).join("\n");
  assert.equal(/skillet|fat get hot|browned in spots/i.test(oats), false, oats);
  assert.ok(/refrigerate overnight|jar/i.test(oats), oats);

  const cocoa = polishSteps(
    fake({
      id: "hd-hot-cocoa",
      name: "Holiday hot cocoa",
      protein: "veg",
      plate: "bowl",
      minutes: 10,
      ingredients: [
        { name: "milk", qty: 4, unit: "cups", aisle: "Dairy & Eggs" },
        { name: "dark chocolate", qty: 4, unit: "oz", aisle: "Pantry" },
        { name: "sugar", qty: 2, unit: "tbsp", aisle: "Pantry" },
      ],
      steps: ["Warm milk. Whisk in chopped chocolate and sugar until smooth.", "Vanilla. Cream on top."],
    }),
  ).join("\n");
  assert.equal(/skillet|fat get hot|browned in spots/i.test(cocoa), false, cocoa);
  assert.ok(/milk/i.test(cocoa) && /chocolate/i.test(cocoa), cocoa);
  assert.ok(/saucepan|warm|steam/i.test(cocoa), cocoa);
});

test("chill steps do not repeat 'so the mix is set'", () => {
  const steps = polishSteps(
    fake({
      id: "cc-no-bake",
      name: "No-bake cheesecake cups",
      plate: "dessert",
      tags: ["dessert"],
      ingredients: [
        { name: "cream cheese", qty: 16, unit: "oz", aisle: "Dairy & Eggs" },
        { name: "sugar", qty: 0.5, unit: "cup", aisle: "Pantry" },
      ],
      steps: ["Beat cream cheese and sugar.", "Chill 1 hour."],
    }),
  );
  const blob = steps.join(" ");
  assert.equal(/so the mix is set so the mix is set/i.test(blob), false, blob);
});

test("one minute stays singular", () => {
  const steps = polishSteps(
    fake({
      id: "ip-quinoa",
      name: "Instant Pot quinoa bowl",
      tags: ["instant-pot"],
      ingredients: [
        { name: "quinoa", qty: 1.5, unit: "cups", aisle: "Pantry" },
        { name: "water", qty: 1.75, unit: "cups", aisle: "Other" },
      ],
      steps: ["Quinoa, water, salt. High pressure 1 minute. Natural 10.", "Lemon, oil, parsley."],
    }),
  ).join(" ");
  assert.equal(/\b1 minutes\b/i.test(steps), false, steps);
  assert.ok(/1 minute/i.test(steps), steps);
});

test("poke bowls stay cold, not a skillet", () => {
  const poke = polishSteps(
    fake({
      id: "gf-poke",
      name: "Ahi poke bowl",
      protein: "fish",
      tags: ["pescatarian"],
      ingredients: [
        { name: "sushi-grade tuna", qty: 1, unit: "lb", aisle: "Meat & Seafood" },
        { name: "tamari", qty: 3, unit: "tbsp", aisle: "Pantry" },
        { name: "rice", qty: 1.5, unit: "cups", aisle: "Pantry" },
      ],
      steps: ["Cube tuna. Tamari, sesame, scallion.", "Rice, cucumber, avocado, tuna on top."],
    }),
  ).join("\n");
  assert.equal(/skillet|fat get hot|browned in spots/i.test(poke), false, poke);
  assert.ok(/tuna|cube/i.test(poke), poke);
});

test("cole slaw is served cold, not hot", () => {
  const steps = polishSteps(
    fake({
      id: "so-cole-slaw",
      name: "Mississippi cole slaw",
      protein: "pork",
      plate: "green",
      tags: ["southern"],
      ingredients: [
        { name: "cabbage", qty: 1, unit: "head", aisle: "Produce" },
        { name: "cooked ham", qty: 1, unit: "cup", aisle: "Meat & Seafood" },
        { name: "mayonnaise", qty: 1, unit: "cup", aisle: "Pantry" },
      ],
      steps: [
        "Slice the head of cabbage thin. Mix with the ham.",
        "Toss with the mayonnaise.",
        "Chill 20 minutes and serve cold.",
      ],
    }),
  ).join("\n");
  assert.equal(/plate and serve hot/i.test(steps), false, steps);
  assert.ok(/cold/i.test(steps), steps);
});

test("egg nog names bourbon and the egg, not a skillet", () => {
  const steps = polishSteps(
    fake({
      id: "so-egg-nog",
      name: "Egg nog",
      protein: "eggs",
      plate: "bowl",
      tags: ["drink", "southern"],
      servings: 1,
      ingredients: [
        { name: "egg", qty: 1, unit: "", aisle: "Dairy & Eggs" },
        { name: "sugar", qty: 2, unit: "tsp", aisle: "Pantry" },
        { name: "cream", qty: 2, unit: "tbsp", aisle: "Dairy & Eggs" },
        { name: "bourbon", qty: 2, unit: "oz", aisle: "Other" },
        { name: "milk", qty: 6, unit: "oz", aisle: "Dairy & Eggs" },
        { name: "nutmeg", qty: 1, unit: "pinch", aisle: "Herbs & Spices" },
      ],
      steps: [
        "Separate the egg. Beat the yolk with the 2 teaspoons of sugar until thick and pale.",
        "Beat the white to stiff peaks. Fold the white, the 2 tablespoons of cream, and the 2 ounces of bourbon into the yolk.",
        "Fill the glass with the cold 6 ounces of milk and grate the pinch of nutmeg over the top.",
      ],
    }),
  ).join("\n");
  assert.equal(/skillet|fat get hot/i.test(steps), false, steps);
  assert.ok(/bourbon/i.test(steps), steps);
  assert.ok(/egg/i.test(steps), steps);
});

test("three-quarter cup stays singular", () => {
  assert.equal(formatQty(0.75, "cups"), "¾ cup");
  assert.equal(formatQty(1, "eggs"), "1 egg");
  assert.equal(formatQty(2, "cups"), "2 cups");
});

test("bare ½ cup scales; 1½ cups in the same step still scales", () => {
  const ings = [
    { name: "milk", qty: 1.5, unit: "cups" },
    { name: "parmesan", qty: 0.5, unit: "cup" },
  ];
  const steps = [
    "Warm the 1½ cups of milk in a saucepan. Stir in the ½ cup of parmesan until the sauce coats a spoon, 3–4 minutes.",
  ];
  const one = scaleMethodSteps(steps, ings, 1, 4).join(" ");
  assert.match(one, /½ cup of milk/);
  assert.match(one, /¼ cup of parmesan/);
  assert.equal(/½ cup of parmesan/.test(one), false, one);

  const two = scaleMethodSteps(steps, ings, 2, 4).join(" ");
  assert.match(two, /¾ cup of milk/);
  assert.match(two, /¼ cup of parmesan/);
  assert.equal(/½ cup of parmesan/.test(two), false, two);
});

test("½ inch of oil is a depth, not a scaled amount", () => {
  const ings = [{ name: "neutral oil", qty: 1.5, unit: "cups" }];
  const steps = ["Heat ½ inch of the oil in a wide skillet to 350°F."];
  const out = scaleMethodSteps(steps, ings, 2, 4).join(" ");
  assert.match(out, /½ inch/);
  assert.equal(/¼ inch/.test(out), false, out);
});

test("partial '2 tablespoons of the butter' scales the 2, not the full 3", () => {
  const ings = [{ name: "butter", qty: 3, unit: "tbsp" }];
  const steps = ["Mash with 2 tablespoons of the butter. Keep warm."];
  const out = scaleMethodSteps(steps, ings, 2, 4).join(" ");
  assert.match(out, /1 tablespoon of the butter/);
  assert.equal(/1½ tablespoons of butter/.test(out) || /the 1½ tablespoons of butter/.test(out), false, out);
});

test("cook times and oven temps do not scale", () => {
  const ings = [{ name: "flour", qty: 1, unit: "cup" }];
  const steps = ["Bake at 350°F for 25 minutes, until gold. Rest 10 minutes."];
  const out = scaleMethodSteps(steps, ings, 2, 4).join(" ");
  assert.match(out, /350°F/);
  assert.match(out, /25 minutes/);
  assert.match(out, /10 minutes/);
});

test("wrong named amount is rewritten from the list", () => {
  const ings = [{ name: "parmesan", qty: 0.5, unit: "cup" }];
  const steps = ["Stir in the 1 cup of parmesan until the sauce coats a spoon."];
  const four = scaleMethodSteps(steps, ings, 4, 4).join(" ");
  assert.match(four, /½ cup of parmesan/);
  const two = scaleMethodSteps(steps, ings, 2, 4).join(" ");
  assert.match(two, /¼ cup of parmesan/);
});

test("cold milk does not double the word the when scaled", () => {
  const ings = [{ name: "milk", qty: 6, unit: "oz" }];
  const steps = ["Fill the glass with the cold 6 ounces of milk and grate nutmeg over."];
  const out = scaleMethodSteps(steps, ings, 2, 1).join(" ");
  assert.equal(/\bthe the\b/i.test(out), false, out);
  assert.match(out, /12 ounces of (cold )?milk|cold 12 ounces of milk/);
});

test("Kentucky Hot Brown step amounts match the list at 1 and 2 people", () => {
  const recipe = fake({
    id: "ky-hot-brown",
    name: "Kentucky Hot Brown",
    protein: "turkey",
    plate: "toast",
    minutes: 25,
    servings: 4,
    ingredients: [
      { name: "turkey slices", qty: 12, unit: "oz", aisle: "Meat & Seafood" },
      { name: "white bread", qty: 4, unit: "slices", aisle: "Bakery" },
      { name: "parmesan", qty: 0.5, unit: "cup", aisle: "Dairy & Eggs" },
      { name: "milk", qty: 1.5, unit: "cups", aisle: "Dairy & Eggs" },
      { name: "bacon", qty: 8, unit: "slices", aisle: "Meat & Seafood" },
      { name: "tomato", qty: 2, unit: "", aisle: "Produce" },
    ],
    steps: [
      "Heat the broiler. Toast the white bread on both sides until gold, about 2 minutes a side.",
      "Cook the bacon in a skillet over medium heat for 6–8 minutes, until crisp. Drain on paper.",
      "Warm the milk in a saucepan over medium-low. Stir in the parmesan until the sauce coats a spoon, 3–4 minutes. Salt and pepper.",
      "Set the toast on an oven-safe plate. Lay the turkey slices on the toast. Pour the sauce over the turkey.",
      "Broil 2–3 minutes, until the sauce is bubbling. Cross the bacon on top and add tomato slices. Serve hot.",
    ],
  });
  const polished = polishSteps(recipe);
  const sauce = polished.find((s) => /parmesan/i.test(s)) ?? "";
  const one = scaleMethodSteps([sauce], recipe.ingredients, 1, 4).join(" ");
  assert.match(one, /½ cup of milk/);
  assert.match(one, /¼ cup of parmesan/);
  const two = scaleMethodSteps([sauce], recipe.ingredients, 2, 4).join(" ");
  assert.match(two, /¾ cup of milk/);
  assert.match(two, /¼ cup of parmesan/);
});

test("hummus vegetable wrap is rolled, never blended", () => {
  const recipe = fake({
    id: "sw-hummus-veg",
    name: "Hummus vegetable wrap",
    protein: "veg",
    plate: "taco",
    tags: ["sandwich", "vegetarian", "vegan", "quick"],
    minutes: 10,
    servings: 4,
    ingredients: [
      { name: "wraps", qty: 4, unit: "", aisle: "Bakery" },
      { name: "hummus", qty: 1, unit: "cup", aisle: "Pantry" },
      { name: "carrot", qty: 2, unit: "", aisle: "Produce" },
      { name: "cucumber", qty: 1, unit: "", aisle: "Produce" },
      { name: "spinach", qty: 2, unit: "cups", aisle: "Produce" },
      { name: "red pepper", qty: 1, unit: "", aisle: "Produce" },
    ],
    steps: [
      "Warm the 4 wraps in a dry pan 15 seconds a side so they flex.",
      "Spread the 1 cup of hummus on the wraps, going almost to the edges.",
      "Pile on the grated carrots, sliced cucumber, the 2 cups of spinach, and the sliced red pepper.",
      "Roll the wraps tight, slice each in half, and eat while they are still cool and crisp.",
    ],
  });
  const polished = polishSteps(recipe);
  const blob = polished.join(" ");
  assert.equal(/\bblend\b/i.test(blob), false, blob);
  assert.ok(/spread/i.test(blob) && /roll/i.test(blob), blob);
  const two = scaleMethodSteps(polished, recipe.ingredients, 2, 4).join(" ");
  assert.match(two, /2 wraps/);
  assert.match(two, /½ cup of hummus/);
  assert.equal(/\b4 wraps\b/.test(two), false, two);
});

test("hyphenated roast weight stays singular and scales", () => {
  const out = scaleMethodSteps(
    ["Set the 3-pound beef roast in a pan."],
    [{ name: "beef roast", qty: 3, unit: "lb" }],
    2,
    4,
  ).join(" ");
  assert.match(out, /1½-pound beef/);
  assert.equal(/pounds/.test(out), false, out);
});

test("unitless carrot count scales with the list", () => {
  const out = scaleMethodSteps(
    ["Shave the 2 carrots and slice the cucumber."],
    [
      { name: "carrot", qty: 2, unit: "" },
      { name: "cucumber", qty: 1, unit: "" },
    ],
    2,
    4,
  ).join(" ");
  assert.match(out, /the carrot|1 carrot/);
  assert.equal(/\b2 carrots\b/.test(out), false, out);
});

test("a quarter tablespoon prints as three-quarter teaspoon", () => {
  assert.equal(formatQty(0.25, "tbsp"), "¾ tsp");
});

test("quiche is baked, not toasted like a sandwich", () => {
  const steps = polishSteps(
    fake({
      id: "quiche-lorraine",
      name: "Quiche Lorraine",
      protein: "eggs",
      plate: "toast",
      minutes: 60,
      ingredients: [
        { name: "pie crust", qty: 1, unit: "", aisle: "Bakery" },
        { name: "bacon", qty: 6, unit: "slices", aisle: "Meat & Seafood" },
        { name: "eggs", qty: 4, unit: "", aisle: "Dairy & Eggs" },
        { name: "cream", qty: 1.5, unit: "cups", aisle: "Dairy & Eggs" },
        { name: "Gruyère", qty: 4, unit: "oz", aisle: "Dairy & Eggs" },
      ],
      steps: ["Blind-bake crust. Scatter bacon and cheese.", "Pour egg and cream. Bake 35 minutes at 350°F until just set."],
    }),
  ).join("\n");
  assert.equal(/toast the bread/i.test(steps), false, steps);
  assert.ok(/bake/i.test(steps) && /crust/i.test(steps), steps);
});
