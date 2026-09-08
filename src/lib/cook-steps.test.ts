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

test("a garnish goes on at the table, not into a pot that simmers for half an hour", () => {
  const steps = polishSteps(
    fake({
      id: "turkey-chili-bowl",
      name: "Turkey chili bowl",
      protein: "turkey",
      plate: "soup",
      minutes: 45,
      ingredients: [
        { name: "ground turkey", qty: 2, unit: "lb", aisle: "Meat & Seafood" },
        { name: "black beans", qty: 2, unit: "cans", aisle: "Pantry" },
        { name: "crushed tomatoes", qty: 1, unit: "can", aisle: "Pantry" },
        { name: "onion", qty: 1, unit: "", aisle: "Produce" },
        { name: "chili powder", qty: 2, unit: "tbsp", aisle: "Herbs & Spices" },
        { name: "Greek yogurt", qty: 0.5, unit: "cup", aisle: "Dairy & Eggs" },
      ],
      steps: ["Brown the turkey with the onion.", "Add the rest and simmer."],
    }),
  );
  const yogurtAt = steps.findIndex((s) => /yogurt/i.test(s));
  assert.ok(yogurtAt >= 0, steps.join("\n"));
  assert.equal(yogurtAt, steps.length - 1, `yogurt should land on the serving step:\n${steps.join("\n")}`);
  assert.match(steps[yogurtAt]!, /top each bowl with/i);
  // Everything on the list still has to get into the pot somewhere.
  assert.match(steps.join(" "), /crushed tomatoes/i);
});

test("a shape of pasta counts as used when the method just says pasta", () => {
  const steps = polishSteps(
    fake({
      id: "tomato-basil-pasta",
      name: "Tomato basil pasta",
      plate: "pasta",
      ingredients: [
        { name: "spaghetti", qty: 12, unit: "oz", aisle: "Pantry" },
        { name: "ripe tomatoes", qty: 6, unit: "", aisle: "Produce" },
        { name: "garlic", qty: 4, unit: "cloves", aisle: "Produce" },
        { name: "olive oil", qty: 3, unit: "tbsp", aisle: "Pantry" },
      ],
      steps: [
        "Boil pasta in well-salted water until just shy of al dente. Save a cup of water.",
        "Warm the oil and garlic until fragrant. Add chopped tomatoes and a pinch of salt.",
        "Simmer until the tomatoes slump, 10 minutes. Add pasta and a splash of the pasta water.",
        "Toss until glossy.",
      ],
    }),
  );
  // The pasta is boiled in step 1; it must not also be tipped into the sauce pan.
  assert.equal(
    steps.filter((s) => /\b(stir in|add) the [^.]*spaghetti/i.test(s)).length,
    0,
    steps.join("\n"),
  );
});

test("pasta water keeps its own name and never borrows the pasta's weight", () => {
  const steps = polishSteps(
    fake({
      id: "pk-sage-pasta",
      name: "Pumpkin sage pasta",
      plate: "pasta",
      ingredients: [
        { name: "pasta", qty: 12, unit: "oz", aisle: "Pantry" },
        { name: "pumpkin puree", qty: 1, unit: "cup", aisle: "Pantry" },
        { name: "butter", qty: 4, unit: "tbsp", aisle: "Dairy & Eggs" },
        { name: "sage", qty: 12, unit: "leaves", aisle: "Herbs & Spices" },
      ],
      steps: ["Cook the pasta. Save a cup of the water.", "Brown the butter with the sage, add pumpkin, toss."],
    }),
  ).join("\n");
  assert.equal(/\d+ ounces of pasta water/i.test(steps), false, steps);
});

test("an amount is spelled out once, not repeated into a doneness cue", () => {
  const steps = polishSteps(
    fake({
      id: "tuna-melt",
      name: "Tuna melt",
      protein: "fish",
      plate: "toast",
      minutes: 15,
      ingredients: [
        { name: "canned tuna", qty: 2, unit: "cans", aisle: "Pantry" },
        { name: "mayonnaise", qty: 3, unit: "tbsp", aisle: "Pantry" },
        { name: "cheddar", qty: 4, unit: "slices", aisle: "Dairy & Eggs" },
        { name: "bread", qty: 8, unit: "slices", aisle: "Bakery" },
      ],
      steps: [
        "Flake the tuna and mix it with the mayonnaise.",
        "Spread it over four slices of bread, top each with cheddar and a second slice.",
        "Griddle until the bread is deep gold and the cheddar has run.",
      ],
    }),
  ).join("\n");
  assert.equal(/until the 8 slices of bread/i.test(steps), false, steps);
  assert.equal((steps.match(/8 slices of bread/gi) ?? []).length <= 1, true, steps);
});

test("a leftover roasting fat is rubbed on before the oven, not stirred into a cooked bird", () => {
  const steps = polishSteps(
    fake({
      id: "so-roast-chicken",
      name: "Roast chicken",
      protein: "chicken",
      plate: "roast",
      minutes: 110,
      ingredients: [
        { name: "chicken", qty: 1, unit: "bird", aisle: "Meat & Seafood" },
        { name: "flour", qty: 0.25, unit: "cup", aisle: "Pantry" },
        { name: "butter", qty: 4, unit: "tbsp", aisle: "Dairy & Eggs" },
      ],
      steps: [
        "Dredge a seasoned 4-pound bird with the flour.",
        "Roast in a hot oven (425°F) until the flour browns.",
        "Lower the heat to 350°F. Baste every 15 minutes.",
        "Roast about 1½ hours, until the juices run clear.",
      ],
    }),
  );
  const butterAt = steps.findIndex((s) => /butter/i.test(s));
  assert.ok(butterAt >= 0, steps.join("\n"));
  assert.equal(butterAt, 0, `butter belongs on the bird before it roasts:\n${steps.join("\n")}`);
  assert.equal(/stir in [^.]*butter/i.test(steps.join("\n")), false, steps.join("\n"));
});

test("\"any quick-cooking vegetables\" is never expanded into the food already in the pot", () => {
  const steps = polishSteps(
    fake({
      id: "su-split-pea",
      name: "Split pea soup",
      plate: "soup",
      minutes: 60,
      ingredients: [
        { name: "split peas", qty: 1, unit: "lb", aisle: "Pantry" },
        { name: "carrot", qty: 2, unit: "", aisle: "Produce" },
        { name: "onion", qty: 1, unit: "", aisle: "Produce" },
        { name: "celery", qty: 2, unit: "stalks", aisle: "Produce" },
        { name: "vegetable broth", qty: 8, unit: "cups", aisle: "Pantry" },
      ],
      steps: ["Simmer everything until the peas break down."],
    }),
  ).join("\n");
  assert.equal(/quick-cooking the /i.test(steps), false, steps);
  assert.equal(/Add any quick-cooking/i.test(steps), false, steps);
});

test("a generic \"season with salt\" does not count as using the salt pork", () => {
  const steps = polishSteps(
    fake({
      id: "so-pot-likker",
      name: "Pot likker",
      protein: "pork",
      plate: "soup",
      minutes: 90,
      ingredients: [
        { name: "collard greens", qty: 2, unit: "bunches", aisle: "Produce" },
        { name: "ham hock", qty: 1, unit: "", aisle: "Meat & Seafood" },
        { name: "onion", qty: 1, unit: "", aisle: "Produce" },
        { name: "salt pork", qty: 4, unit: "oz", aisle: "Meat & Seafood" },
      ],
      steps: [
        "Cover greens and ham hock with water.",
        "Simmer until the greens are silk. Season with salt and pepper.",
        "Serve the liquor in cups, greens on the side.",
      ],
    }),
  );
  assert.match(steps.join(" "), /salt pork/i);
  // It goes in with the greens, not after an hour and a half of simmering.
  const porkAt = steps.findIndex((s) => /salt pork/i.test(s));
  assert.equal(porkAt, 0, steps.join("\n"));
});

test("buttermilk and butter beans are never used as the fat in the pan", () => {
  const chicken = polishSteps(
    fake({
      id: "buttermilk-fried-chicken",
      name: "Buttermilk fried chicken",
      protein: "chicken",
      plate: "skillet",
      minutes: 45,
      ingredients: [
        { name: "chicken thighs", qty: 2, unit: "lb", aisle: "Meat & Seafood" },
        { name: "buttermilk", qty: 2, unit: "cups", aisle: "Dairy & Eggs" },
        { name: "flour", qty: 2, unit: "cups", aisle: "Pantry" },
        { name: "oil for frying", qty: 4, unit: "cups", aisle: "Pantry" },
      ],
      steps: ["Soak the chicken in buttermilk.", "Dredge and fry until gold."],
    }),
  ).join("\n");
  assert.equal(/film of (?:the [^.]*)?buttermilk/i.test(chicken), false, chicken);

  const oxtail = polishSteps(
    fake({
      id: "cb-oxtail",
      name: "Oxtail",
      protein: "beef",
      plate: "skillet",
      minutes: 180,
      ingredients: [
        { name: "oxtail", qty: 3, unit: "lb", aisle: "Meat & Seafood" },
        { name: "butter beans", qty: 1, unit: "can", aisle: "Pantry" },
        { name: "onion", qty: 1, unit: "", aisle: "Produce" },
      ],
      steps: ["Brown the oxtail, then braise until it falls off the bone."],
    }),
  ).join("\n");
  assert.equal(/film of (?:the [^.]*)?butter beans/i.test(oxtail), false, oxtail);
});

test("a chopped salad is never told to wash and tear greens it does not have", () => {
  const steps = polishSteps(
    fake({
      id: "it-caprese",
      name: "Caprese salad",
      plate: "green",
      minutes: 10,
      ingredients: [
        { name: "ripe tomatoes", qty: 4, unit: "", aisle: "Produce" },
        { name: "fresh mozzarella", qty: 8, unit: "oz", aisle: "Dairy & Eggs" },
        { name: "fresh basil", qty: 1, unit: "bunch", aisle: "Produce" },
        { name: "olive oil", qty: 2, unit: "tbsp", aisle: "Pantry" },
      ],
      steps: ["Slice tomatoes and mozzarella. Layer with basil, oil, salt."],
    }),
  ).join("\n");
  assert.equal(/wash and dry the greens/i.test(steps), false, steps);
  assert.equal(/cook, stirring, until everything is hot/i.test(steps), false, steps);
});

test("a raw sauce is blended cold, not simmered through a roux", () => {
  const steps = polishSteps(
    fake({
      id: "basil-pesto",
      name: "Basil pesto",
      plate: "dessert",
      minutes: 10,
      ingredients: [
        { name: "fresh basil", qty: 2, unit: "bunches", aisle: "Produce" },
        { name: "pine nuts", qty: 0.33, unit: "cup", aisle: "Pantry" },
        { name: "garlic", qty: 2, unit: "cloves", aisle: "Produce" },
        { name: "parmesan", qty: 0.5, unit: "cup", aisle: "Dairy & Eggs" },
        { name: "olive oil", qty: 0.5, unit: "cup", aisle: "Pantry" },
      ],
      steps: ["Blend everything to a coarse paste."],
    }),
  ).join("\n");
  assert.equal(/Stir in any flour or starch/i.test(steps), false, steps);
  assert.equal(/simmer/i.test(steps), false, steps);
  assert.match(steps, /not cooked|do not heat it/i);
});

test("a coating goes on before the pan, not stirred in after searing", () => {
  const steps = polishSteps(
    fake({
      id: "schnitzel",
      name: "Pork schnitzel",
      protein: "pork",
      plate: "skillet",
      minutes: 30,
      ingredients: [
        { name: "pork cutlets", qty: 4, unit: "", aisle: "Meat & Seafood" },
        { name: "flour", qty: 0.5, unit: "cup", aisle: "Pantry" },
        { name: "eggs", qty: 2, unit: "", aisle: "Dairy & Eggs" },
        { name: "breadcrumbs", qty: 1.5, unit: "cups", aisle: "Pantry" },
        { name: "oil for frying", qty: 1, unit: "cup", aisle: "Pantry" },
      ],
      steps: ["Pound the cutlets thin.", "Fry until gold on both sides."],
    }),
  );
  const coatAt = steps.findIndex((s) => /breadcrumbs/i.test(s));
  const cookAt = steps.findIndex((s) => /\b(sear|fry|griddle)\b/i.test(s));
  assert.ok(coatAt >= 0 && cookAt >= 0, steps.join("\n"));
  assert.ok(coatAt < cookAt, `breading must come before the pan:\n${steps.join("\n")}`);
});

test("fried rice puts its rice in the pan, not on the side", () => {
  const steps = polishSteps(
    fake({
      id: "hm-spam-fried-rice",
      name: "Spam fried rice",
      protein: "pork",
      plate: "skillet",
      minutes: 20,
      ingredients: [
        { name: "Spam", qty: 1, unit: "can", aisle: "Meat & Seafood" },
        { name: "cooked rice", qty: 4, unit: "cups", aisle: "Pantry" },
        { name: "eggs", qty: 2, unit: "", aisle: "Dairy & Eggs" },
        { name: "tamari", qty: 2, unit: "tbsp", aisle: "Pantry" },
      ],
      steps: ["Crisp the Spam, scramble the eggs, toss everything with the rice."],
    }),
  ).join("\n");
  assert.equal(/Serve with the [^.]*rice/i.test(steps), false, steps);
  assert.match(steps, /rice to the pan|toss/i);
});

test("a shaped bake is shaped, not poured into one dish", () => {
  const biscotti = polishSteps(
    fake({
      id: "bk-biscotti",
      name: "Almond biscotti",
      plate: "dessert",
      minutes: 60,
      ingredients: [
        { name: "flour", qty: 2, unit: "cups", aisle: "Pantry" },
        { name: "sugar", qty: 0.75, unit: "cup", aisle: "Pantry" },
        { name: "eggs", qty: 2, unit: "", aisle: "Dairy & Eggs" },
        { name: "almonds", qty: 1, unit: "cup", aisle: "Pantry" },
      ],
      steps: ["Bake into logs, slice, bake again."],
    }),
  ).join("\n");
  assert.match(biscotti, /logs?/i);
  assert.match(biscotti, /slices?/i);
  assert.equal(/Scrape into the dish/i.test(biscotti), false, biscotti);

  const thumb = polishSteps(
    fake({
      id: "bk-thumbprints",
      name: "Jam thumbprint cookies",
      plate: "dessert",
      minutes: 35,
      ingredients: [
        { name: "butter", qty: 1, unit: "cup", aisle: "Dairy & Eggs" },
        { name: "sugar", qty: 0.67, unit: "cup", aisle: "Pantry" },
        { name: "flour", qty: 2, unit: "cups", aisle: "Pantry" },
        { name: "raspberry jam", qty: 0.5, unit: "cup", aisle: "Pantry" },
      ],
      steps: ["Roll, thumbprint, fill with jam, bake."],
    }),
  ).join("\n");
  assert.match(thumb, /hollow|thumb/i);
  assert.equal(/Scrape into the dish/i.test(thumb), false, thumb);
});

test("an ingredient whose own name ends in \"meat\" is not re-expanded on top of itself", () => {
  const turtle = polishSteps(
    fake({
      id: "so-turtle-soup",
      name: "Pendennis turtle soup",
      protein: "beef",
      plate: "soup",
      minutes: 120,
      ingredients: [
        { name: "veal or turtle meat", qty: 1.5, unit: "lb", aisle: "Meat & Seafood" },
        { name: "onion", qty: 1, unit: "", aisle: "Produce" },
        { name: "tomato", qty: 2, unit: "", aisle: "Produce" },
      ],
      steps: ["Simmer meat with onion and tomato until tender.", "Finish with sherry. Serve very hot."],
    }),
  ).join("\n");
  assert.equal(/veal or turtle veal or turtle meat/i.test(turtle), false, turtle);
  assert.equal(/veal or turtle the [\d½¼¾]/i.test(turtle), false, turtle);

  const stew = polishSteps(
    fake({
      id: "so-creole-beef-stew",
      name: "Creole beef stew",
      protein: "beef",
      plate: "skillet",
      minutes: 120,
      ingredients: [
        { name: "beef stew meat", qty: 2, unit: "lb", aisle: "Meat & Seafood" },
        { name: "green pepper", qty: 2, unit: "", aisle: "Produce" },
      ],
      steps: ["Brown beef. Add pepper. Add water to cover.", "Simmer 2 hours until the beef stew meat gives."],
    }),
  ).join("\n");
  assert.equal(/beef stew beef stew meat/i.test(stew), false, stew);
});

test("a short spoon-onto line is not given two serving endings across two polishing passes", () => {
  const steps = polishSteps(
    fake({
      id: "so-dried-beef-maryland",
      name: "Dried beef à la Maryland",
      protein: "beef",
      plate: "skillet",
      minutes: 20,
      ingredients: [
        { name: "dried beef", qty: 8, unit: "oz", aisle: "Meat & Seafood" },
        { name: "butter", qty: 3, unit: "tbsp", aisle: "Dairy & Eggs" },
        { name: "flour", qty: 3, unit: "tbsp", aisle: "Pantry" },
        { name: "milk", qty: 1.5, unit: "cups", aisle: "Dairy & Eggs" },
      ],
      steps: ["Soak chipped beef in boiling water 5 minutes. Drain.", "Make a cream sauce. Add beef. Serve on toast."],
    }),
  ).join(" ");
  assert.equal((steps.match(/\bserve\b/gi) ?? []).length, 1, steps);
  assert.equal(/serve at once and serve/i.test(steps), false, steps);
});

test("an article before an unlisted adjective is not stranded when the quantity is inserted", () => {
  const steps = polishSteps(
    fake({
      id: "so-guava-jelly",
      name: "Guava jelly",
      plate: "dessert",
      minutes: 60,
      ingredients: [
        { name: "guavas", qty: 3, unit: "lb", aisle: "Produce" },
        { name: "sugar", qty: 3, unit: "cups", aisle: "Pantry" },
      ],
      steps: ["Slice the unpeeled guavas and cover with water. Cook soft.", "Boil with sugar to the jelly point."],
    }),
  ).join(" ");
  assert.equal(/\bthe unpeeled the [\d½¼¾]/i.test(steps), false, steps);
});

test("parboil is recognized as a cooking verb, not wrapped as a bare noun fragment", () => {
  const steps = polishSteps(
    fake({
      id: "so-sweetbreads",
      name: "Sweetbreads and mushrooms",
      protein: "chicken",
      plate: "skillet",
      minutes: 35,
      ingredients: [
        { name: "sweetbreads", qty: 1.5, unit: "lb", aisle: "Meat & Seafood" },
        { name: "mushrooms", qty: 0.5, unit: "lb", aisle: "Produce" },
      ],
      steps: ["Parboil sweetbreads, remove membrane. Slice the sweetbreads.", "Sauté mushrooms, add sweetbreads."],
    }),
  ).join(" ");
  assert.equal(/^add the parboil/i.test(steps), false, steps);
  assert.match(steps, /^Parboil/i);
});
