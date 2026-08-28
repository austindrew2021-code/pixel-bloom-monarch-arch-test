import assert from "node:assert/strict";
import test from "node:test";
import { cleanRecipeName, polishSteps, polishRecipe } from "./cook-steps.ts";
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
  assert.deepEqual(steps, original);
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
