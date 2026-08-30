import assert from "node:assert/strict";
import test from "node:test";
import { cleanRecipeName, polishSteps, polishRecipe, scaleMethodSteps } from "./cook-steps.ts";

import type { Recipe } from "./types.ts";

function fake(partial: Partial<Recipe> & Pick<Recipe, "name" | "steps">): Recipe {
  return {
    id: "test",
    minutes: 30,
    servings: 4,
    protein: "beef",
    plate: "skillet",
    pack: "free",
    tags: [],
    description: "A weeknight skillet.",
    nutrition: { cal: 400, protein: 20, carbs: 30, fat: 16 },
    ingredients: [
      { name: "ground beef", qty: 1, unit: "lb", aisle: "Meat & Seafood" },
      { name: "onion", qty: 1, unit: "", aisle: "Produce" },
      { name: "ketchup", qty: 0.5, unit: "cup", aisle: "Pantry" },
      { name: "hamburger buns", qty: 4, unit: "", aisle: "Bakery" },
    ],
    ...partial,
  };
}

test("drops junk dish names", () => {
  assert.equal(cleanRecipeName("Ingredients"), null);
  assert.equal(cleanRecipeName("DIRECTIONS"), null);
  assert.equal(cleanRecipeName("Sloppy joes"), "Sloppy joes");
});

test("thin recipes name the food, the pan, and the time", () => {
  const steps = polishSteps(
    fake({
      name: "Sloppy joes",
      minutes: 25,
      plate: "toast",
      steps: [
        "Brown beef with chopped onion. Drain extra fat.",
        "Stir in ketchup. Simmer 10 minutes.",
        "Spoon onto toasted buns.",
      ],
    }),
  );
  assert.ok(steps.length >= 4);
  assert.ok(steps.every((s) => s.length >= 40), steps.join("\n"));
  assert.ok(steps.every((s) => /[.!?]$/.test(s)));
  assert.ok(steps.some((s) => /ground beef|hamburger buns|ketchup/i.test(s)));
  assert.ok(steps.some((s) => /6–8 minutes|6-8 minutes/i.test(s)));
  assert.ok(steps.some((s) => /10 minutes/i.test(s)));
  assert.ok(steps.some((s) => /skillet|pan/i.test(s)));
  assert.equal(steps.some((s) => /^simmer 10 minutes\.?$/i.test(s)), false);
  assert.equal(steps.some((s) => /^drain extra fat\.?$/i.test(s)), false);
});

test("keeps a solid 5-step method", () => {
  const original = [
    "Heat the oven to 425°F. Pat the chicken dry and salt it generously inside and out.",
    "Stuff the cavity with halved lemons, smashed garlic, and thyme.",
    "Rub the skin with olive oil, pepper, and a last pinch of salt.",
    "Roast 60–70 minutes until juices run clear and the skin is deep gold.",
    "Rest 10 minutes before carving. Spoon pan juices over the slices.",
  ];
  const steps = polishSteps(
    fake({
      name: "Lemon garlic roast chicken",
      protein: "chicken",
      plate: "roast",
      minutes: 75,
      ingredients: [
        { name: "whole chicken", qty: 1, unit: "bird", aisle: "Meat & Seafood" },
        { name: "lemon", qty: 2, unit: "", aisle: "Produce" },
        { name: "garlic", qty: 6, unit: "cloves", aisle: "Produce" },
        { name: "fresh thyme", qty: 6, unit: "sprigs", aisle: "Produce" },
        { name: "olive oil", qty: 2, unit: "tbsp", aisle: "Pantry" },
      ],
      steps: original,
    }),
  );
  const blob = steps.join("\n");
  assert.equal(steps.length, original.length);
  assert.ok(/425/.test(blob), blob);
  assert.ok(/pat the (whole )?chicken/i.test(blob), blob);
  assert.ok(/stuff the cavity/i.test(blob), blob);
  assert.ok(/60–70 minutes/i.test(blob), blob);
  assert.ok(/rest 10 minutes/i.test(blob), blob);
  assert.ok(/olive oil/i.test(blob), blob);
  assert.equal(/breaking the meat up/i.test(blob), false, blob);
});

test("expands Instant Pot fragments", () => {
  const steps = polishSteps(
    fake({
      name: "Instant Pot chili",
      tags: ["instant-pot"],
      steps: ["Sauté beef and onion. Add tomatoes.", "High pressure 15 minutes.", "Natural release 10."],
    }),
  );
  assert.ok(steps.some((s) => /high pressure for 15/i.test(s)));
  assert.ok(steps.some((s) => /release naturally for 10/i.test(s)));
  assert.equal(steps.some((s) => /add natural release/i.test(s)), false);
});

test("drops a recipe named Ingredients", () => {
  assert.equal(polishRecipe(fake({ name: "Ingredients", steps: ["Mix."] })), null);
});

test("lahmacun-style fragments name the oven, the time, and what to do with the lemon", () => {
  const steps = polishSteps(
    fake({
      name: "Lahmacun",
      minutes: 30,
      plate: "roast",
      protein: "beef",
      ingredients: [
        { name: "pizza dough", qty: 1, unit: "lb", aisle: "Bakery" },
        { name: "ground beef or lamb", qty: 0.75, unit: "lb", aisle: "Meat & Seafood" },
        { name: "tomato paste", qty: 1, unit: "tbsp", aisle: "Pantry" },
        { name: "onion", qty: 0.5, unit: "", aisle: "Produce" },
        { name: "parsley", qty: 0.5, unit: "cup", aisle: "Produce" },
        { name: "lemon", qty: 1, unit: "", aisle: "Produce" },
      ],
      steps: [
        "Mix meat, paste, onion, parsley, spices. Spread thin on dough.",
        "Bake very hot 8 minutes. Lemon, roll.",
      ],
    }),
  );
  const blob = steps.join(" ");
  assert.ok(steps.length >= 4, steps.join("\n"));
  assert.ok(steps.every((s) => s.length >= 40), steps.join("\n"));
  assert.ok(/500\s*°F/.test(blob), blob);
  assert.ok(/8 minutes/i.test(blob), blob);
  assert.ok(/squeeze lemon/i.test(blob), blob);
  assert.ok(/roll it up/i.test(blob), blob);
  assert.equal(/bubbling at the edges/i.test(blob), false, blob);
  assert.equal(/add lemon, roll/i.test(blob), false, blob);
  assert.equal(/very hot 8 minutes/i.test(blob), false, blob);
  assert.ok(/pizza dough|dough out thin/i.test(blob), blob);
  assert.ok(/tomato paste/i.test(blob), blob);
});

test("noun-list finishes become real actions", () => {
  const zaalouk = polishSteps(
    fake({
      name: "Zaalouk",
      protein: "veg",
      plate: "bowl",
      ingredients: [
        { name: "eggplants", qty: 2, unit: "", aisle: "Produce" },
        { name: "tomatoes", qty: 3, unit: "", aisle: "Produce" },
        { name: "olive oil", qty: 0.25, unit: "cup", aisle: "Pantry" },
      ],
      steps: ["Cook eggplant and tomato down with garlic, cumin, paprika.", "Mash. Oil. Bread."],
    }),
  );
  const blob = zaalouk.join(" ");
  assert.equal(/\badd mash\b/i.test(blob), false, blob);
  assert.ok(/mash until/i.test(blob), blob);
  assert.ok(/olive oil|drizzle/i.test(blob), blob);
  assert.ok(/bread/i.test(blob), blob);

  const harira = polishSteps(
    fake({
      name: "Harira",
      protein: "veg",
      plate: "soup",
      ingredients: [
        { name: "brown lentils", qty: 0.75, unit: "cup", aisle: "Pantry" },
        { name: "vermicelli", qty: 0.5, unit: "cup", aisle: "Pantry" },
        { name: "cilantro", qty: 0.5, unit: "cup", aisle: "Produce" },
        { name: "lemon", qty: 1, unit: "", aisle: "Produce" },
      ],
      steps: ["Simmer lentils, chickpeas, tomato, celery 30 minutes.", "Noodles 5 minutes. Cilantro, lemon."],
    }),
  );
  const h = harira.join(" ");
  assert.ok(/noodles/i.test(h) && /5 minutes/i.test(h), h);
  assert.ok(/cilantro/i.test(h), h);
  assert.ok(/lemon/i.test(h), h);
  assert.equal(/add cilantro, lemon/i.test(h), false, h);
});

test("duck skillet follows the dish — no grocery dump on the flip", () => {
  const steps = polishSteps(
    fake({
      name: "Skillet duck breast",
      protein: "chicken",
      plate: "skillet",
      minutes: 25,
      ingredients: [
        { name: "duck breasts", qty: 2, unit: "", aisle: "Meat & Seafood" },
        { name: "shallot", qty: 1, unit: "", aisle: "Produce" },
        { name: "red wine", qty: 0.33, unit: "cup", aisle: "Pantry" },
        { name: "thyme", qty: 2, unit: "sprigs", aisle: "Produce" },
        { name: "butter", qty: 1, unit: "tbsp", aisle: "Dairy & Eggs" },
      ],
      steps: ["Score fat, salt. Cold pan, fat-side down 8 minutes. Flip 4.", "Shallot, wine, thyme, butter. Slice."],
    }),
  );
  const blob = steps.join("\n");
  assert.equal(/rest of the list/i.test(blob), false, blob);
  assert.equal(/flip 4 with/i.test(blob), false, blob);
  const flip = steps.find((s) => /\bflip\b/i.test(s));
  assert.ok(flip && /duck/i.test(flip) && /4 minutes/i.test(flip), blob);
  assert.equal(/red wine|shallot/i.test(flip ?? ""), false, flip);
  assert.ok(steps.some((s) => /shallot/i.test(s) && /wine/i.test(s)), blob);
  assert.ok(steps.some((s) => /8 minutes/i.test(s) && /skin-side down|cold skillet/i.test(s)), blob);
  assert.ok(steps.some((s) => /slice/i.test(s) && /duck/i.test(s)), blob);
  assert.ok(steps.every((s) => s.length >= 40), blob);
});

test("does not invent a duck pan sauce on a pudding", () => {
  const steps = polishSteps(
    fake({
      name: "Corn pudding",
      protein: "veg",
      plate: "dessert",
      minutes: 50,
      ingredients: [
        { name: "cornmeal", qty: 1, unit: "cup", aisle: "Pantry" },
        { name: "milk", qty: 2, unit: "cups", aisle: "Dairy & Eggs" },
        { name: "eggs", qty: 3, unit: "", aisle: "Dairy & Eggs" },
        { name: "butter", qty: 2, unit: "tbsp", aisle: "Dairy & Eggs" },
      ],
      steps: ["Meal with cold milk into hot milk.", "Thicken over water. Corn, eggs, butter. Water bath until firm."],
    }),
  );
  const blob = steps.join("\n");
  assert.equal(/pour off extra fat/i.test(blob), false, blob);
  assert.equal(/sauce looks glossy/i.test(blob), false, blob);
  assert.equal(/rest of the list/i.test(blob), false, blob);
});

test("Kentucky Hot Brown is an open-face turkey plate, not crumbled meat in a skillet", () => {
  const steps = polishSteps(
    fake({
      id: "ky-hot-brown",
      name: "Kentucky Hot Brown",
      protein: "turkey",
      plate: "toast",
      minutes: 25,
      ingredients: [
        { name: "turkey slices", qty: 12, unit: "oz", aisle: "Meat & Seafood" },
        { name: "white bread", qty: 4, unit: "slices", aisle: "Bakery" },
        { name: "parmesan", qty: 0.5, unit: "cup", aisle: "Dairy & Eggs" },
        { name: "milk", qty: 1.5, unit: "cups", aisle: "Dairy & Eggs" },
        { name: "bacon", qty: 8, unit: "slices", aisle: "Meat & Seafood" },
        { name: "tomato", qty: 2, unit: "", aisle: "Produce" },
      ],
      steps: ["Toast bread. Turkey. Pour Mornay (butter, flour, milk, parmesan). Bacon and tomato. Broil."],
    }),
  );
  const blob = steps.join("\n");
  assert.equal(/breaking (it|the meat) up/i.test(blob), false, blob);
  assert.equal(/until no pink remains/i.test(blob), false, blob);
  assert.equal(/use the ingredients on the list/i.test(blob), false, blob);
  assert.ok(/broil/i.test(blob), blob);
  assert.ok(/turkey slices/i.test(blob), blob);
  assert.ok(/toast/i.test(blob) && /white bread/i.test(blob), blob);
  assert.ok(/bacon/i.test(blob), blob);
  assert.ok(/parmesan|sauce/i.test(blob), blob);
  assert.ok(steps.every((s) => s.length >= 40), blob);
});

test("junk fragments are not kept as the method", () => {
  const steps = polishSteps(
    fake({
      name: "Skillet duck breast",
      protein: "chicken",
      plate: "skillet",
      ingredients: [
        { name: "duck breasts", qty: 2, unit: "", aisle: "Meat & Seafood" },
        { name: "shallot", qty: 1, unit: "", aisle: "Produce" },
        { name: "red wine", qty: 0.5, unit: "cup", aisle: "Pantry" },
        { name: "butter", qty: 2, unit: "tbsp", aisle: "Dairy & Eggs" },
      ],
      steps: [
        "Pat duck dry and score the skin in a crosshatch, cutting the fat not the meat.",
        "Set skin-side down in a cold skillet. Cook 8 minutes until the fat renders.",
        "Flip 4 with the duck breasts, shallot, red wine, and the rest of the list.",
        "Use the ingredients on the list.",
      ],
    }),
  );
  const blob = steps.join("\n");
  assert.equal(/rest of the list/i.test(blob), false, blob);
  assert.equal(/ingredients on the list/i.test(blob), false, blob);
  assert.equal(/flip 4 with/i.test(blob), false, blob);
  assert.ok(/score the skin/i.test(blob), blob);
});

test("lemon pepper chicken thighs roast the meat, not the black pepper, with plural grammar", () => {
  const steps = polishSteps(
    fake({
      id: "hp-chicken-prep",
      name: "Lemon pepper chicken thighs",
      protein: "chicken",
      plate: "roast",
      minutes: 30,
      ingredients: [
        { name: "chicken thighs", qty: 2, unit: "lb", aisle: "Meat & Seafood" },
        { name: "broccoli", qty: 1.5, unit: "lb", aisle: "Produce" },
        { name: "lemon", qty: 1, unit: "", aisle: "Produce" },
        { name: "black pepper", qty: 1, unit: "tsp", aisle: "Herbs & Spices" },
        { name: "olive oil", qty: 2, unit: "tbsp", aisle: "Pantry" },
        { name: "garlic powder", qty: 1, unit: "tsp", aisle: "Herbs & Spices" },
      ],
      steps: ["Toss chicken and broccoli with oil, lemon, pepper, garlic, salt.", "Roast 425°F 22 minutes. Box."],
    }),
  );
  const blob = steps.join("\n");
  assert.equal(/chicken thighs is /i.test(blob), false, blob);
  assert.equal(/scatter the broccoli and black pepper/i.test(blob), false, blob);
  assert.equal(/taste lemon pepper/i.test(blob), false, blob);
  assert.ok(/thighs are cooked through/i.test(blob), blob);
  assert.ok(/broccoli/i.test(blob), blob);
  assert.ok(/425/.test(blob), blob);
});

test("lentil pasta bolognese is a real sauce, not a lone taste-for-salt step", () => {
  const steps = polishSteps(
    fake({
      id: "hp-lentil-pasta",
      name: "Lentil pasta bolognese",
      protein: "veg",
      plate: "pasta",
      minutes: 25,
      ingredients: [
        { name: "lentil pasta", qty: 12, unit: "oz", aisle: "Pantry" },
        { name: "lentils", qty: 1, unit: "can", aisle: "Pantry" },
        { name: "mushrooms", qty: 8, unit: "oz", aisle: "Produce" },
        { name: "marinara", qty: 2, unit: "cups", aisle: "Pantry" },
        { name: "onion", qty: 1, unit: "", aisle: "Produce" },
        { name: "parmesan", qty: 1, unit: "oz", aisle: "Dairy & Eggs" },
      ],
      steps: ["Sauté onion, mushroom. Lentils, marinara 10 minutes.", "Boil pasta. Toss, cheese."],
    }),
  );
  const blob = steps.join("\n");
  assert.equal(/^taste for salt\. serve hot\.$/im.test(blob), false, blob);
  assert.ok(/lentil pasta/i.test(blob), blob);
  assert.ok(/marinara/i.test(blob), blob);
  assert.ok(/parmesan/i.test(blob), blob);
  assert.ok(steps.every((s) => s.length >= 40), blob);
});

test("affogato is ice cream and espresso, never cake batter", () => {
  const steps = polishSteps(
    fake({
      id: "it-affogato",
      name: "Affogato",
      protein: "veg",
      plate: "dessert",
      minutes: 5,
      tags: ["dessert"],
      ingredients: [
        { name: "vanilla ice cream", qty: 4, unit: "scoops", aisle: "Frozen" },
        { name: "espresso", qty: 4, unit: "shots", aisle: "Other" },
      ],
      steps: ["Scoop ice cream into cups.", "Pour hot espresso over. Eat at once."],
    }),
  );
  const blob = steps.join("\n");
  assert.equal(/\bflour\b/i.test(blob), false, blob);
  assert.equal(/dry pockets|mix the batter/i.test(blob), false, blob);
  assert.ok(/ice cream/i.test(blob), blob);
  assert.ok(/espresso/i.test(blob), blob);
  assert.ok(/scoop/i.test(blob), blob);
});

test("panna cotta is chilled cream, not a baked cake", () => {
  const steps = polishSteps(
    fake({
      id: "it-panna-cotta",
      name: "Vanilla panna cotta",
      protein: "veg",
      plate: "dessert",
      minutes: 20,
      tags: ["dessert"],
      ingredients: [
        { name: "cream", qty: 2, unit: "cups", aisle: "Dairy & Eggs" },
        { name: "sugar", qty: 0.33, unit: "cup", aisle: "Pantry" },
        { name: "vanilla", qty: 1, unit: "tsp", aisle: "Pantry" },
        { name: "gelatin", qty: 2, unit: "tsp", aisle: "Pantry" },
        { name: "berries", qty: 1, unit: "cup", aisle: "Produce" },
      ],
      steps: ["Bloom gelatin. Warm cream. Chill."],
    }),
  );
  const blob = steps.join("\n");
  assert.equal(/bake|oven/i.test(blob), false, blob);
  assert.ok(/gelatin/i.test(blob), blob);
  assert.ok(/chill/i.test(blob), blob);
});

test("banana nice cream is blended fruit, never flour", () => {
  const steps = polishSteps(
    fake({
      id: "vn-nice-cream",
      name: "Banana nice cream",
      protein: "veg",
      plate: "dessert",
      minutes: 5,
      tags: ["dessert"],
      ingredients: [
        { name: "frozen bananas", qty: 4, unit: "", aisle: "Frozen" },
        { name: "cocoa powder", qty: 1, unit: "tbsp", aisle: "Pantry" },
        { name: "peanut butter", qty: 1, unit: "tbsp", aisle: "Pantry" },
      ],
      steps: ["Blend frozen banana until soft-serve.", "Cocoa or peanut if using. Eat at once."],
    }),
  );
  const blob = steps.join("\n");
  assert.equal(/\bflour\b/i.test(blob), false, blob);
  assert.ok(/banana/i.test(blob), blob);
  assert.ok(/blend/i.test(blob), blob);
});

test("chess pie bakes — it is not a no-bake flour warning", () => {
  const steps = polishSteps(
    fake({
      id: "so-chess-pie",
      name: "Chess pie",
      protein: "veg",
      plate: "dessert",
      minutes: 45,
      tags: ["dessert"],
      ingredients: [
        { name: "butter", qty: 0.5, unit: "cup", aisle: "Dairy & Eggs" },
        { name: "sugar", qty: 1.5, unit: "cups", aisle: "Pantry" },
        { name: "egg yolks", qty: 4, unit: "", aisle: "Dairy & Eggs" },
        { name: "flour", qty: 1, unit: "tbsp", aisle: "Pantry" },
        { name: "pie crust", qty: 1, unit: "", aisle: "Bakery" },
      ],
      steps: ["Mix filling. Bake."],
    }),
  );
  const blob = steps.join("\n");
  assert.equal(/do not add flour/i.test(blob), false, blob);
  assert.ok(/bake/i.test(blob), blob);
});

test("creamed chipped beef is a white sauce on toast, not crumbled skillet meat", () => {
  const steps = polishSteps(
    fake({
      id: "vh-ww2-chipped-beef",
      name: "Creamed chipped beef",
      protein: "beef",
      plate: "toast",
      minutes: 20,
      ingredients: [
        { name: "dried beef", qty: 8, unit: "oz", aisle: "Meat & Seafood" },
        { name: "butter", qty: 3, unit: "tbsp", aisle: "Dairy & Eggs" },
        { name: "flour", qty: 3, unit: "tbsp", aisle: "Pantry" },
        { name: "milk", qty: 2, unit: "cups", aisle: "Dairy & Eggs" },
        { name: "white toast", qty: 8, unit: "slices", aisle: "Bakery" },
      ],
      steps: ["Rinse beef. White sauce. Over toast."],
    }),
  );
  const blob = steps.join("\n");
  assert.equal(/until no pink/i.test(blob), false, blob);
  assert.equal(/break(ing)? (it|the meat) up/i.test(blob), false, blob);
  assert.ok(/dried beef/i.test(blob), blob);
  assert.ok(/toast/i.test(blob), blob);
  assert.ok(/milk/i.test(blob), blob);
});

test("gefilte fish is poached, not fried in batter", () => {
  const steps = polishSteps(
    fake({
      id: "vh-jw-gefilte",
      name: "Gefilte fish",
      protein: "fish",
      plate: "fish",
      minutes: 90,
      ingredients: [
        { name: "white fish fillets", qty: 1, unit: "lb", aisle: "Meat & Seafood" },
        { name: "onion", qty: 2, unit: "", aisle: "Produce" },
        { name: "eggs", qty: 2, unit: "", aisle: "Dairy & Eggs" },
        { name: "matzo meal", qty: 0.33, unit: "cup", aisle: "Pantry" },
        { name: "carrot", qty: 2, unit: "", aisle: "Produce" },
      ],
      steps: ["Grind fish. Shape. Poach."],
    }),
  );
  const blob = steps.join("\n");
  assert.equal(/\bfry\b/i.test(blob), false, blob);
  assert.ok(/poach/i.test(blob), blob);
  assert.ok(/horseradish|carrot/i.test(blob), blob);
});

test("corn sticks keep the book's 10 to 12 minutes at 500°F", () => {
  const steps = polishSteps(
    fake({
      id: "so-corn-sticks",
      name: "Corn sticks",
      protein: "veg",
      plate: "toast",
      minutes: 20,
      tags: ["southern", "vintage"],
      ingredients: [
        { name: "cornmeal", qty: 2, unit: "cups", aisle: "Pantry" },
        { name: "milk", qty: 1, unit: "cup", aisle: "Dairy & Eggs" },
        { name: "egg", qty: 1, unit: "", aisle: "Dairy & Eggs" },
        { name: "lard", qty: 1, unit: "tbsp", aisle: "Pantry" },
        { name: "baking powder", qty: 2, unit: "tsp", aisle: "Pantry" },
      ],
      steps: ["Beat all. Greased stick pans. 500°F 10 to 12 minutes."],
    }),
  );
  const blob = steps.join("\n");
  assert.ok(/500/.test(blob), blob);
  assert.ok(/10 to 12 minutes/i.test(blob), blob);
  assert.ok(/bake/i.test(blob), blob);
  assert.equal(/cook 500/i.test(blob), false, blob);
});

test("waffle and fold fragments keep the rest of the book's line", () => {
  const waffles = polishSteps(
    fake({
      id: "so-rice-flour-waffles",
      name: "Rice flour waffles",
      protein: "veg",
      plate: "toast",
      minutes: 30,
      tags: ["southern", "vintage"],
      ingredients: [
        { name: "cooked hominy", qty: 1, unit: "cup", aisle: "Pantry" },
        { name: "eggs", qty: 2, unit: "", aisle: "Dairy & Eggs" },
        { name: "rice flour", qty: 1, unit: "cup", aisle: "Pantry" },
        { name: "flour", qty: 0.5, unit: "cup", aisle: "Pantry" },
        { name: "milk", qty: 1, unit: "cup", aisle: "Dairy & Eggs" },
        { name: "butter", qty: 2, unit: "tbsp", aisle: "Dairy & Eggs" },
      ],
      steps: [
        "Beat hominy into eggs. Sift dry, add milk, then hominy, then butter.",
        "Hot iron a little longer than wheat waffles.",
      ],
    }),
  );
  const w = waffles.join("\n");
  assert.ok(/hominy/i.test(w), w);
  assert.ok(/milk/i.test(w), w);
  assert.ok(/wheat/i.test(w), w);

  const brownies = polishSteps(
    fake({
      id: "so-pecan-brownies",
      name: "Georgia pecan brownies",
      protein: "veg",
      plate: "dessert",
      minutes: 35,
      tags: ["southern", "dessert"],
      ingredients: [
        { name: "chopped pecans", qty: 1, unit: "cup", aisle: "Pantry" },
        { name: "bread crumbs", qty: 0.5, unit: "cup", aisle: "Bakery" },
        { name: "egg whites", qty: 2, unit: "", aisle: "Dairy & Eggs" },
        { name: "sugar", qty: 1, unit: "cup", aisle: "Pantry" },
      ],
      steps: ["Beat whites with sugar. Fold nuts and crumbs.", "Drop on a sheet. Bake 350°F 15 minutes."],
    }),
  );
  const b = brownies.join("\n");
  assert.equal(/add the fold/i.test(b), false, b);
  assert.ok(/fold in the nuts|fold in nuts/i.test(b), b);
});

test("mint julep keeps garnish and does not stir twice", () => {
  const steps = polishSteps(
    fake({
      id: "so-mint-julep",
      name: "Mint julep",
      protein: "veg",
      plate: "bowl",
      minutes: 10,
      tags: ["southern", "drink"],
      ingredients: [
        { name: "bourbon", qty: 3, unit: "oz", aisle: "Other" },
        { name: "fresh mint", qty: 8, unit: "sprigs", aisle: "Produce" },
        { name: "sugar", qty: 2, unit: "lumps", aisle: "Pantry" },
        { name: "cracked ice", qty: 1, unit: "cup", aisle: "Other" },
      ],
      steps: ["Dissolve sugar in a little water with mint. Ice the glass. Pour bourbon. Fresh mint. Do not stir."],
    }),
  );
  const blob = steps.join("\n");
  assert.equal(/stir in the fresh mint/i.test(blob) && /do not stir/i.test(blob), false, blob);
  assert.ok(/mint/i.test(blob), blob);
  assert.ok(/bourbon/i.test(blob), blob);
});

test("shrimp paste is sliced from a mold, not across the grain like a steak", () => {
  const steps = polishSteps(
    fake({
      id: "so-shrimp-paste",
      name: "Shrimp paste",
      protein: "seafood",
      plate: "toast",
      minutes: 30,
      tags: ["southern"],
      ingredients: [
        { name: "cooked shrimp", qty: 1, unit: "lb", aisle: "Meat & Seafood" },
        { name: "butter", qty: 2, unit: "tbsp", aisle: "Dairy & Eggs" },
        { name: "mace", qty: 0.25, unit: "tsp", aisle: "Herbs & Spices" },
      ],
      steps: ["Grind shrimp. Warm with butter, salt, pepper, mace. Press hard into a mold. Chill. Slice."],
    }),
  );
  const blob = steps.join("\n");
  assert.equal(/across the grain/i.test(blob), false, blob);
  assert.equal(/pan juices/i.test(blob), false, blob);
  assert.ok(/mold/i.test(blob), blob);
});

test("tea scones stir egg and milk into the dough, they are not served with eggs", () => {
  const steps = polishSteps(
    fake({
      id: "so-tea-scones",
      name: "Four o'clock tea scones",
      protein: "veg",
      plate: "toast",
      minutes: 25,
      tags: ["southern"],
      ingredients: [
        { name: "pastry flour", qty: 2, unit: "cups", aisle: "Pantry" },
        { name: "sugar", qty: 2, unit: "tbsp", aisle: "Pantry" },
        { name: "baking powder", qty: 4, unit: "tsp", aisle: "Pantry" },
        { name: "butter", qty: 3, unit: "tbsp", aisle: "Dairy & Eggs" },
        { name: "egg", qty: 1, unit: "", aisle: "Dairy & Eggs" },
        { name: "milk", qty: 0.75, unit: "cup", aisle: "Dairy & Eggs" },
      ],
      steps: ["Sift dry. Butter in. Egg and milk. Cut rounds, butter, sugar. 400°F 15 minutes."],
    }),
  );
  const blob = steps.join("\n");
  assert.equal(/serve with egg/i.test(blob), false, blob);
  assert.ok(/400/.test(blob), blob);
  assert.ok(/bake/i.test(blob), blob);
});

test("hamburger bacon roast wraps the loaf, not each one", () => {
  const steps = polishSteps(
    fake({
      id: "so-hamburger-bacon-roast",
      name: "Hamburger-bacon roast",
      protein: "beef",
      plate: "roast",
      minutes: 55,
      tags: ["southern"],
      ingredients: [
        { name: "ground beef", qty: 2, unit: "lb", aisle: "Meat & Seafood" },
        { name: "bacon", qty: 8, unit: "slices", aisle: "Meat & Seafood" },
        { name: "onion", qty: 1, unit: "", aisle: "Produce" },
        { name: "egg", qty: 1, unit: "", aisle: "Dairy & Eggs" },
        { name: "breadcrumb", qty: 0.5, unit: "cup", aisle: "Pantry" },
      ],
      steps: ["Mix beef, onion, egg, crumbs, salt. Shape a loaf.", "Wrap in bacon. Roast 375°F about 45 minutes."],
    }),
  );
  const blob = steps.join("\n");
  assert.equal(/wrap each one/i.test(blob), false, blob);
  assert.ok(/loaf/i.test(blob) && /bacon/i.test(blob), blob);
});

test("strawberry shortcake is split and filled, cream is served not stirred off the heat", () => {
  const steps = polishSteps(
    fake({
      id: "so-strawberry-shortcake",
      name: "Old-fashioned strawberry shortcake",
      protein: "veg",
      plate: "dessert",
      minutes: 30,
      tags: ["southern", "dessert"],
      ingredients: [
        { name: "flour", qty: 2, unit: "cups", aisle: "Pantry" },
        { name: "baking powder", qty: 4, unit: "tsp", aisle: "Pantry" },
        { name: "butter", qty: 2, unit: "tbsp", aisle: "Dairy & Eggs" },
        { name: "milk", qty: 0.75, unit: "cup", aisle: "Dairy & Eggs" },
        { name: "strawberries", qty: 1, unit: "quart", aisle: "Produce" },
      ],
      steps: [
        "Biscuit dough in two cakes, stacked. 450°F 15–20 minutes.",
        "Split, butter, crushed sweetened berries. Cream.",
      ],
    }),
  );
  const blob = steps.join("\n");
  assert.equal(/stir in the cream off the heat/i.test(blob), false, blob);
  assert.equal(/stir in the split/i.test(blob), false, blob);
  assert.ok(/berries|strawberry/i.test(blob), blob);
});

test("suckling pig is served with yams, not stirred in", () => {
  const steps = polishSteps(
    fake({
      id: "so-suckling-pig",
      name: "Roast suckling pig",
      protein: "pork",
      plate: "roast",
      minutes: 240,
      tags: ["southern"],
      ingredients: [
        { name: "suckling pig", qty: 1, unit: "", aisle: "Meat & Seafood" },
        { name: "breadcrumb stuffing", qty: 4, unit: "cups", aisle: "Bakery" },
        { name: "apple", qty: 1, unit: "", aisle: "Produce" },
        { name: "salt", qty: 2, unit: "tbsp", aisle: "Herbs & Spices" },
      ],
      steps: [
        "Scald, scrape, clean, chill. Stuff and sew.",
        "Roast 350°F 3–4 hours. Apple in the mouth. Candied yams and apple sauce.",
      ],
    }),
  );
  const blob = steps.join("\n");
  assert.equal(/stir in the candied yams/i.test(blob), false, blob);
  assert.ok(/apple/i.test(blob), blob);
  assert.ok(/yam|apple sauce/i.test(blob), blob);
});

test("fold in does not say Fold in the the rice", () => {
  const steps = polishSteps(
    fake({
      id: "so-hopping-john",
      name: "Hopping John",
      protein: "pork",
      plate: "bowl",
      minutes: 120,
      tags: ["southern"],
      ingredients: [
        { name: "dried field peas", qty: 2, unit: "cups", aisle: "Pantry" },
        { name: "pork", qty: 0.25, unit: "lb", aisle: "Meat & Seafood" },
        { name: "cooked rice", qty: 1, unit: "cup", aisle: "Pantry" },
        { name: "butter", qty: 2, unit: "tbsp", aisle: "Dairy & Eggs" },
      ],
      steps: [
        "Soak peas overnight. Cook with pork until soft, a little liquor left.",
        "Fold in the rice, salt, pepper, butter.",
      ],
    }),
  );
  const blob = steps.join("\n");
  assert.equal(/the the /i.test(blob), false, blob);
  assert.ok(/rice/i.test(blob), blob);
  assert.ok(/fold in/i.test(blob), blob);
});

test("listed cups of water are never a splash", () => {
  const steps = polishSteps(
    fake({
      id: "cp-camp-coffee",
      name: "Cowboy coffee",
      protein: "veg",
      plate: "bowl",
      minutes: 10,
      ingredients: [
        { name: "coffee grounds", qty: 0.5, unit: "cup", aisle: "Pantry" },
        { name: "water", qty: 4, unit: "cups", aisle: "Other" },
        { name: "cold water", qty: 2, unit: "tbsp", aisle: "Other" },
        { name: "salt", qty: 1, unit: "pinch", aisle: "Herbs & Spices" },
      ],
      steps: [
        "Bring the 4 cups of water to a boil in the pot.",
        "Stir in the ½ cup coffee grounds and the pinch of salt. Take the pot off the heat and let it sit 4 minutes.",
        "Pour the 2 tablespoons of cold water over the top to settle the grounds. Pour the coffee slowly, leaving the grounds in the pot.",
      ],
    }),
  );
  const blob = steps.join("\n");
  assert.ok(/4 cups of water/i.test(blob), blob);
  assert.equal(/splash of water/i.test(blob), false, blob);
  assert.ok(/½ cup|0\.5 cup|1\/2 cup/i.test(blob), blob);
});

test("a splash of water becomes the listed cups", () => {
  const steps = polishSteps(
    fake({
      id: "test-coffee-pot",
      name: "Camp coffee pot",
      protein: "veg",
      plate: "bowl",
      minutes: 10,
      ingredients: [
        { name: "coffee grounds", qty: 0.5, unit: "cup", aisle: "Pantry" },
        { name: "water", qty: 2, unit: "cups", aisle: "Other" },
      ],
      steps: ["Bring a splash of water to a boil with the coffee grounds.", "Steep 4 minutes. Pour slowly."],
    }),
  );
  const blob = steps.join("\n");
  assert.ok(/2 cups of water/i.test(blob), blob);
  assert.equal(/splash of water/i.test(blob), false, blob);
});

test("banana pancakes stay banana — no flour, no crêpe rest", () => {
  const steps = polishSteps(
    fake({
      id: "gf-banana-pancakes",
      name: "Three-ingredient banana pancakes",
      protein: "eggs",
      plate: "toast",
      minutes: 15,
      ingredients: [
        { name: "ripe bananas", qty: 2, unit: "", aisle: "Produce" },
        { name: "eggs", qty: 3, unit: "", aisle: "Dairy & Eggs" },
        { name: "cinnamon", qty: 0.5, unit: "tsp", aisle: "Herbs & Spices" },
        { name: "butter", qty: 1, unit: "tbsp", aisle: "Dairy & Eggs" },
      ],
      steps: [
        "Mash the 2 ripe bananas with the 3 eggs and the ½ teaspoon of cinnamon until the batter is even. There is no flour in this batter.",
        "Heat the 1 tablespoon of butter in a skillet over low heat.",
        "Drop small pancakes and cook until they set, then flip gently. Serve hot.",
      ],
    }),
  );
  const blob = steps.join("\n");
  assert.ok(/banana/i.test(blob), blob);
  assert.ok(/egg/i.test(blob), blob);
  assert.ok(/cinnamon/i.test(blob), blob);
  assert.equal(/blend the flour|the flour, eggs, milk/i.test(blob), false, blob);
  assert.equal(/rest 15 minutes/i.test(blob), false, blob);
  assert.equal(/fold the crêpe|fold the crepe/i.test(blob), false, blob);
});

test("German apple pancake bakes, it does not fold like a crêpe", () => {
  const steps = polishSteps(
    fake({
      id: "ap-pancake",
      name: "German apple pancake",
      protein: "eggs",
      plate: "skillet",
      minutes: 30,
      ingredients: [
        { name: "apples", qty: 3, unit: "", aisle: "Produce" },
        { name: "eggs", qty: 4, unit: "", aisle: "Dairy & Eggs" },
        { name: "milk", qty: 0.75, unit: "cup", aisle: "Dairy & Eggs" },
        { name: "flour", qty: 0.75, unit: "cup", aisle: "Pantry" },
        { name: "butter", qty: 3, unit: "tbsp", aisle: "Dairy & Eggs" },
        { name: "cinnamon", qty: 1, unit: "tsp", aisle: "Herbs & Spices" },
      ],
      steps: [
        "Heat the oven to 425°F. Sauté the 3 apples in 2 tablespoons of the butter in an oven-safe skillet until they soften, 6–8 minutes. Sprinkle the 1 teaspoon of cinnamon.",
        "Whisk the 4 eggs with the ¾ cup of milk and the ¾ cup of flour to a thin batter.",
        "Add the last tablespoon of butter to the skillet. Pour the batter over the apples.",
        "Bake at 425°F for 18 minutes, until puffed and gold. Serve with lemon and sugar.",
      ],
    }),
  );
  const blob = steps.join("\n");
  assert.ok(/425/.test(blob), blob);
  assert.ok(/bake/i.test(blob), blob);
  assert.ok(/apple/i.test(blob), blob);
  assert.ok(/flour/i.test(blob), blob);
  assert.equal(/fold the crêpe|fold the crepe/i.test(blob), false, blob);
  assert.equal(/rest 15 minutes/i.test(blob), false, blob);
});

test("chili names chili powder and cumin, not spices", () => {
  const steps = polishSteps(
    fake({
      id: "beef-chili",
      name: "Weeknight beef chili",
      protein: "beef",
      plate: "soup",
      minutes: 55,
      ingredients: [
        { name: "ground beef", qty: 1.5, unit: "lb", aisle: "Meat & Seafood" },
        { name: "kidney beans", qty: 2, unit: "cans", aisle: "Pantry" },
        { name: "crushed tomatoes", qty: 1, unit: "can", aisle: "Pantry" },
        { name: "onion", qty: 1, unit: "", aisle: "Produce" },
        { name: "chili powder", qty: 2, unit: "tbsp", aisle: "Herbs & Spices" },
        { name: "cumin", qty: 1, unit: "tsp", aisle: "Herbs & Spices" },
        { name: "cheddar", qty: 4, unit: "oz", aisle: "Dairy & Eggs" },
      ],
      steps: [
        "Brown the 1½ lb of ground beef with the chopped onion. Drain extra fat.",
        "Add spices, tomatoes, beans, and a pinch of salt. Simmer 35 minutes.",
        "Serve with cheddar.",
      ],
    }),
  );
  const blob = steps.join("\n");
  assert.ok(/chili powder/i.test(blob), blob);
  assert.ok(/cumin/i.test(blob), blob);
  assert.ok(/2 tablespoons of chili powder/i.test(blob), blob);
  assert.equal(/\bspices\b/i.test(blob), false, blob);
});

test("mint tea names 2 cups of sugar and 1 cup of water", () => {
  const steps = polishSteps(
    fake({
      id: "so-mint-tea",
      name: "Mint tea",
      protein: "veg",
      plate: "bowl",
      minutes: 20,
      tags: ["southern", "drink"],
      ingredients: [
        { name: "black tea", qty: 6, unit: "cups", aisle: "Pantry" },
        { name: "sugar", qty: 2, unit: "cups", aisle: "Pantry" },
        { name: "water", qty: 1, unit: "cup", aisle: "Other" },
        { name: "oranges", qty: 6, unit: "", aisle: "Produce" },
        { name: "fresh mint", qty: 1, unit: "bunch", aisle: "Produce" },
      ],
      steps: [
        "Boil the sugar, a little water, and orange rind 5 minutes to a syrup.",
        "Steep crushed mint in the hot syrup, then strain.",
        "Combine the strong tea, orange juice, crushed ice, and mint syrup.",
      ],
    }),
  );
  const blob = steps.join("\n");
  assert.ok(/2 cups of sugar/i.test(blob), blob);
  assert.ok(/1 cup of water/i.test(blob), blob);
  assert.equal(/a little water/i.test(blob), false, blob);
  assert.equal(/splash of water/i.test(blob), false, blob);
});

test("veg plates never say the main ingredient", () => {
  const steps = polishSteps(
    fake({
      id: "chana-masala",
      name: "Chana masala",
      protein: "veg",
      plate: "curry",
      minutes: 35,
      ingredients: [
        { name: "chickpeas", qty: 2, unit: "cans", aisle: "Pantry" },
        { name: "onion", qty: 1, unit: "", aisle: "Produce" },
        { name: "garam masala", qty: 1, unit: "tsp", aisle: "Herbs & Spices" },
        { name: "tomato", qty: 2, unit: "", aisle: "Produce" },
        { name: "ginger", qty: 1, unit: "tbsp", aisle: "Produce" },
      ],
      steps: ["Cook onion. Add spices. Chickpeas and a splash of water. Simmer 15."],
    }),
  );
  const blob = steps.join("\n");
  assert.equal(/main ingredient/i.test(blob), false, blob);
  assert.equal(/the the /i.test(blob), false, blob);
  assert.ok(/chickpea/i.test(blob), blob);
  assert.ok(/garam masala/i.test(blob), blob);
});

test("chicken-fried steak is a real fry, gravy, and mash — not Potatoes.", () => {
  const steps = polishSteps(
    fake({
      id: "ok-chicken-fried-steak",
      name: "Oklahoma chicken-fried steak",
      protein: "beef",
      plate: "skillet",
      minutes: 45,
      tags: ["oklahoma", "usa"],
      ingredients: [
        { name: "cubed steak", qty: 4, unit: "", aisle: "Meat & Seafood" },
        { name: "flour", qty: 1.5, unit: "cups", aisle: "Pantry" },
        { name: "buttermilk", qty: 1, unit: "cup", aisle: "Dairy & Eggs" },
        { name: "milk", qty: 2, unit: "cups", aisle: "Dairy & Eggs" },
        { name: "potato", qty: 4, unit: "", aisle: "Produce" },
        { name: "neutral oil", qty: 1.5, unit: "cups", aisle: "Pantry" },
        { name: "butter", qty: 4, unit: "tbsp", aisle: "Dairy & Eggs" },
        { name: "black pepper", qty: 2, unit: "tsp", aisle: "Herbs & Spices" },
      ],
      steps: ["Dredge and fry steaks. Gravy from the drippings. Potatoes."],
    }),
  );
  const blob = steps.join("\n");
  assert.equal(/gravy from the drippings/i.test(blob), false, blob);
  assert.equal(/^potatoes\.?$/im.test(blob), false, blob);
  assert.ok(/dredge|flour/i.test(blob), blob);
  assert.ok(/buttermilk/i.test(blob), blob);
  assert.ok(/gravy|drippings/i.test(blob), blob);
  assert.ok(/mash|potato/i.test(blob), blob);
  assert.ok(steps.every((s) => s.length >= 36), blob);
  assert.ok(steps.length >= 4, blob);
});

test("cook steps scale with the household so oil matches the list", () => {
  const ings = [
    { name: "flour", qty: 2, unit: "cups" },
    { name: "boiling water", qty: 0.75, unit: "cup" },
    { name: "scallions", qty: 1, unit: "cup" },
    { name: "neutral oil", qty: 3, unit: "tbsp" },
    { name: "sesame oil", qty: 1, unit: "tsp" },
    { name: "salt", qty: 1, unit: "tsp" },
  ];
  const steps = [
    "Stir the ¾ cup of boiling water into the 2 cups of flour and the 1 teaspoon of salt to a shaggy dough. Knead until smooth. Rest 20 minutes.",
    "Roll thin. Brush with the 3 tablespoons of neutral oil and the 1 teaspoon of sesame oil. Scatter the 1 cup of scallions. Roll up, coil, and roll flat again.",
    "Pan-fry in a hot skillet until blistered and gold, 3–4 minutes a side. Cut into wedges. Oven at 425°F if you must.",
  ];
  const scaled = scaleMethodSteps(steps, ings, 2, 4);
  const blob = scaled.join("\n");
  assert.match(blob, /1½ tablespoons of neutral oil/);
  assert.equal(/\b3 tablespoons of neutral oil/.test(blob), false, blob);
  assert.match(blob, /1 cup of flour/);
  assert.equal(/\b2 cups of flour/.test(blob), false, blob);
  assert.match(blob, /½ teaspoon of sesame oil/);
  assert.match(blob, /½ cup of boiling water/);
  assert.match(blob, /3–4 minutes a side/);
  assert.match(blob, /Rest 20 minutes/);
  assert.match(blob, /425°F/);
  const same = scaleMethodSteps(steps, ings, 4, 4);
  assert.equal(same[1], steps[1]);
});

test("packed 2-step weeknights unpack into followable cook cards", () => {
  const steps = polishSteps(
    fake({
      id: "miso-butter-cod",
      name: "Miso butter cod",
      protein: "fish",
      plate: "fish",
      minutes: 20,
      ingredients: [
        { name: "cod", qty: 1.5, unit: "lb", aisle: "Meat & Seafood" },
        { name: "white miso", qty: 2, unit: "tbsp", aisle: "Pantry" },
        { name: "butter", qty: 2, unit: "tbsp", aisle: "Dairy & Eggs" },
        { name: "honey", qty: 1, unit: "tsp", aisle: "Pantry" },
        { name: "bok choy", qty: 4, unit: "", aisle: "Produce" },
      ],
      steps: [
        "Mash miso with soft butter and honey. Spread on cod.",
        "Broil 8–10 minutes. Steam bok choy alongside.",
      ],
    }),
  );
  const blob = steps.join("\n");
  assert.ok(steps.length >= 3, blob);
  assert.equal(/soft the \d/i.test(blob), false, blob);
  assert.ok(/miso/i.test(blob), blob);
  assert.ok(/broil/i.test(blob), blob);
  assert.ok(/bok choy/i.test(blob), blob);
  assert.ok(steps.every((s) => s.length >= 24), blob);
});

test("warm milk stays a verb, fold gently is not fold in the gently", () => {
  const warm = polishSteps(
    fake({
      id: "ky-hot-brown",
      name: "Kentucky Hot Brown",
      protein: "turkey",
      plate: "toast",
      ingredients: [
        { name: "turkey slices", qty: 12, unit: "oz", aisle: "Meat & Seafood" },
        { name: "white bread", qty: 4, unit: "slices", aisle: "Bakery" },
        { name: "parmesan", qty: 0.5, unit: "cup", aisle: "Dairy & Eggs" },
        { name: "milk", qty: 1.5, unit: "cups", aisle: "Dairy & Eggs" },
        { name: "bacon", qty: 8, unit: "slices", aisle: "Meat & Seafood" },
        { name: "tomato", qty: 2, unit: "", aisle: "Produce" },
      ],
      steps: ["Toast bread. Warm the milk. Stir in parmesan. Turkey. Broil."],
    }),
  ).join("\n");
  assert.equal(/the \S+ cups of [Ww]arm milk/i.test(warm), false, warm);
  assert.ok(/warm the .+ milk/i.test(warm), warm);
  assert.equal(/\bthe the\b/i.test(warm), false, warm);

  const fold = polishSteps(
    fake({
      id: "fs-crab-cakes",
      name: "Maryland-style crab cakes",
      protein: "fish",
      plate: "skillet",
      ingredients: [
        { name: "lump crab", qty: 1, unit: "lb", aisle: "Meat & Seafood" },
        { name: "mayonnaise", qty: 3, unit: "tbsp", aisle: "Pantry" },
        { name: "egg", qty: 1, unit: "", aisle: "Dairy & Eggs" },
        { name: "cracker crumbs", qty: 0.5, unit: "cup", aisle: "Bakery" },
      ],
      steps: ["Mix crab, mayo, egg, crumbs. Fold gently so the lumps stay. Chill. Cakes. Skillet."],
    }),
  ).join("\n");
  assert.equal(/fold in the gently/i.test(fold), false, fold);
});

test("bread is toasted, not stirred into the greens", () => {
  const steps = polishSteps(
    fake({
      id: "egg-fried-greens",
      name: "Eggs over garlicky greens",
      protein: "eggs",
      plate: "skillet",
      minutes: 20,
      ingredients: [
        { name: "eggs", qty: 4, unit: "", aisle: "Dairy & Eggs" },
        { name: "kale or chard", qty: 1, unit: "bunch", aisle: "Produce" },
        { name: "garlic", qty: 3, unit: "cloves", aisle: "Produce" },
        { name: "olive oil", qty: 2, unit: "tbsp", aisle: "Pantry" },
        { name: "sourdough", qty: 4, unit: "slices", aisle: "Bakery" },
      ],
      steps: [
        "Wilt greens with garlic in olive oil. Season well.",
        "Fry eggs in the same pan. Serve on toast.",
      ],
    }),
  );
  const blob = steps.join("\n");
  assert.equal(/wilt[\s\S]{0,80}sourdough|stir in[\s\S]{0,40}sourdough/i.test(blob), false, blob);
  assert.ok(/sourdough|toast/i.test(blob), blob);
  assert.ok(steps.length >= 3, blob);
});
