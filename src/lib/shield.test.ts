import assert from "node:assert/strict";
import test from "node:test";
import { isDairyFree, isGlutenFree, isPescatarian, isSugarFree, isVegan, isVegetarian } from "./diet.ts";
import { type HtcfTag, HTCF_ALL_TAGS, HTCF_BLOCK_BY_ID, HTCF_XREF, HTCF_XREF_FAILS, htcfInheritedFail, mealSavings, plateCost, recipeAllergens, recipeSafe, takeoutCost } from "./shield.ts";
import { HOW_TO_COOK_FISH_RECIPES } from "./catalog-how-to-cook-fish.ts";
import type { AllergyId, Protein, Recipe } from "./types.ts";

const PROTEINS: Protein[] = ["chicken", "beef", "lamb", "pork", "fish", "seafood", "veg", "eggs", "turkey"];

function mk(protein: Protein, servings = 4, ingredientCount = 6): Recipe {
  return {
    id: `test-${protein}`,
    name: "Test plate",
    description: "",
    minutes: 30,
    servings,
    protein,
    plate: "bowl",
    pack: "free",
    tags: [],
    ingredients: Array.from({ length: ingredientCount }, (_, i) => ({
      name: `ingredient ${i}`,
      qty: 1,
      unit: "",
      aisle: "Pantry",
    })),
    steps: [],
    nutrition: { cal: 500, protein: 30, carbs: 40, fat: 15 },
  };
}

test("takeoutCost is always higher than plateCost, for every protein", () => {
  for (const protein of PROTEINS) {
    const recipe = mk(protein);
    assert.ok(
      takeoutCost(recipe, 4) > plateCost(recipe, 4),
      `${protein}: expected takeout cost to exceed grocery cost`,
    );
  }
});

test("mealSavings is never negative and matches the takeout/grocery delta", () => {
  for (const protein of PROTEINS) {
    const recipe = mk(protein);
    const savings = mealSavings(recipe, 4);
    assert.equal(savings, takeoutCost(recipe, 4) - plateCost(recipe, 4));
    assert.ok(savings > 0, `${protein}: expected positive savings on a typical plate`);
  }
});

test("cost scales with household size relative to servings", () => {
  const recipe = mk("chicken", 4);
  const forTwo = plateCost(recipe, 2);
  const forEight = plateCost(recipe, 8);
  assert.ok(forEight > forTwo);
  const ratio = (forEight / forTwo) * 100;
  assert.ok(ratio > 380 && ratio < 420, `expected ~4x scaling, got ${ratio}%`);
});

test("household is floored at 1 even if passed as 0", () => {
  const recipe = mk("veg");
  assert.ok(takeoutCost(recipe, 0) > 0);
});

/* ---- Allergen words beyond the names: dairy, nuts, shellfish, spicy ---- */

function withRows(rows: (string | [string, string])[], steps: string[] = []): Recipe {
  return {
    ...mk("veg"),
    id: "test-allergen",
    name: "Test plate",
    ingredients: rows.map((r) => {
      const [name, unit] = typeof r === "string" ? [r, ""] : r;
      return { name, qty: 1, unit, aisle: "Pantry" as const };
    }),
    steps,
  };
}
const has = (r: Recipe, a: AllergyId) => recipeAllergens(r).includes(a);

test("dairy: named cheeses, crema, labneh, eggnog and white sauce are dairy", () => {
  for (const row of ["pecorino romano", "provolone", "cotija", "queso fresco", "crema", "labneh", "eggnog", "white sauce", "thick white sauce", "gruyère", "crème fraîche", "half-and-half"]) {
    const r = withRows([row]);
    assert.ok(has(r, "dairy"), `${row}: shield should see dairy`);
    assert.ok(!isDairyFree(r), `${row}: dairy-free filter should not pass it`);
  }
});

test("dairy: free-from forms and lookalikes keep the result they had", () => {
  for (const row of ["oat milk", "almond milk", "coconut milk", "coconut cream", "soy milk", "cream of tartar", "vegan crema", "cashew crema", "balsamic crema", "romano beans", "bean curd", "Alabama white sauce", "custard apple", "butternut squash", "nutmeg"]) {
    const r = withRows([row]);
    assert.equal(isDairyFree(r), true, `${row}: dairy-free filter should still pass it`);
  }
  for (const row of ["vegan pecorino", "dairy-free queso", "vegan eggnog", "plant-based labneh"]) {
    assert.equal(has(withRows([row]), "dairy"), false, `${row}: no new dairy hit`);
  }
});

test("dairy: method mentions count, verbs and boilerplate do not", () => {
  assert.ok(has(withRows(["prunes"], ["Serve warm, with cream if you like."]), "dairy"));
  assert.ok(has(withRows(["shrimp"], ["Mix with mayonnaise thinned with cream."]), "dairy"));
  for (const step of ["Cream the shortening and sugar.", "Beat until creamy.", "Strain through cheesecloth.", "Stir in the coconut milk.", "Bake in custard cups.", "Spoon any sauce or cheese over the top.", "Dunk the hot chicken in the white sauce.", "Cook until the color of peanut butter.", "Add the butter beans."]) {
    assert.equal(has(withRows(["salt"], [step]), "dairy"), false, step);
  }
});

test("nuts: a bare 'nuts' row, chestnuts, pesto, macaroons and mole paste are nuts", () => {
  for (const row of ["nuts", "chopped nuts", "mixed nuts", "nut meats", "chestnuts", "basil pesto", "macaroons", "mole paste", "marzipan"]) {
    assert.ok(has(withRows([row]), "nuts"), row);
  }
  assert.ok(has(withRows(["sugar"], ["Add the nuts and vanilla."]), "nuts"));
});

test("nuts: nutmeg, butternut, doughnuts, coconut, water chestnuts and nut-free rows are not", () => {
  for (const row of ["nutmeg", "ground nutmeg", "butternut squash", "doughnuts", "coconut", "shredded coconut", "coconut macaroons", "water chestnuts", "nut-free pesto", "chestnut mushrooms", "litchi nut", "butter the size of a nut"]) {
    assert.equal(has(withRows([row]), "nuts"), false, row);
  }
  for (const step of ["Grate nutmeg over the top.", "Fry until nut-brown.", "Add the water chestnuts.", "Top with toasted coconut."]) {
    assert.equal(has(withRows(["salt"], [step]), "nuts"), false, step);
  }
});

test("shellfish: molluscs by name and shellfish in the method", () => {
  for (const row of ["squid", "calamari", "octopus", "langoustines", "cockles"]) assert.ok(has(withRows([row]), "shellfish"), row);
  assert.ok(has(withRows(["lettuce"], ["For a main-dish salad, add 1 pound fresh shrimp."]), "shellfish"));
  for (const step of ["Cut into oyster-sized pieces.", "Scallop the edges of the crust.", "Serve with oyster crackers."]) {
    assert.equal(has(withRows(["salt"], [step]), "shellfish"), false, step);
  }
});

test("spicy: curry pastes, Tabasco, Korean chili, Cajun, peri-peri, horseradish and ground red pepper", () => {
  for (const row of ["green curry paste", "red curry paste", "massaman paste", "Tabasco", "tobasco sauce", "gochugaru", "kimchi", "ssamjang", "doubanjiang", "Cajun seasoning", "peri-peri sauce", "dried guajillo", "aleppo pepper", "horseradish", "prepared horseradish", "crushed red pepper", "hot paprika", "chillies"]) {
    assert.ok(has(withRows([row]), "spicy"), row);
  }
  assert.ok(has(withRows([["red pepper", "tsp"]]), "spicy"), "a teaspoon of red pepper is cayenne");
  assert.ok(has(withRows(["eggs"], ["Sprinkle with salt and red pepper."]), "spicy"));
  assert.ok(has(withRows(["fish"], ["Serve cold with horseradish."]), "spicy"));
});

test("spicy: bell peppers, sweet paprika, pimiento, serrano ham and mild curry stay as they were", () => {
  for (const row of ["red pepper", "red bell pepper", "roasted red peppers", "sweet paprika", "smoked paprika", "paprika", "pimiento", "serrano ham", "Japanese curry roux", "curry powder", "white kimchi", "Dijon mustard", "fresh ginger"]) {
    assert.equal(has(withRows([row]), "spicy"), false, row);
  }
  assert.equal(has(withRows([["red pepper", "tbsp"]]), "spicy"), false, "a tablespoon of red pepper is chopped pepper");
  for (const step of ["Add the sliced red pepper.", "Serve with hot sauce.", "Chill well.", "Sprinkle with sweet paprika."]) {
    assert.equal(has(withRows(["salt"], [step]), "spicy"), false, step);
  }
});

/* ---- Line's Oct 9 audits, the HTCF diet fixes and descriptions ---- */

const withDesc = (description: string, rows: (string | [string, string])[] = ["salt"], steps: string[] = []): Recipe => ({ ...withRows(rows, steps), description });
const gf = (r: Recipe) => isGlutenFree(r); // the filter path, which strips gluten-free forms first

test("gluten: prepared sauces and mixes fail unless the row says gluten-free (white and shiro miso pass)", () => {
  for (const row of ["miso", "yellow miso", "bouillon cubes", "chicken bouillon powder", "taco seasoning", "onion soup mix", "Worcestershire sauce", "barbecue sauce", "bbq sauce", "gochujang", "surimi", "imitation crab", "bangers", "egg omelet batter", "teriyaki sauce", "hoisin sauce", "tempura batter", "licorice", "scones", "crepes", "cream puffs", "stuffing mix", "chocolate cake", "flower", "baba", "golden buck", "cream of mushroom soup", "condensed tomato soup", "Drawn-Butter Sauce", "poulette sauce", "parsley sauce", "egg sauce"]) {
    assert.equal(gf(withRows([row])), false, `${row} should fail gluten-free`);
  }
  for (const row of ["white miso", "shiro miso", "gluten-free miso", "GF Worcestershire sauce", "gluten-free bouillon cubes", "gluten-free taco seasoning", "gluten-free barbecue sauce", "rice cakes", "fish cakes", "court bouillon", "corn tortillas", "rice noodles"]) {
    assert.equal(gf(withRows([row])), true, `${row} should keep passing`);
  }
});

test("gluten: corn, nut and potato bread and corn muffins are wheat by default; 'rice or toast' is toast", () => {
  for (const row of ["corn bread", "cornbread", "nut bread", "potato bread", "corn muffins", "corn bread crumbs", "rice or toast", "corn and toast"]) {
    assert.equal(gf(withRows([row])), false, row);
  }
  for (const row of ["gluten-free bread", "rice bread", "almond bread crumbs", "gluten-free muffins"]) assert.equal(gf(withRows([row])), true, row);
});

test("gluten: gravy, a bare flour, a bread serve-with, open shells and the tortilla template steps", () => {
  for (const step of ["Make a highly seasoned gravy.", "Stir in the flour.", "Thicken with flour and butter.", "Serve in bowls with bread.", "Fill the open shells.", "Pour into the unbaked shell.", "Lay in paste.", "Warm the tortillas in a dry pan."]) {
    assert.equal(gf(withRows(["salt"], [step])), false, step);
  }
  for (const step of ["Do not add flour.", "There is no flour in it.", "Stir in the rice flour.", "Whisk in the gluten-free flour.", "Warm the corn tortillas.", "Spoon the filling into the lettuce cups."]) {
    assert.equal(gf(withRows(["corn tortillas"], [step])), true, step);
  }
});

test("gluten: descriptions and sandwich names are read; negations and a gluten-free label are trusted", () => {
  assert.equal(gf(withDesc("Sharp cheddar, pimentos, mayo. Celery or white toast.")), false);
  assert.equal(gf(withDesc("Salt cod, hard biscuit, and scrunchions.")), false);
  assert.equal(gf(withDesc("Lettuce cups, not bread.")), true);
  assert.equal(gf(withDesc("Gluten-free, no bread.")), true);
  assert.equal(gf({ ...withRows(["mushrooms"]), name: "Mushroom-and-Lobster Sandwiches" }), false);
  assert.equal(gf({ ...withRows(["peanuts"]), id: "hill-0208" }), false, "id-level override: the bread lives in another recipe");
});

test("dairy: buttered toast, buttering the dish and creamy gravy are dairy; a buttered mould or platter is not", () => {
  for (const step of ["Serve on rounds of buttered toast.", "Stew the oysters, well buttered and peppered.", "Place between rounds of buttered bread.", "Buttering the dish first.", "Make creamy gravy in it."]) {
    assert.ok(has(withRows(["salt"], [step]), "dairy"), step);
  }
  for (const step of ["Pour into a well-buttered mould.", "Set on a buttered platter.", "Line a buttered pan."]) {
    assert.equal(has(withRows(["salt"], [step]), "dairy"), false, step);
  }
});

test("nuts: panang paste; shellfish: Thai, laksa and khao soi pastes and kimchi unless the row says vegan or no shrimp", () => {
  assert.ok(has(withRows(["panang paste"]), "nuts"));
  assert.ok(has(withDesc("A thick red curry, lime leaf, a little peanut."), "nuts"));
  for (const row of ["green curry paste", "red curry paste", "curry paste", "massaman paste", "laksa paste", "khao soi paste", "kimchi"]) assert.ok(has(withRows([row]), "shellfish"), row);
  for (const row of ["vegan red curry paste", "vegan kimchi"]) assert.equal(has(withRows([row]), "shellfish"), false, row);
});

test("every allergen reads the description; negated mentions do not count", () => {
  assert.ok(has(withDesc("Rice, chicken or shrimp, tomato."), "shellfish"));
  assert.ok(has(withDesc("Spicy vegetable relish."), "spicy"));
  assert.ok(has(withDesc("Salmon, oil, lemon, herbs. Serve with cream."), "dairy"));
  for (const d of ["No butter finish.", "Thighs, tomato, olives, no cheese.", "Mashed berries, chia, no pectin.", "Red lentil, a paprika butter of oil."]) {
    assert.equal(recipeAllergens(withDesc(d)).length, 0, d);
  }
});

test("gluten: boxed brownie, biscuit, muffin, waffle, cornbread, baking and cake mixes fail unless the row says gluten-free", () => {
  for (const row of ["8-ounce package brownie mix", "brownie mix", "1 box biscuit mix", "Bisquick", "muffin mix", "waffle mix", "corn bread mix", "baking mix", "yellow cake mix", "pancake mix", "cookie mix", "pizza crust mix"]) {
    assert.equal(gf(withRows([row])), false, `${row} should fail gluten-free`);
  }
  for (const row of ["gluten-free brownie mix", "GF baking mix", "gluten-free pancake mix", "rice flour muffin mix (gluten-free)", "trail mix", "salad mix", "cocoa mix"]) {
    assert.equal(gf(withRows([row])), true, `${row} should keep passing`);
  }
});

test("vegetarian and vegan: meat stock and meat broth are meat", () => {
  for (const row of ["meat stock", "2 cups meat broth", "Meat Broth (page 12)"]) {
    const r = { ...withRows([row]), protein: "veg" as const };
    assert.equal(isVegetarian(r), false, `${row} should fail vegetarian`);
    assert.equal(isVegan(r), false, `${row} should fail vegan`);
  }
  assert.equal(isVegetarian({ ...withRows(["vegetable broth"]), protein: "veg" as const }), true);
});

test("vegan: salad dressing rows fail vegan unless the row says vegan or eggless; eggs stay vegetarian", () => {
  for (const row of ["salad dressing", "3/4 cup salad dressing", "cooked salad dressing"]) {
    const r = { ...withRows([row]), protein: "veg" as const };
    assert.equal(isVegan(r), false, row);
    assert.equal(isVegetarian(r), true, row);
  }
  for (const row of ["vegan salad dressing", "eggless salad dressing", "vinaigrette"]) assert.equal(isVegan({ ...withRows([row]), protein: "veg" as const }), true, row);
});

test("vegetarian and vegan: gelatine (British spelling) is gelatin", () => {
  for (const row of ["gelatine", "2 envelopes unflavored gelatine", "gelatin"]) {
    const r = { ...withRows([row]), protein: "veg" as const };
    assert.equal(isVegetarian(r), false, `${row} should fail vegetarian`);
    assert.equal(isVegan(r), false, `${row} should fail vegan`);
  }
});

test("gluten: steak sauce, chili sauce, bottled dressings and chicken / beef broth, stock or bouillon fail unless the row says gluten-free", () => {
  for (const row of ["steak sauce", "2 tablespoons A.1. steak sauce", "chili sauce", "1/2 cup chili sauce", "bottled Italian dressing", "Italian salad dressing", "bottled ranch dressing", "mayonnaise or salad dressing", "prepared French dressing", "bottled French dressing", "can (10 3/4 ounces) condensed chicken broth", "beef broth", "chicken stock", "beef bouillon cubes", "chicken noodle soup", "beef consommé"]) {
    const r = withRows([row]);
    assert.equal(gf(r), false, `${row} should fail gluten-free`);
    assert.ok(recipeAllergens(r).includes("gluten"), `${row} should fail the shield`);
  }
  for (const row of ["gluten-free steak sauce", "GF chili sauce", "gluten-free Italian dressing", "gluten free chicken broth", "GF beef stock", "Vinaigrette Dressing (page 204)", "homemade French dressing", "French dressing", "French Dressing (page 12)", "red chile sauce", "vegetable broth", "olive oil and vinegar", "chili powder", "dressing for the salad"]) {
    assert.equal(gf(withRows([row])), true, `${row} should keep passing`);
  }
});

test("gluten: meat marinade envelopes, seasoned salt, French fried onions and sweet-and-sour sauce fail unless the row says gluten-free", () => {
  for (const row of ["envelope (.8 ounce) meat marinade", "seasoned salt", "can (2.8 ounces) French fried onions, if desired", "package (20 ounces) frozen French-fried potatoes, thawed", "frozen fries", "Sweet-and-Sour Sauce (page 8)", "bottled sweet and sour sauce"]) {
    assert.equal(gf(withRows([row])), false, `${row} should fail gluten-free`);
    assert.ok(recipeAllergens(withRows([row])).includes("gluten"), `${row} should fail the shield`);
  }
  for (const row of ["gluten-free seasoned salt", "GF meat marinade", "Wine Marinade (page 12)", "fried onions", "gluten-free French fries", "potatoes, fried", "garlic salt", "lemon pepper", "poultry seasoning", "Italian herb seasoning", "prepared mustard", "catsup"]) {
    assert.equal(gf(withRows([row])), true, `${row} should keep passing`);
  }
});

test("gluten: a bare batter row, a French roll and Leb-kuchen or ginger cake fail unless the row says gluten-free", () => {
  for (const row of ["batter", "smooth batter", "1 French roll", "French rolls", "Leb-kuchen or ginger cake", "ginger cake"]) {
    assert.equal(gf(withRows([row])), false, `${row} should fail gluten-free`);
    assert.ok(recipeAllergens(withRows([row])).includes("gluten"), `${row} should fail the shield`);
  }
  for (const row of ["gluten-free batter", "GF batter", "gluten-free French rolls", "fresh ginger", "ginger root"]) {
    assert.equal(gf(withRows([row])), true, `${row} should keep passing`);
  }
});

test("gluten: description and step words that do not mean wheat (corn tortillas, curry gravy, spring rolls, baba ghanoush ...) keep a recipe gluten-free", () => {
  const keep: [string, string[], string, string[]][] = [
    ["corn tortillas", ["corn tortillas"], "Skirt steak. Hot grill, warm tortillas, fried tortilla strips.", ["Set the tortillas on plates."]],
    ["curry", ["garam masala", "chickpeas"], "Chickpeas in a tangy tomato-onion gravy.", ["Simmer until the gravy thickens."]],
    ["sauce", ["sugar", "chili"], "Thai-style. For spring rolls or a boring chicken breast.", []],
    ["cauliflower", ["cauliflower"], "A cheddar sauce. The noodles are the vegetable.", []],
    ["dip", ["eggplant", "tahini"], "Baba ghanoush, charred.", ["Spoon baba ghanoush into a bowl."]],
    ["tuna", ["tuna", "avocado"], "Everything bagel spice. Piped with a pastry bag and tube. Cabbage rolls.", []],
    ["eggnog", ["eggs", "whiskey", "nutmeg"], "Egg batter, whiskey, boiling water.", ["Spoon the egg batter on top."]],
    ["hoe cake", ["cornmeal"], "Little cornmeal dumplings. Bread when there is no oven. Oven or skillet toast.", []],
  ];
  for (const [name, rows, description, steps] of keep) {
    const r = { ...withRows(rows, steps), description };
    assert.equal(gf(r), true, `${name} should keep passing gluten-free`);
  }
  // Still fail: wheat tortillas, a western gravy, egg rolls, a wheat batter, and a gf-style claim never clears a flour row.
  assert.equal(gf({ ...withRows(["flour tortillas"]), description: "warm tortillas" }), false);
  assert.equal(gf({ ...withRows(["pork roast"]), description: "Roast with gravy" }), false);
  assert.equal(gf({ ...withRows(["cabbage"]), description: "Crisp egg rolls" }), false);
  assert.equal(gf({ ...withRows(["eggs", "sugar"]), description: "Egg batter, fried" }), false);
  assert.equal(gf({ ...withRows(["corn flour", "pork"]), description: "Served on warm tortillas" }), false);
});

test("vegan: a salad-dressing cake fails; the Crisco book's own fruit-salad dressings stay vegan", () => {
  const cake = { ...withRows(["flour", "cocoa", "sugar", "salad"]), id: "kfyr-063", name: "Salad Dressing Cake" };
  assert.equal(isVegan(cake), false);
  for (const row of ["Poppy Seed Fruit Salad Dressing", "Fruit Salad Dressing or Poppy Seed Fruit Salad Dressing"]) {
    assert.equal(isVegan({ ...withRows(["oranges", row]), id: "cris-045" }), true, `${row} (cris) stays vegan`);
    assert.equal(isVegan({ ...withRows(["oranges", row]), id: "pta-154" }), false, `${row} elsewhere is the cooked kind`);
  }
});

// Follow-up pack (Line's friction asks): shield and badge agree on corn tortillas / almond flour, a
// description is not an ingredient list for pita / sandwiches / bread, and the Crisco book's own recipe rows.
const glutenSafe = (r: Recipe) => recipeSafe(r, ["gluten"]);

test("shield matches the badge: corn / masa / gluten-free tortillas and almond flour pass, flour tortillas still fail", () => {
  for (const row of ["corn tortillas", "masa tortillas", "gluten-free tortillas", "almond flour"]) {
    const r = withRows([row, "chicken"]);
    assert.equal(glutenSafe(r), true, `${row}: shield passes`);
    assert.equal(gf(r), true, `${row}: badge passes`);
  }
  for (const row of ["flour tortillas", "tortillas", "7-inch flour tortillas", "corn tortillas or flour tortillas", "wheat flour", "almond flour and flour"]) {
    assert.equal(glutenSafe(withRows([row, "chicken"])), false, `${row}: shield still fails`);
  }
  // One clean row never clears a wheat row beside it, and nuts still fail on almond flour.
  assert.equal(glutenSafe(withRows(["corn tortillas", "flour tortillas"])), false);
  assert.equal(recipeSafe(withRows(["almond flour"]), ["nuts"]), false);
});

test("description: pita, sandwiches and bread are serve-withs, rows and steps still count; rice noodles clear 'noodles'", () => {
  for (const d of ["Stuffed in pita.", "Tacos, bowls, sandwiches.", "Shawarma, roast chicken, bread.", "The one that drips down the pita."]) {
    assert.equal(gf({ ...withRows(["garlic", "oil"]), description: d }), true, `${d} passes`);
  }
  assert.equal(gf({ ...withRows(["garlic", "pita"]), description: "Stuffed in pita." }), false);
  assert.equal(gf({ ...withRows(["garlic"], ["Spoon onto toast."]), description: "Bread." }), false);
  assert.equal(gf({ ...withRows(["rice noodles", "shrimp"]), description: "Tamarind noodles, shrimp." }), true);
  assert.equal(gf({ ...withRows(["rice noodles", "egg noodles"]), description: "Tamarind noodles." }), false);
  // Held for Line: a bare serve-with bread in a non-sauce dish stays blocked.
  assert.equal(gf({ ...withRows(["chickpeas", "rice"]), id: "md-chickpea-stew", description: "Chickpeas, tomato. Bread." }), false);
  assert.equal(gf({ ...withRows(["shrimp"]), description: "Tamarind noodles, shrimp." }), false);
  assert.equal(gf({ ...withRows(["potatoes"]), description: "Grated-potato dumplings. Sauce for pasta." }), true);
  assert.equal(gf({ ...withRows(["potatoes", "dumpling wrappers"]), description: "Dumplings." }), false);
});

test("crisco: a row that is the book's own gluten-free dressing or marinade title is exempt; elsewhere it is not", () => {
  for (const row of ["Italian Dressing", "Mild Garlic Marinade", "Green Goddess Salad Dressing", "Fruit Salad Dressing or Poppy Seed Fruit Salad Dressing"]) {
    assert.equal(gf({ ...withRows(["lettuce", row]), id: "cris-031" }), true, `${row} (cris) passes`);
    assert.equal(gf({ ...withRows(["lettuce", row]), id: "pta-154" }), false, `${row} elsewhere still fails`);
  }
  assert.equal(gf({ ...withRows(["lettuce", "Italian Dressing", "croutons"]), id: "cris-031" }), false);
  assert.equal(gf({ ...withRows(["lettuce", "Italian Dressing or ranch dressing"]), id: "cris-031" }), false);
});

test("shield: a printed rice noodle row clears 'noodle' (as the badge does); wheat, egg and bare noodle rows still fail", () => {
  for (const row of ["rice noodles", "rice noodle", "Rice Noodles", "8 oz rice noodles", "flat rice noodles"]) {
    const r = withRows([row, "shrimp"]);
    assert.equal(glutenSafe(r), true, `${row}: shield passes`);
    assert.equal(gf(r), true, `${row}: badge passes`);
  }
  for (const row of ["wheat noodles", "egg noodles", "noodles", "ramen noodles", "udon noodles", "rice noodles or egg noodles", "egg noodles or rice noodles"]) {
    assert.equal(glutenSafe(withRows([row, "shrimp"])), false, `${row}: shield still fails`);
  }
  // A clean rice-noodle row never clears a wheat row beside it.
  assert.equal(glutenSafe(withRows(["rice noodles", "egg noodles"])), false);
  assert.equal(glutenSafe(withRows(["rice noodles", "soy sauce"])), false);
  // Printed row says rice though the parsed name is bare "noodles".
  const bare = { ...withRows(["shrimp"]) };
  bare.ingredients = [{ name: "noodles", raw: "rice noodles", qty: 1, unit: "", aisle: "Pantry" } as Recipe["ingredients"][number]];
  assert.equal(glutenSafe(bare), true);
});

/* ---- Oct 17: HTCF named sauces (the row is the sauce's name; the print gives the sauce in its own chapter) ---- */
const htcf = (rows: string[], id = "htcf-0001"): Recipe => ({ ...withRows(rows), id });
const dairySafe = (r: Recipe) => recipeSafe(r, ["dairy"]);

test("htcf: a printed butter / flour / cream / egg sauce row fails dairy-free and the dairy shield", () => {
  for (const row of ["Egg Sauce", "Caper Sauce", "Poulette Sauce", "Maitre d'Hotel Sauce", "Maître d'Hôtel Sauce", "Maitre d'Hotel", "Anchovy Sauce", "Hollandaise", "Hollandaise Sauce", "Holandaise Sauce", "Tartar Sauce", "Ravigote Sauce", "Ravigote", "White Sauce", "Cream Sauce", "Bechamel Sauce", "Béchamel", "Veloute Sauce", "Butter Sauce", "Parsley Sauce", "Oyster Sauce", "Shrimp Sauce", "Allemande Sauce", "Egg or Hollandaise Sauce", "Mayonnaise or Tartar Sauce", "butter or Maitre d'Hotel Sauce", "parsley, or Tomato Sauce", "very thick Cream Sauce"]) {
    const r = htcf(["codfish", row]);
    assert.equal(dairySafe(r), false, `${row}: dairy shield fails`);
    assert.equal(isDairyFree(r), false, `${row}: dairy-free fails`);
    assert.ok(recipeAllergens(r).includes("dairy"));
  }
});

test("htcf: a flour- or roux-thickened printed sauce also fails gluten-free; a butter-only one does not", () => {
  for (const row of ["Egg Sauce", "Caper Sauce", "Poulette Sauce", "Anchovy Sauce", "Hollandaise Sauce", "Tartar Sauce", "Ravigote Sauce", "White Sauce", "Cream Sauce", "Bechamel Sauce", "Veloute Sauce", "Italian Sauce", "Fine Herb Sauce", "Sauce a la Gasconne", "Shrimp Sauce", "Milanaise Sauce", "Spanish Sauce", "Aurora Sauce"]) {
    const r = htcf(["codfish", row]);
    assert.equal(glutenSafe(r), false, `${row}: gluten shield fails`);
    assert.equal(isGlutenFree(r), false, `${row}: gluten-free fails`);
  }
  // Maitre d'Hotel is butter, lemon and parsley in the print: no flour.
  const m = htcf(["codfish", "Maitre d'Hotel Sauce"]);
  assert.equal(glutenSafe(m), true);
  assert.equal(dairySafe(m), false);
});

test("htcf: butter-free sauces (Mayonnaise, Cold Ravigote, Vinaigrette, Persillade) and non-sauce rows keep their pass", () => {
  for (const row of ["Mayonnaise", "stiff Mayonnaise", "Cold Ravigote Sauce", "Vinaigrette Sauce", "Persillade Sauce", "Nicoise Sauce", "Sardine Sauce", "Worcestershire sauce", "tomato catsup", "parsley", "egg", "capers", "white wine"]) {
    assert.equal(dairySafe(htcf(["codfish", row])), true, `${row}: dairy still passes`);
  }
  assert.equal(glutenSafe(htcf(["codfish", "Mayonnaise"])), true);
  assert.equal(glutenSafe(htcf(["codfish", "Cold Ravigote Sauce"])), true);
});

test("htcf: a row that labels the sauce dairy-free / gluten-free is taken at its word; other books are not read by this rule", () => {
  assert.equal(dairySafe(htcf(["codfish", "dairy-free Egg Sauce"])), true);
  assert.equal(glutenSafe(htcf(["codfish", "gluten-free Egg Sauce"])), true);
  for (const row of ["Egg Sauce", "Caper Sauce", "Parsley Sauce", "Tartar Sauce"]) {
    assert.equal(dairySafe(htcf(["fish", row], "hill-0001")), true, `${row} outside the HTCF book: unchanged`);
  }
});

test("htcf-0180 (Codfish a la Bechamel, made like Creamed Codfish) fails gluten by id; milk already fails dairy", () => {
  const r = { ...htcf(["codfish", "white stock", "milk"], "htcf-0180") };
  assert.equal(glutenSafe(r), false);
  assert.equal(dairySafe(r), false);
  assert.equal(glutenSafe({ ...r, id: "htcf-0176" }), true);
});

test("htcf: restored cooked meat / beef stock rows fail pescatarian; shellfish meat does not", () => {
  const p = (rows: string[]) => ({ ...withRows(rows), protein: "fish" as Protein });
  assert.equal(isPescatarian(p(["salted herrings", "cooked meat"])), false);
  assert.equal(isPescatarian(p(["sea-bass", "well-seasoned beef stock"])), false);
  assert.equal(isPescatarian(p(["salted herrings", "cooked crab meat"])), true);
  assert.equal(isPescatarian(p(["herrings", "lobster meat"])), true);
});

test("htcf: a catsup / ketchup row fails sugar-free (store catsup has added sugar); currants and other books are unchanged", () => {
  const h = (rows: string[], id = "htcf-0001") => ({ ...withRows(rows), id });
  assert.equal(isSugarFree(h(["smelts", "catsup"])), false);
  assert.equal(isSugarFree(h(["smelts", "tomato catsup"])), false);
  assert.equal(isSugarFree(h(["smelts", "Ketchup"])), false);
  assert.equal(isSugarFree(h(["smelts", "currants"])), true);
  assert.equal(isSugarFree(h(["smelts", "lemon"])), true);
  assert.equal(isSugarFree(h(["smelts", "catsup"], "hill-0001")), true, "outside the HTCF book: unchanged");
});

/* ---- Oct 23: HTCF "according to directions (given) for X" inherits X's failures (Line 2ed6 audit) ---- */
const HTCF_BY_ID = new Map(HOW_TO_COOK_FISH_RECIPES.map((r) => [r.id, r]));
const ownFails = (r: Recipe) => {
  const a = new Set<string>(recipeAllergens(r));
  if (!isGlutenFree(r)) a.add("gluten");
  if (!isDairyFree(r)) a.add("dairy");
  if (!isSugarFree(r)) a.add("sugar");
  if (!isPescatarian(r)) a.add("meat");
  return a;
};

test("htcf xref: every 'according to directions (given) for X' recipe is in the resolution table", () => {
  const RE = /according to (?:the )?directions (?:elsewhere )?(?:given )?(?:in the (?:first part of the )?recipe )?for ([^,.;:]+)/i;
  // Oct 23: unnamed back-references ("given above", "previously given", "preceding recipe", "as directed", ...).
  const BACK = /according to directions (?:given above|(?:previously|elsewhere) given|given in the preceding recipe)|according to (?:size)|\bas directed\b|\bas for (?:boiling|broiling)\b|in the same manner|given in the recipe for /i;
  const NOT_A_REF = ["htcf-0965", "htcf-1190"]; // "in the same manner" (inside its own recipe), "according to size"
  const found = HOW_TO_COOK_FISH_RECIPES.filter((r) => RE.test((r.steps ?? []).join(" ")) || BACK.test((r.steps ?? []).join(" "))).map((r) => r.id).sort();
  assert.deepEqual(found, Object.keys(HTCF_XREF).sort());
  for (const id of NOT_A_REF) assert.deepEqual(HTCF_XREF[id], [], id);
  for (const [id, t] of Object.entries(HTCF_XREF)) for (const tid of t ?? []) assert.ok(HTCF_BY_ID.has(tid), `${id} -> ${tid} is a book recipe`);
});

test("htcf xref: the inherited failures are the fixed point of the targets' failures (unresolved X fails everything)", () => {
  for (const [id, t] of Object.entries(HTCF_XREF)) {
    const want = new Set<string>();
    if (t === null) HTCF_ALL_TAGS.forEach((x) => want.add(x));
    else for (const tid of t) ownFails(HTCF_BY_ID.get(tid)!).forEach((x) => want.add(x));
    assert.deepEqual([...(HTCF_XREF_FAILS[id] ?? [])].sort(), [...want].sort(), id);
  }
  assert.deepEqual(Object.keys(HTCF_XREF_FAILS).filter((id) => !(id in HTCF_XREF)), []);
});

test("htcf xref: Line's 12 cross-reference ids and the plate's blocks fail; 0209 / 0457 fail every tag", () => {
  const fail = (id: string, tag: "gluten" | "dairy") => {
    const r = HTCF_BY_ID.get(id)!;
    assert.equal(recipeSafe(r, [tag]), false, `${id} ${tag} shield`);
    assert.equal(tag === "gluten" ? isGlutenFree(r) : isDairyFree(r), false, `${id} ${tag}-free`);
  };
  for (const n of ["0092", "0093", "0138", "0397", "0655", "0707"]) { fail(`htcf-${n}`, "dairy"); fail(`htcf-${n}`, "gluten"); }
  for (const n of ["0106", "0570", "0973", "0538", "0198", "0186"]) fail(`htcf-${n}`, "gluten");
  for (const n of ["0361", "0538", "1132", "0209", "0570"]) fail(`htcf-${n}`, "dairy");
  for (const id of ["htcf-0209", "htcf-0457"]) {
    const r = HTCF_BY_ID.get(id)!;
    assert.equal(HTCF_XREF[id], null);
    assert.deepEqual(recipeAllergens(r).sort(), ["dairy", "gluten", "nuts", "shellfish", "spicy"]);
    assert.equal(isSugarFree(r), false);
    assert.equal(isPescatarian(r), false);
  }
});

test("htcf xref: other books are never read; a row list alone does not trigger it", () => {
  for (const id of [...Object.keys(HTCF_XREF_FAILS), ...Object.keys(HTCF_BLOCK_BY_ID)]) {
    const r = { ...HTCF_BY_ID.get(id)!, id: id.replace("htcf-", "hill-") };
    for (const t of HTCF_ALL_TAGS) assert.equal(htcfInheritedFail(r, t), false);
  }
  assert.equal(htcfInheritedFail(withRows(["codfish"]), "dairy"), false);
});

test("htcf xref (Oct 23): Line's 608d HARD ids and Kitchen's rulings fail; nothing else in the book is read", () => {
  const want: Record<string, HtcfTag[]> = {
    "htcf-0227": ["gluten", "dairy"], "htcf-0514": ["gluten"], "htcf-1173": ["gluten", "dairy", "spicy"],
    "htcf-1089": ["gluten", "dairy", "meat"], "htcf-0201": ["gluten"],
    "htcf-0276": ["dairy"], "htcf-0161": ["gluten", "meat"], "htcf-0279": ["meat"], "htcf-0278": ["shellfish"], "htcf-0860": ["gluten", "dairy"],
  };
  for (const [id, tags] of Object.entries(want)) {
    const r = HTCF_BY_ID.get(id)!;
    for (const t of tags) {
      assert.equal(htcfInheritedFail(r, t), true, `${id} ${t}`);
      if (t === "gluten") assert.equal(isGlutenFree(r), false, `${id} gluten-free`);
      else if (t === "dairy") assert.equal(isDairyFree(r), false, `${id} dairy-free`);
      else if (t === "meat") assert.equal(isPescatarian(r), false, `${id} pescatarian`);
      else assert.equal(recipeSafe(r, [t as "shellfish" | "spicy"]), false, `${id} ${t} shield`);
    }
  }
});
