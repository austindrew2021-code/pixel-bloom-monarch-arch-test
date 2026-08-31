import type { Ingredient, Recipe } from "./types";

export type MethodRecipe = Pick<Recipe, "name" | "minutes" | "protein" | "plate" | "ingredients" | "steps"> & {
  id?: string;
  tags?: string[];
  cuisine?: string;
};

function finish(s: string): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (!t) return t;
  return /[.!?]$/.test(t) ? t : `${t}.`;
}

function join(items: string[]): string {
  const list = items.filter(Boolean);
  if (list.length <= 1) return list[0] ?? "";
  if (list.length === 2) return `${list[0]} and ${list[1]}`;
  return `${list.slice(0, -1).join(", ")}, and ${list[list.length - 1]}`;
}

function findIng(recipe: MethodRecipe, re: RegExp): Ingredient | undefined {
  return recipe.ingredients.find((i) => re.test(i.name));
}

function named(recipe: MethodRecipe, re: RegExp, fallback = ""): string {
  return findIng(recipe, re)?.name ?? fallback;
}

function namesMatching(recipe: MethodRecipe, re: RegExp): string[] {
  return recipe.ingredients.map((i) => i.name).filter((n) => re.test(n));
}

function hintText(recipe: MethodRecipe): string {
  return `${recipe.name} ${(recipe.tags ?? []).join(" ")} ${recipe.steps.join(" ")}`.toLowerCase();
}

function hintMinutes(recipe: MethodRecipe, fallback: number): number {
  const hits = [...recipe.steps.join(" ").matchAll(/(\d+)\s*(?:-|–)?\s*(?:minutes?|mins?)\b/gi)].map((m) => Number(m[1]));
  const usable = hits.filter((n) => n >= 2 && n <= 180);
  return usable[0] ?? fallback;
}

function allHintMinutes(recipe: MethodRecipe): number[] {
  return [...recipe.steps.join(" ").matchAll(/(\d+)\s*(?:minutes?|mins?)\b/gi)].map((m) => Number(m[1])).filter((n) => n >= 1 && n <= 180);
}

function ovenTemp(recipe: MethodRecipe): number {
  const m = recipe.steps.join(" ").match(/(\d{3})\s*°?\s*F/i);
  if (m) return Number(m[1]);
  const h = hintText(recipe);
  if (/lahmacun|pizza|flatbread|socca|naan|pide/.test(h)) return /very hot|screaming/.test(h) ? 500 : 475;
  if (/very hot/.test(h)) return 450;
  if (recipe.plate === "dessert") return 350;
  if (recipe.plate === "roast") return 400;
  return 375;
}

function isPressure(recipe: MethodRecipe): boolean {
  return /instant-?pot|high pressure|pressure cooker/.test(hintText(recipe));
}

function isDrink(recipe: MethodRecipe): boolean {
  return (
    (recipe.tags ?? []).includes("drink") ||
    /nog|punch|cocktail|smoothie|lassi|lemonade|iced tea|cocoa|hot chocolate/.test(recipe.name.toLowerCase())
  );
}

function fat(recipe: MethodRecipe): string {
  return named(recipe, /butter|ghee/, "") || named(recipe, /olive oil|oil|lard|dripping/, "oil");
}

function aromatics(recipe: MethodRecipe): string {
  return join(namesMatching(recipe, /\b(onion|shallot|garlic|celery|leek|scallion|green onion)\b/i));
}

function andArom(recipe: MethodRecipe): string {
  const a = aromatics(recipe);
  return a ? ` and ${a}` : "";
}

function cookAromStep(recipe: MethodRecipe, minutes = "4"): string {
  const cold =
    isDrink(recipe) ||
    /overnight|parfait|bircher|muesli|hummus|yogurt|cottage bowl|oat jar|granola|nice cream/.test(
      `${recipe.name} ${(recipe.tags ?? []).join(" ")}`.toLowerCase(),
    );
  if (cold) return "Have everything measured and a bowl ready.";
  const a = aromatics(recipe);
  if (!a) return "Let the fat get hot for 30 seconds, until it shimmers.";
  return `Add ${a} and cook ${minutes} minutes, until soft.`;
}

function proteinName(recipe: MethodRecipe): string {
  const hit = recipe.ingredients.find((i) => {
    const n = i.name.toLowerCase();
    if (recipe.protein === "veg") {
      return /tofu|tempeh|bean|lentil|chickpea|mushroom|eggplant|cauliflower|squash/.test(n);
    }
    if (recipe.protein === "eggs") return /\begg/.test(n);
    return /chicken|turkey|duck|beef|steak|pork|ham|bacon|sausage|lamb|salmon|shrimp|cod|tuna|fish|scallop|mussel|clam|tofu/.test(
      n,
    );
  });
  return hit?.name ?? recipe.ingredients[0]?.name ?? "the vegetables";
}

function isGroundMeat(recipe: MethodRecipe): boolean {
  const meat = proteinName(recipe);
  return /\b(ground|mince|minced|crumbled)\b/i.test(meat) || /sloppy joe|loose-meat|maid-rite|tavern sandwich/.test(recipe.name.toLowerCase());
}

function liquid(recipe: MethodRecipe): string {
  return (
    named(recipe, /broth|stock/, "") ||
    named(recipe, /coconut milk|milk|cream|wine|water|tomato juice|beer/, "") ||
    "water"
  );
}

function herbFinish(recipe: MethodRecipe): string {
  const h = named(recipe, /\b(parsley|cilantro|basil|mint|dill|chives|scallion)\b/i);
  const lemon = named(recipe, /\b(lemon|lime)\b/i);
  const bits = [h && `Scatter ${h} over the top.`, lemon && `Squeeze ${lemon} over.`].filter(Boolean);
  return bits.join(" ");
}

function endPlate(recipe: MethodRecipe, extra = "Serve hot."): string {
  return [herbFinish(recipe), extra].filter(Boolean).join(" ");
}

function starch(recipe: MethodRecipe): string {
  return (
    named(recipe, /pasta|spaghetti|linguine|fettuccine|penne|noodle|macaroni|orzo|gnocchi|vermicelli/, "") ||
    named(recipe, /rice|couscous|quinoa|bulgur|farro/, "") ||
    named(recipe, /potato|bread|bun|tortilla|pita|tostada|naan/, "")
  );
}

function vegList(recipe: MethodRecipe): string {
  return (
    join(
      namesMatching(
        recipe,
        /\b(carrots?|potatoes?|celery|bell peppers?|chili peppers?|chile peppers?|red peppers?|hot peppers?|green peppers?|yellow peppers?|poblano|jalapeños?|zucchini|broccoli|cabbage|tomatoes?|mushrooms?|spinach|peas|corn|beans?|chickpeas?|lentils?|eggplants?|asparagus|kale|parsnips?)\b/i,
      ).filter((n) => !/black pepper|white pepper|pepper flake|cayenne|^pepper$|garlic powder|chili powder/i.test(n)),
    ) || ""
  );
}

function cookedBe(noun: string): "is" | "are" {
  const n = noun.toLowerCase();
  if (/\b(thighs|breasts|wings|drumsticks|legs|cutlets|slices|chops|shrimp|scallops|mussels|clams|eggs|beans|lentils|noodles|mushrooms|fillets|meatballs|florets)\b/.test(n)) {
    return "are";
  }
  const last = n.split(/\s+/).pop() ?? "";
  if (last.endsWith("s") && !/\b(couscous|molasses|bass|citrus|hummus|asparagus|octopus)\b/.test(n)) return "are";
  return "is";
}

function pad(steps: string[]): string[] {
  const out = steps
    .map(finish)
    .filter((s) => s.length >= 8)
    .filter((s, i, arr) => {
      if (arr.length <= 3) return true;
      if (/^taste for salt(?: and pepper)?\.?(?: plate and serve hot\.?| serve hot\.?)?$/i.test(s) && i === arr.length - 1) {
        return arr.slice(0, -1).every((x) => !/serve|plate/i.test(x));
      }
      return true;
    });
  if (out.length < 4) {
    const last = out[out.length - 1] ?? "";
    if (!/\b(serve|plate)\b/i.test(last)) out.push("Plate and serve while it is hot.");
  }
  return out.slice(0, 14);
}

function specialMethod(recipe: MethodRecipe): string[] | null {
  const n = recipe.name.toLowerCase();
  const meat = proteinName(recipe);

  if (recipe.id === "vh-ww2-chipped-beef" || /chipped beef/.test(n)) {
    return [
      "Rinse the dried beef in hot water for 30 seconds to pull some of the salt, then drain and tear it into bite-size shreds.",
      "Melt the butter in a skillet over medium heat. Scatter the flour over the butter and cook 2 minutes, stirring, without letting it brown.",
      "Pour in the milk slowly, stirring the whole time, until the sauce is smooth and thick enough to coat a spoon, 4–5 minutes.",
      "Stir in the shredded beef. Grind black pepper over. Taste before you add salt — the beef is already salty.",
      "Toast the bread. Spoon the creamed beef over the toast and serve at once while the sauce is hot.",
    ];
  }

  if (recipe.id === "vh-va-beaten-biscuits") {
    return [
      "Heat the oven to 400°F. Rub the lard into the flour and salt until the mix looks like coarse meal.",
      "Add cold water a little at a time until a very stiff dough forms. It should not be sticky.",
      "Beat the dough with a rolling pin or mallet 15–20 minutes, until the surface blisters. This is the whole method — do not add yeast.",
      "Roll ½ inch thick. Cut small rounds. Prick each biscuit all over with a fork.",
      "Bake 20–25 minutes, until pale gold and dry in the center. Serve split, with butter or ham.",
    ];
  }

  if (recipe.id === "vh-jw-gefilte" || /gefilte/.test(n)) {
    return [
      "Grind the fish with onion. Mix with eggs, matzo meal, salt, pepper, and a little cold water until sticky.",
      "With wet hands, shape the fish mix into oval quenelles.",
      "Simmer onion, carrot, and water 20 minutes for a broth. Strain, keep the carrot.",
      "Poach the quenelles in the barely simmering broth 30 minutes. Do not boil hard or they break.",
      "Cool in the liquor. Serve cold with horseradish and a slice of the carrot. These are poached, not fried.",
    ];
  }

  if (/churros?/.test(n)) {
    const sugar = named(recipe, /cinnamon sugar|sugar/, "cinnamon sugar");
    const chocolate = named(recipe, /chocolate/, "chocolate");
    return [
      "Bring water, butter, and a pinch of salt to a boil. Take off the heat. Beat in the flour until a dough forms.",
      "Beat in the eggs one at a time until the dough is glossy and holds a peak.",
      "Heat 2 inches of oil to 375°F. Pipe 4-inch lengths of dough into the oil, snipping with scissors.",
      "Fry 2–3 minutes a side, until gold. Drain on paper.",
      chocolate
        ? `Toss in ${sugar} while hot. Serve with warm ${chocolate} for dipping.`
        : `Toss in ${sugar} while hot. Serve right away.`,
    ];
  }

  if (recipe.id === "vn-nice-cream" || /nice cream/.test(n)) {
    return [
      "Keep the bananas frozen until the second you blend. Break them into chunks.",
      "Blend, stopping to scrape the sides, until the mix looks like soft-serve, 2–4 minutes.",
      named(recipe, /cocoa|peanut/, "")
        ? `Add the ${named(recipe, /cocoa/, "cocoa")} and ${named(recipe, /peanut/, "peanut butter")} and blend 10 seconds more.`
        : "Taste. Blend 10 seconds more if it is still chunky.",
      "Scoop into cold bowls and eat at once, or freeze 20 minutes for a firmer scoop.",
      "Do not let it sit out — it melts fast.",
    ];
  }

  if (recipe.id === "it-affogato" || /^affogato\b/.test(n)) {
    const ice = named(recipe, /ice cream|gelato/, "vanilla ice cream");
    const coffee = named(recipe, /espresso|coffee/, "espresso");
    return [
      "Chill small cups or glasses in the freezer for 5 minutes.",
      `Add 1–2 scoops of ${ice} to each cup. Do not let it sit out.`,
      `Brew the ${coffee} so it is hot and strong, about 1–2 ounces per cup.`,
      `Pour the hot ${coffee} over the ice cream at the table so it melts at the edges.`,
      "Serve immediately with a spoon while the espresso is still melting the edges.",
    ];
  }

  if (/quiche/.test(n)) {
    const cheese = named(recipe, /gruyère|gruyere|cheddar|cheese/, "cheese");
    const filling = named(recipe, /bacon|ham|spinach|mushroom/, "bacon");
    return [
      "Heat the oven to 375°F. Blind-bake the crust 12 minutes, until it looks dry at the bottom.",
      `Scatter the ${filling} and the ${cheese} in the crust.`,
      "Beat the eggs with the cream and a pinch of salt. Pour over the filling.",
      "Bake 30–35 minutes, until the center is just set and the top is gold. Rest 10 minutes, then slice.",
    ];
  }

  if (/omelette|omelet/.test(n) && !/spanish tortilla|frittata/.test(n)) {
    const veg = vegList(recipe);
    const cheese = named(recipe, /cheddar|gruyère|cheese/, "");
    return [
      "Beat the eggs with a pinch of salt until the whites and yolks are even.",
      `Melt the butter in a skillet over medium heat until it foams.`,
      veg
        ? `Pour in the eggs. Scatter ${veg}${cheese ? ` and the ${cheese}` : ""} when the edges just set.`
        : `Pour in the eggs. Tilt the pan so the uncooked egg runs to the edges.`,
      "Fold the omelette in half and slide it onto a plate while the middle is still a little soft.",
    ];
  }

  if (/huevos rancheros/.test(n)) {
    return [
      "Chop the tomato, onion, and jalapeño. Simmer in a skillet with a pinch of salt 8–10 minutes, until they slump into a salsa.",
      "Warm the tortillas in a dry pan 20 seconds a side, until they flex.",
      "Fry the eggs in a little oil over medium heat, 2–3 minutes, until the whites set and the yolks stay runny.",
      "Set the tortillas on plates. Top with an egg and a spoon of salsa. Scatter cilantro over.",
    ];
  }

  if (/chilaquiles/.test(n)) {
    return [
      "Cut the tortillas into wedges. Fry or bake until crisp, 8–10 minutes.",
      "Warm the salsa in a skillet. Add the chips and simmer 2–3 minutes, until they soften at the edges but still have crunch.",
      "Fry the eggs in a little oil, 2–3 minutes, until the whites set.",
      "Spoon the chilaquiles onto plates. Top with an egg, crema, cheese, and onion. Serve hot.",
    ];
  }

  if (recipe.id === "ok-chicken-fried-steak" || /chicken-?fried steak/.test(n)) {
    const steaks = named(recipe, /steak/, "cubed steak");
    const flour = named(recipe, /flour/, "flour");
    const buttermilk = named(recipe, /buttermilk/, "buttermilk");
    const milk = named(recipe, /^milk$|whole milk/, "milk");
    const potato = named(recipe, /potato/, "potatoes");
    const oil = named(recipe, /oil|lard/, "oil");
    const butter = named(recipe, /butter/, "butter");
    return [
      `Peel the ${potato} and cut into chunks. Boil in salted water until a fork slides through, 15–18 minutes. Drain. Mash with the ${butter}. Cover and keep warm.`,
      `Season the ${steaks} with salt and black pepper. Put the ${flour} in a shallow dish and the ${buttermilk} in another. Dredge each steak in flour, dip in buttermilk, then flour again, pressing the coating on.`,
      `Heat ½ inch of ${oil} in a wide skillet over medium-high until a pinch of flour sizzles. Fry the steaks 3–4 minutes a side, until the crust is deep gold. Move to a rack. Pour off all but 3 tablespoons of the drippings.`,
      `Whisk 3 tablespoons of the leftover flour into the drippings and cook 1 minute. Slowly whisk in the ${milk}. Simmer 4–5 minutes, until the gravy is thick and peppered. Taste for salt.`,
      `Plate each steak with the mashed potatoes. Spoon the peppered gravy over both. Serve hot.`,
    ];
  }

  if (recipe.id === "hi-loco-moco" || /loco moco/.test(n)) {
    const beef = named(recipe, /ground beef|beef/, "ground beef");
    const rice = named(recipe, /rice/, "cooked rice");
    const eggs = named(recipe, /eggs?/, "eggs");
    const onion = named(recipe, /onion/, "onion");
    const broth = named(recipe, /broth|stock/, "beef broth");
    return [
      `Shape the ${beef} into 4 patties and salt both sides. Sear in a skillet over medium-high heat 3–4 minutes a side, until browned. Move to a plate.`,
      `Add the chopped ${onion} to the drippings and cook 3 minutes. Sprinkle 1 tablespoon flour if the pan is dry, then pour in the ${broth}. Simmer 3–4 minutes, until the gravy thickens. Taste for salt.`,
      `Fry the ${eggs} in the same skillet, or a second pan, until the whites are set and the yolks are still runny, 2–3 minutes.`,
      `Spoon the ${rice} onto plates. Set a patty on the rice, an egg on the patty, and the onion gravy over everything. Serve hot.`,
    ];
  }

  if (recipe.id === "it-panna-cotta" || /panna cotta/.test(n)) {
    const cream = named(recipe, /cream/, "cream");
    const sugar = named(recipe, /sugar/, "sugar");
    const vanilla = named(recipe, /vanilla/, "vanilla");
    const gelatin = named(recipe, /gelatin/, "gelatin");
    const berries = named(recipe, /berr/, "berries");
    return [
      `Bloom the ${gelatin} in 3 tablespoons cold water for 5 minutes.`,
      `Warm the ${cream} and ${sugar} in a saucepan over low heat until the sugar dissolves. Do not boil.`,
      `Take off the heat. Stir in the bloomed ${gelatin} and the ${vanilla} until smooth.`,
      "Pour into cups. Chill the mold at least 4 hours, until the gelatin is set.",
      berries ? `Spoon ${berries} over the top and serve cold.` : "Serve cold, straight from the fridge.",
    ];
  }

  if (/tiramisu/.test(n)) {
    const fingers = named(recipe, /ladyfinger|savoiardi/, "ladyfingers");
    const mascarpone = named(recipe, /mascarpone/, "mascarpone");
    const espresso = named(recipe, /espresso|coffee/, "espresso");
    const yolks = named(recipe, /yolk|egg/, "egg yolks");
    const sugar = named(recipe, /sugar/, "sugar");
    const cocoa = named(recipe, /cocoa/, "cocoa");
    return [
      `Beat the ${yolks} with the ${sugar} until pale, 2 minutes. Fold in the ${mascarpone} until smooth.`,
      `Pour the ${espresso} into a shallow dish. Cool it if it is still hot.`,
      `Dip the ${fingers} quickly in the espresso — one second a side, not soaked through.`,
      "Layer dipped biscuits and mascarpone cream in glasses or a dish.",
      `Dust the top with ${cocoa}. Chill at least 2 hours. Serve cold.`,
    ];
  }

  if (recipe.id === "hp-chicken-prep" || /lemon pepper chicken/.test(n)) {
    return [
      "Heat the oven to 425°F. Pat the chicken thighs dry.",
      "In a bowl, toss the chicken thighs with olive oil, garlic powder, black pepper, salt, and the juice of half the lemon.",
      "Spread the thighs on a sheet pan, skin side up if they have skin. Scatter the broccoli around them. Toss the broccoli with a little oil and salt so it sits in a single layer.",
      "Roast 22 minutes, until the thighs are cooked through (165°F in the thickest part) and the broccoli edges are gold.",
      "Squeeze the rest of the lemon over the tray. Rest 3 minutes, then plate, or box for the week.",
    ];
  }

  if (recipe.id === "hp-lentil-pasta" || /lentil pasta bolognese/.test(n)) {
    return [
      "Bring a large pot of salted water to a boil. Cook the lentil pasta until just shy of al dente, 8–10 minutes. Ladle out a cup of the pasta water and drain.",
      "Warm olive oil in a wide skillet over medium heat. Add the chopped onion and cook 4 minutes, until soft.",
      "Add the mushrooms and cook 5–6 minutes, until they brown and the pan looks dry.",
      "Stir in the lentils and marinara. Simmer 10 minutes, until the sauce is thick. Salt and pepper.",
      "Add the pasta and a splash of pasta water. Toss until every piece is coated. Take off the heat, grate parmesan over, and serve hot.",
    ];
  }

  if (/hot brown/.test(n) || recipe.id === "ky-hot-brown") {
    const bread = named(recipe, /bread|toast/, "white bread");
    const turkey = named(recipe, /turkey/, "turkey slices");
    const bacon = named(recipe, /bacon/, "bacon");
    const milk = named(recipe, /milk/, "milk");
    const cheese = named(recipe, /parmesan|cheese/, "parmesan");
    const tomato = named(recipe, /tomato/, "tomato");
    return [
      `Heat the broiler. Toast the ${bread} on both sides until gold, about 2 minutes a side.`,
      `Cook the ${bacon} in a skillet over medium heat for 6–8 minutes, until crisp. Drain on paper.`,
      `Warm the ${milk} in a saucepan over medium-low. Stir in the ${cheese} until the sauce coats a spoon, 3–4 minutes. Salt and pepper.`,
      `Set the toast on an oven-safe plate. Lay the ${turkey} on the toast. Pour the sauce over the turkey.`,
      `Broil 2–3 minutes, until the sauce is bubbling. Cross the ${bacon} on top${tomato ? ` and add ${tomato} slices` : ""}. Serve hot.`,
    ];
  }

  if (/italian beef/.test(n)) {
    const beef = named(recipe, /beef|roast/, "beef roast");
    const rolls = named(recipe, /roll|bun/, "Italian rolls");
    const giardiniera = named(recipe, /giardiniera|pepper/, "giardiniera");
    return [
      `Heat the oven to 300°F. Salt the ${beef} and set it in a pot with garlic, oregano, and an inch of water.`,
      `Cover and roast 3 hours, until the ${beef} pulls apart with a fork.`,
      `Rest 15 minutes, then slice the ${beef} thin across the grain. Keep the jus.`,
      `Dip the ${rolls} in the jus. Pile on the sliced beef.`,
      `Top with ${giardiniera}. Serve hot while the bread still soaks.`,
    ];
  }

  if (/lobster roll/.test(n)) {
    const lobster = named(recipe, /lobster/, "lobster meat");
    const buns = named(recipe, /bun|roll/, "split-top buns");
    const mayo = named(recipe, /mayonnaise|mayo/, "mayonnaise");
    const lemon = named(recipe, /lemon/, "lemon");
    return [
      `Pick over the ${lobster} and cut any large pieces so they fit the bun.`,
      `Fold the ${lobster} with the ${mayo}, a pinch of salt, and a squeeze of ${lemon}. Or warm it in melted butter instead, 2 minutes.`,
      `Butter the ${buns} and toast them cut-side down 1–2 minutes, until gold.`,
      `Fill each bun with the lobster. Do not overpack.`,
      `Squeeze ${lemon} over. Eat right away so the bun stays crisp at the edges.`,
    ];
  }

  if (/tenderloin sandwich/.test(n)) {
    const pork = named(recipe, /pork|loin/, "pork loin");
    const crumbs = named(recipe, /breadcrumb|cracker/, "breadcrumbs");
    const buns = named(recipe, /bun|roll/, "buns");
    const pickle = named(recipe, /pickle/, "pickle");
    return [
      `Set the ${pork} between two sheets of plastic. Pound it thin, about ¼ inch, so it is wider than the bun.`,
      `Season with salt. Dredge in flour, dip in beaten egg, then coat with ${crumbs}.`,
      `Fry in ½ inch of oil over medium-high heat, 3 minutes a side, until the crust is gold and the pork is cooked through.`,
      `Toast the ${buns} 1 minute, cut side down.`,
      `Set the cutlet on the bun. Add ${pickle} and mustard. Serve hot.`,
    ];
  }

  if (/loco moco/.test(n)) {
    const beef = named(recipe, /beef/, "ground beef");
    const rice = named(recipe, /rice/, "rice");
    const eggs = named(recipe, /egg/, "eggs");
    const broth = named(recipe, /broth|stock/, "beef broth");
    return [
      `Cook the ${rice} and keep it warm. Shape the ${beef} into 4 patties. Salt both sides.`,
      `Sear the patties in a hot skillet 4 minutes a side, until browned and just cooked through. Move to a plate.`,
      `In the same pan, cook chopped onion 4 minutes. Stir in the ${broth} and simmer 3 minutes, until it looks like gravy.`,
      `Fry the ${eggs} sunny-side up in a little fat, 2–3 minutes, whites set and yolks still soft.`,
      `Plate rice, then a patty, then an egg. Spoon the gravy over. Serve hot.`,
    ];
  }

  if (/lahmacun/.test(n)) {
    const dough = named(recipe, /dough|pastry/, "pizza dough");
    const paste = named(recipe, /paste/, "tomato paste");
    const onion = named(recipe, /onion/, "onion");
    const parsley = named(recipe, /parsley/, "parsley");
    const lemon = named(recipe, /lemon/, "lemon");
    return [
      `Heat the oven to 500°F. Mix the ${meat} with ${paste}, chopped ${onion}, ${parsley}, salt, and spices in a bowl until even.`,
      `Roll the ${dough} out thin on a sheet. Spread the meat mixture all the way to the edges.`,
      `Bake at 500°F for 8 minutes, until the edges are browned and crisp.`,
      `Squeeze ${lemon} over the hot flatbread so the meat tastes bright.`,
      `Roll it up and eat right away, while the edges are still crisp.`,
    ];
  }

  if (recipe.id === "spanakopita" || /spanakopita|spanakopitta/.test(n)) {
    return [
      "Heat the oven to 375°F. Wilt the spinach in a wide pan until collapsed, 4–5 minutes. Squeeze it dry in a towel so the filling is not wet.",
      "Mix the spinach with crumbled feta, chopped dill, and the beaten eggs. Salt and pepper.",
      "Brush a baking dish with olive oil. Layer about 6 sheets of phyllo, brushing each sheet with oil.",
      "Spread the spinach filling. Cover with the remaining phyllo, brushing each sheet. Score the top into squares.",
      "Bake 35 minutes at 375°F, until the phyllo is deep gold and shatter-crisp.",
      "Rest 10 minutes so it cuts clean. Serve warm.",
    ];
  }

  if (recipe.id === "palak-paneer" || /palak paneer|saag paneer/.test(n)) {
    return [
      "Blanch the spinach in boiling water 1 minute. Drain, then blend with the ginger and garlic to a smooth puree.",
      "Fry the paneer cubes in a little oil until gold on the edges, 2–3 minutes. Move to a plate.",
      "Cook the chopped onion in the same pan 6–8 minutes, until soft and sweet.",
      "Add the spinach puree and garam masala. Simmer 8–10 minutes.",
      "Fold in the paneer and the cream. Taste for salt. Serve with rice or roti.",
    ];
  }

  if (recipe.id === "poutine" || recipe.id === "in-poutine-home" || /^((weeknight) )?poutine$/.test(n)) {
    const potatoes = named(recipe, /potato|fries/, "potatoes");
    const curds = named(recipe, /curd/, "cheese curds");
    const gravy = named(recipe, /gravy/, "gravy");
    return [
      `Cut the ${potatoes} into fries if they are not already. Soak in cold water 20 minutes. Drain and pat very dry.`,
      "Fry once at 325°F for 5–6 minutes, until pale and just cooked. Drain.",
      "Fry again at 375°F for 2–3 minutes, until deep gold and crisp. Salt.",
      `Heat the ${gravy} until it boils.`,
      `Pile the fries. Scatter room-temperature ${curds}. Ladle the boiling gravy over so the curds squeak and slump. Serve at once.`,
    ];
  }

  if (recipe.id === "ratatouille" || (/ratatouille/.test(n) && recipe.plate === "skillet")) {
    return [
      "Cut the eggplant, zucchini, pepper, tomato, and onion into similar chunks. Salt the eggplant 10 minutes, then pat dry.",
      "Brown the vegetables in batches in olive oil over medium-high heat, 4–5 minutes a batch, until they take color. Do not crowd the pan.",
      "Return everything to the pan with garlic and thyme. Stew on medium-low 30–40 minutes, until jammy.",
      "Taste for salt. Serve warm or at room temperature.",
    ];
  }

  if (recipe.id === "welsh-rarebit") {
    const cheese = named(recipe, /cheese|cheddar/, "cheese");
    const liquid = named(recipe, /ale|beer|milk/, "ale or milk");
    const bread = named(recipe, /toast|bread|sourdough/, "toast");
    return [
      `Toast the ${bread}.`,
      `Melt the ${cheese} with the ${liquid}, mustard, and Worcestershire over low heat, stirring, until smooth. Do not let it boil.`,
      `Spoon over the ${bread}.`,
      "Broil 1–2 minutes, until bubbling and spotted gold.",
      "Serve at once while it is still flowing.",
    ];
  }

  if (recipe.id === "sw-tuna-salad" || /tuna salad sandwich/.test(n)) {
    const bread = named(recipe, /bread/, "sandwich bread");
    return [
      "Drain the tuna well. Mix with mayonnaise, chopped celery, and pickle until it just holds. Do not mash it to paste.",
      `Toast the ${bread} if you want it warm, or leave it soft.`,
      "Lay lettuce on the bread. Spoon the tuna salad on. Close the sandwich and cut.",
    ];
  }

  if (recipe.id === "cp-hot-dogs" || /campfire hot dogs/.test(n)) {
    return [
      "Roast the hot dogs over coals or in a hot skillet, turning, until the skins blister, 6–8 minutes.",
      "Toast the buns cut-side down for 30 seconds if you have a grate.",
      "Set a dog in each bun. Mustard and relish. Eat while it is hot.",
    ];
  }

  if (/duck breast|magret/.test(n)) {
    const shallot = named(recipe, /shallot|onion/, "shallot");
    const wine = named(recipe, /wine/, "red wine");
    const thyme = named(recipe, /thyme/, "thyme");
    const butter = named(recipe, /butter/, "butter");
    return [
      `Pat the ${meat} dry. Score the skin in a crosshatch, cutting the fat not the meat. Salt both sides.`,
      `Set the duck skin-side down in a cold skillet. Cook over medium heat for 8 minutes, until the fat is rendered and the skin is gold.`,
      `Flip the duck and cook 4 minutes on the flesh side. Move the duck to a plate to rest.`,
      `Pour off extra fat, leaving a thin film. Add the ${shallot} and cook 1 minute. Add the ${wine} and ${thyme}, and simmer 2 minutes. Swirl in the ${butter}.`,
      `Slice the duck across the grain and spoon the pan sauce over.`,
    ];
  }

  if (/sloppy joe/.test(n)) {
    const beef = named(recipe, /beef/, "ground beef");
    const onion = named(recipe, /onion/, "onion");
    const ketchup = named(recipe, /ketchup/, "ketchup");
    const buns = named(recipe, /bun|roll/, "hamburger buns");
    const extra = join(namesMatching(recipe, /brown sugar|worcestershire|mustard/i));
    return [
      `Set a wide skillet over medium-high heat. Add the ${beef} and the chopped ${onion}. Cook 6–8 minutes, breaking the meat up with a spoon, until no pink remains. Drain extra fat.`,
      `Stir in the ${ketchup}${extra ? ` and ${extra}` : ""} until the sauce is even.`,
      `Turn the heat to medium-low and simmer 10 minutes, stirring now and then, until the sauce thickens.`,
      `Toast the ${buns} 1–2 minutes, cut side down, until gold.`,
      `Spoon the filling onto the ${buns} and serve hot.`,
    ];
  }

  if (/risotto/.test(n)) {
    const rice = named(recipe, /rice|arborio/, "arborio rice");
    const broth = named(recipe, /broth|stock/, "broth");
    const wine = named(recipe, /wine/, "");
    const cheese = named(recipe, /parmesan|pecorino|cheese/, "parmesan");
    const addins = join(namesMatching(recipe, /mushroom|asparagus|pea|squash|shrimp|lemon/i));
    return [
      `Warm the ${broth} in a saucepan and keep it at a bare simmer.`,
      `Warm ${fat(recipe)} in a wide pan. ${cookAromStep(recipe, "4")} Stir in the ${rice} until the grains look glossy, 1 minute.`,
      wine
        ? `Pour in the ${wine} and stir until it is absorbed. Add the ${broth} a ladle at a time, stirring, until the rice is tender, 18–20 minutes.`
        : `Add the ${broth} a ladle at a time, stirring, until the rice is tender, 18–20 minutes.`,
      addins
        ? `Stir in the ${addins} in the last 5 minutes so they cook through without going slack.`
        : `Taste a grain: it should be tender with a little bite in the center.`,
      `Take off the heat. Stir in the ${cheese} and a knob of ${fat(recipe)}. Rest 1 minute, then plate.`,
    ];
  }

  if (/shakshuka|menemen/.test(n)) {
    const eggs = named(recipe, /egg/, "eggs");
    const tomato = named(recipe, /tomato/, "tomatoes");
    const pepper = named(recipe, /pepper/, "pepper");
    const feta = named(recipe, /feta|cheese/, "");
    const bread = named(recipe, /bread|pita/, "bread");
    return [
      `Set a skillet over medium heat with ${fat(recipe)}. ${pepper ? `Cook chopped ${aromatics(recipe) || pepper} and ${pepper} 6–8 minutes, until soft.` : cookAromStep(recipe, "6–8")}`,
      `Add the ${tomato} and a pinch of salt. Simmer 10 minutes, until the sauce looks thick enough to hold a well.`,
      `Make wells in the sauce with a spoon. Crack in the ${eggs}.`,
      `Cover and cook 5–7 minutes, until the whites are set and the yolks are still soft.`,
      `${feta ? `Scatter ${feta} over. ` : ""}Serve with ${bread}.`,
    ];
  }

  if (/carbonara/.test(n)) {
    const pasta = named(recipe, /pasta|spaghetti|bucatini|linguine/, "spaghetti");
    const pork = named(recipe, /guanciale|pancetta|bacon/, "guanciale");
    const cheese = named(recipe, /pecorino|parmesan|cheese/, "pecorino");
    const eggs = named(recipe, /egg/, "eggs");
    return [
      `Bring a large pot of salted water to a boil. Cook the ${pasta} until just shy of al dente. Ladle out a cup of the pasta water and keep it.`,
      `Meanwhile, cook the ${pork} in a wide skillet over medium heat until the fat renders and the pieces are crisp, 6–8 minutes. Take off the heat.`,
      `Beat the ${eggs} with the ${cheese} and a lot of black pepper in a bowl.`,
      `Tip the drained pasta into the skillet. Toss. Off the heat, add the egg mixture and a splash of pasta water, tossing fast so it turns to a glossy sauce, not scrambled eggs.`,
      `Add more pasta water if it looks tight. Plate right away with extra ${cheese}.`,
    ];
  }

  if (/zaalouk/.test(n)) {
    const eggplant = named(recipe, /eggplant/, "eggplant");
    const tomato = named(recipe, /tomato/, "tomatoes");
    return [
      `Warm ${fat(recipe)} in a pan over medium heat. Add chopped ${eggplant}, ${tomato}${andArom(recipe)}.`,
      `Cook, stirring now and then, 20–25 minutes, until the vegetables collapse and look jammy.`,
      `Mash until mostly smooth, with some texture left.`,
      `Drizzle ${named(recipe, /olive oil/, "olive oil")} over the top. Taste for salt.`,
      `Serve with warm bread, as a salad or a side.`,
    ];
  }

  if (recipe.id === "fr-crepes" || /^(crêpes?|crepes?)(\s|$)/i.test(n) || /crepes? suzette/i.test(n)) {
    const flour = named(recipe, /flour/, "flour");
    const milk = named(recipe, /milk/, "milk");
    const eggs = named(recipe, /egg/, "eggs");
    const lemon = named(recipe, /lemon/, "");
    const sugar = named(recipe, /sugar/, "sugar");
    return [
      `Blend the ${flour}, ${eggs}, ${milk}, melted ${fat(recipe)}, ${sugar}, and a pinch of salt until the batter is smooth. Rest 15 minutes.`,
      `Heat a thin pan over medium heat. Wipe it with a little ${fat(recipe)}.`,
      `Pour in a thin layer of batter and swirl the pan. Cook 45–60 seconds, until the edges lift. Flip and cook 20 seconds more.`,
      lemon
        ? `Sprinkle ${sugar} and squeeze ${lemon} over. Fold the crêpe.`
        : `Fill or sugar the crêpe and fold.`,
      `Serve ${recipe.name.toLowerCase()} hot, as soon as they come out of the pan.`,
    ];
  }

  if (/aglio/.test(n)) {
    const pasta = named(recipe, /pasta|spaghetti/, "spaghetti");
    const garlic = named(recipe, /garlic/, "garlic");
    const flakes = named(recipe, /pepper flake|chile|chili/, "red pepper flakes");
    const parsley = named(recipe, /parsley/, "parsley");
    const oil = named(recipe, /olive oil|oil/, "olive oil");
    return [
      `Bring a large pot of salted water to a boil. Cook the ${pasta} until just shy of al dente, 8–10 minutes. Ladle out a cup of the pasta water and drain.`,
      `Warm the ${oil} in a wide skillet over medium-low. Add sliced ${garlic} and cook 2 minutes, until just gold — do not let it burn.`,
      `Stir in the ${flakes} for 20 seconds, until they smell toasty.`,
      `Add the ${pasta} and a splash of pasta water. Toss over medium heat until every strand is coated and glossy, 1–2 minutes.`,
      `Scatter ${parsley} over. Taste for salt. Serve hot.`,
    ];
  }

  if (/tinga/.test(n)) {
    const chicken = proteinName(recipe);
    const tomato = named(recipe, /tomato/, "tomatoes");
    const chipotle = named(recipe, /chipotle|adobo/, "chipotle");
    const wrap = named(recipe, /tostada|tortilla/, "tostadas");
    return [
      `Cover the ${chicken} with water and a pinch of salt in a pot. Simmer 20 minutes, until it shreds easily.`,
      `Shred the ${chicken} with two forks. Drain, keeping a splash of the broth.`,
      `Sauté ${aromatics(recipe) || "onion"} in ${fat(recipe)} 5 minutes. Blend the ${tomato} with ${chipotle}. Add to the pan with the shredded chicken.`,
      `Simmer 10 minutes, until the sauce clings to the meat. Taste for salt.`,
      `Spoon onto ${wrap} and serve right away.`,
    ];
  }

  return null;
}

function pressureMethod(recipe: MethodRecipe): string[] {
  const n = recipe.name.toLowerCase();
  const meat = proteinName(recipe);
  const mins = [...recipe.steps.join(" ").matchAll(/high pressure (\d+)/gi)].map((m) => Number(m[1]));
  const nat = [...recipe.steps.join(" ").matchAll(/natural(?: release)? (\d+)/gi)].map((m) => Number(m[1]));
  const cookN = mins[0] ?? Math.max(8, Math.round(recipe.minutes * 0.45));
  const natN = nat[0] ?? 10;
  const minWord = cookN === 1 ? "minute" : "minutes";
  const veg = vegList(recipe);
  const liq = liquid(recipe);

  if (/yogurt/.test(n)) {
    const milk = named(recipe, /milk/, "milk");
    const culture = named(recipe, /yogurt/, "yogurt");
    return [
      `Heat the ${milk} to 180°F, then cool it to 110°F.`,
      `Whisk in the ${culture} until smooth.`,
      "Set the Instant Pot to Yogurt for 8 hours.",
      "Chill until cold. Strain through a cloth if you want it Greek-thick.",
      "Spoon into jars and keep in the fridge.",
    ];
  }
  if (recipe.protein === "eggs" && /egg/.test(n)) {
    return [
      "Pour 1 cup of water into the Instant Pot. Set a trivet in the pot and arrange the eggs on it.",
      "Lock the lid. Cook at high pressure for 5 minutes.",
      "Turn the valve to quick-release. Move the eggs to an ice bath for 5 minutes.",
      "Peel and eat, or keep in the fridge.",
    ];
  }
  if (/artichoke|beet/.test(n)) {
    const food = named(recipe, /artichoke|beet/, proteinName(recipe));
    return [
      "Pour 1 cup of water into the Instant Pot. Set a trivet in the pot.",
      `Set the ${food} on the trivet.`,
      `Lock the lid. Cook at high pressure for ${cookN} ${minWord}.`,
      `Let the pressure release naturally for ${natN} minutes, then open the lid.`,
      `Serve the ${food} warm, with oil, lemon, or vinegar if you have it.`,
    ];
  }

  const grain = named(recipe, /quinoa|oats|rice|pasta|noodle|barley/, "");
  if (grain && (recipe.protein === "veg" || recipe.protein === "eggs") && !/soup|chili|stew|curry/.test(n)) {
    return [
      `Add the ${grain}, the ${liq}, and a pinch of salt to the Instant Pot.`,
      `Lock the lid. Cook at high pressure for ${cookN} ${minWord}.`,
      `Let the pressure release naturally for ${natN} minutes, then open the lid.`,
      `Fluff with a fork. ${herbFinish(recipe) || "Taste for salt."}`.trim(),
      "Spoon into bowls and serve.",
    ];
  }
  const sauteMeat = recipe.protein !== "veg" && recipe.protein !== "eggs";
  const addLine = sauteMeat
    ? `Add the ${meat} and cook 4–5 minutes, stirring, until the outside is no longer raw.${veg ? ` Stir in ${veg} and the ${liq}.` : ` Stir in the ${liq}.`} Scrape the bottom of the pot so nothing is stuck.`
    : veg
      ? `Add ${veg} and the ${liq}. Scrape the bottom of the pot so nothing is stuck.`
      : `Add the ${liq}. Scrape the bottom of the pot so nothing is stuck.`;
  return [
    `Set the Instant Pot to Sauté. Heat a spoon of ${fat(recipe)}. ${cookAromStep(recipe, "3")}`,
    addLine,
    `Lock the lid. Cook at high pressure for ${cookN} ${minWord}.`,
    `Let the pressure release naturally for ${natN} minutes, then open the lid.`,
    "Taste for salt. If the sauce is thin, simmer on Sauté 3–5 minutes. Ladle and serve.",
  ];
}

function drinkMethod(recipe: MethodRecipe): string[] {
  const n = recipe.name.toLowerCase();
  const list = join(recipe.ingredients.map((i) => i.name).slice(0, 6));
  if (/cocoa|hot chocolate|toddy|mulled|buttered rum/.test(n)) {
    const chocolate = named(recipe, /chocolate|cocoa/, "chocolate");
    const dairy = named(recipe, /milk|cream/, "milk");
    const sugar = named(recipe, /sugar/, "sugar");
    const top = named(recipe, /whipped cream|marshmallow/, "");
    return [
      `Get out ${list}. Chop the ${chocolate} if it is in a bar.`,
      `Warm the ${dairy} in a saucepan over medium-low until it steams, not boils.`,
      `Whisk in the ${chocolate} and the ${sugar} until the drink is smooth and no streaks remain.`,
      named(recipe, /vanilla/, "")
        ? `Stir in ${named(recipe, /vanilla/, "vanilla")}. Taste.`
        : "Taste. Add a pinch of salt if it tastes flat.",
      top ? `Pour into mugs and top with ${top}. Serve hot.` : "Pour into mugs and serve hot.",
    ];
  }
  return [
    `Get out ${list}. Chill a pitcher or the glasses.`,
    "Whisk or blend the ingredients until even, with no streaks of yolk or undissolved sugar.",
    "Taste and adjust sweet, sour, or spirit.",
    "Chill at least 30 minutes so it is cold through.",
    "Pour and grate nutmeg or add ice if that is how you drink it.",
  ];
}

function rubMethod(recipe: MethodRecipe): string[] {
  const list = join(recipe.ingredients.map((i) => i.name).slice(0, 6));
  return [
    `Get out ${list}.`,
    `Mix in a bowl until even, with no clumps of salt or sugar.`,
    "Pat chicken, fish, or vegetables dry.",
    `Rub the mix on all sides. Rest 30 minutes on the counter, or overnight in the fridge.`,
    `This is a seasoning, not a skillet dinner. Cook the food how you like after it rests.`,
  ];
}

function sauceMethod(recipe: MethodRecipe): string[] {
  const list = join(recipe.ingredients.map((i) => i.name).slice(0, 6));
  const mins = Math.max(3, Math.min(20, recipe.minutes));
  if (/vinaigrette|dressing/.test(recipe.name.toLowerCase())) {
    return [
      `Get out ${list}.`,
      `Whisk the vinegar or lemon with mustard, salt, and pepper until the salt dissolves.`,
      `Slowly whisk in the oil until the dressing looks creamy and holds together.`,
      `Taste: it should be bright, not oily. Add a pinch of salt if it tastes flat.`,
      `Use right away, or chill and shake before you dress the salad.`,
    ];
  }
  return [
    `Get out ${list}. Set a small saucepan over medium-low heat.`,
    `Melt ${fat(recipe)}. Stir in any flour or starch and cook 1 minute if the sauce needs a thickener.`,
    `Whisk in the liquids a little at a time so it stays smooth. Simmer ${mins} minutes, stirring.`,
    `Stir in the remaining flavorings. Taste for salt, acid, and heat.`,
    `Keep warm and spoon over the food it belongs with. Do not boil it hard at the end.`,
  ];
}

function pastaMethod(recipe: MethodRecipe): string[] {
  const pasta = starch(recipe) || named(recipe, /pasta|noodle|spaghetti|penne|linguine|fettuccine|macaroni|gnocchi/, "pasta");
  const sauceBits = join(
    namesMatching(recipe, /tomato|cream|anchovy|clam|pesto|cheese|bacon|mushroom|lemon|pepper|basil|parsley|chile|chili|flake/i).filter(
      (n) => !new RegExp(pasta, "i").test(n) && !/olive oil|^oil$|garlic/i.test(n),
    ),
  );
  return [
    `Bring a large pot of salted water to a boil. Cook the ${pasta} until just shy of al dente, 8–10 minutes. Ladle out a cup of the pasta water and drain.`,
    `Meanwhile, warm ${fat(recipe)} in a wide skillet over medium heat. ${cookAromStep(recipe, "2–3")}`,
    sauceBits
      ? `Add ${sauceBits}. Cook 4–6 minutes, until the sauce looks together.`
      : `Add a splash of the pasta water and simmer 2 minutes.`,
    `Add the ${pasta} to the skillet with a splash of pasta water. Toss over medium heat until the sauce coats every strand and looks glossy, 1–2 minutes.`,
    named(recipe, /parmesan|pecorino|cheese/, "")
      ? `Take off the heat. Toss with ${named(recipe, /parmesan|pecorino|cheese/, "parmesan")}. ${endPlate(recipe, "Serve right away.")}`
      : endPlate(recipe, "Serve right away, while the sauce is still glossy."),
  ];
}

function soupMethod(recipe: MethodRecipe): string[] {
  const meat = proteinName(recipe);
  const times = allHintMinutes(recipe);
  const simmerN = times[0] ?? Math.max(15, recipe.minutes - 15);
  const lastN = times[1] ?? 8;
  const lastIng = named(recipe, /noodle|vermicelli|pasta|orzo|rice/, "");
  const lastAdd =
    lastIng && /vermicelli/i.test(lastIng) ? `${lastIng} noodles` : lastIng;
  const veg = vegList(recipe);
  const liq = liquid(recipe);
  const vegBit =
    veg ||
    named(recipe, /lentil|chickpea|bean|tomato(?! juice)|potato/, "") ||
    (recipe.protein === "veg" || recipe.protein === "eggs" ? proteinName(recipe) : "");
  const liquidBit = liq && vegBit && vegBit.toLowerCase() === liq.toLowerCase() ? "" : liq;
  return [
    `Get out the ingredients.${aromatics(recipe) ? ` Dice ${aromatics(recipe)}.` : ""} Chop the vegetables.`,
    `Warm ${fat(recipe)} in a heavy pot over medium heat. ${cookAromStep(recipe, "5–6")}`,
    recipe.protein === "veg" || recipe.protein === "eggs"
      ? `Add ${vegBit || "the vegetables"}${liquidBit ? `, then the ${liquidBit}` : ""}. Bring to a simmer. Cook ${simmerN} minutes, until tender.`
      : `Add the ${meat}${liquidBit ? `, then the ${liquidBit}` : ""}. Bring to a simmer. Cook ${simmerN} minutes, skimming any foam.`,
    lastAdd
      ? `Add the ${lastAdd} and cook ${lastN} minutes, until tender. Season with salt.`
      : `Add any quick-cooking vegetables now. Simmer ${lastN} minutes more. Season with salt.`,
    `${endPlate(recipe, `Ladle into warm bowls.`)}`,
  ];
}

function roastMethod(recipe: MethodRecipe): string[] {
  if (/pudding|custard|cake|muffin|cookie|pie|tart|bread|gems|waffle/.test(recipe.name.toLowerCase()) && recipe.protein === "veg") {
    return dessertMethod(recipe);
  }
  const temp = ovenTemp(recipe);
  const meat = proteinName(recipe);
  const roastN = hintMinutes(recipe, Math.max(18, recipe.minutes - 10));
  const veg = vegList(recipe);
  const isFlat = /pizza|flatbread|lahmacun|socca|naan|pide|galette/.test(recipe.name.toLowerCase());
  if (isFlat) {
    const dough = named(recipe, /dough|pastry|flour/, "dough");
    const topping = join(recipe.ingredients.map((i) => i.name).filter((n) => !/dough|pastry|flour|water|yeast|salt/i.test(n)).slice(0, 5));
    return [
      `Heat the oven to ${temp}°F.`,
      `Roll the ${dough} out thin on a sheet.`,
      topping
        ? `Spread ${topping} over the dough, going almost to the edges.`
        : `Spread the topping over the dough, going almost to the edges.`,
      `Bake at ${temp}°F for ${Math.min(15, roastN)} minutes, until the edges are browned and crisp.`,
      `Squeeze lemon over if you have it. Serve hot while the edges are still crisp.`,
    ];
  }
  const meaty = recipe.protein !== "veg" && recipe.protein !== "eggs";
  return [
    `Heat the oven to ${temp}°F. Pat the ${meat} dry. Salt it well.`,
    meaty
      ? `Rub with ${fat(recipe)} and the spices. Set in a roasting pan or on a sheet.`
      : `Toss the ${veg} with ${fat(recipe)}, salt, and the herbs. Spread in a single layer on a sheet.`,
    meaty && veg
      ? `Scatter ${veg} around the pan. Roast ${roastN} minutes, until the ${meat} ${cookedBe(meat)} cooked through and the edges are gold.`
      : `Roast ${roastN} minutes, until cooked through and browned at the edges.`,
    meaty
      ? `Rest 8–10 minutes so the juices settle. Slice across the grain.`
      : `Taste a piece: it should be tender, not dry. Toss with any pan juices.`,
    meaty
      ? `Squeeze lemon over if you have it. Plate and serve hot.`
      : `Plate and serve hot.`,
  ];
}

function skilletMethod(recipe: MethodRecipe): string[] {
  const meat = proteinName(recipe);
  const veg = vegList(recipe);
  const sauce = join(namesMatching(recipe, /wine|tomato|cream|stock|broth|soy|mustard|lemon|capers|butter/i));
  const searN = recipe.minutes <= 20 ? "3–4" : "4–5";
  if (recipe.protein === "eggs") {
    return [
      `Get out the eggs and the rest of the ingredients. Beat the eggs with a pinch of salt.`,
      `Set a skillet over medium heat with ${fat(recipe)}. ${cookAromStep(recipe, "3–4")}`,
      veg
        ? `Add ${veg} and cook 3–5 minutes, until they give up some water.`
        : `Keep the heat on medium so the eggs will set gently.`,
      `Pour in the eggs. Stir gently until they are just set, 2–4 minutes. Take off the heat while they still look a little wet.`,
      `${endPlate(recipe, "Serve hot, with bread if you have it.")}`,
    ];
  }
  if (recipe.protein === "veg") {
    return [
      `Set a wide skillet over medium-high heat with ${fat(recipe)}.`,
      `${cookAromStep(recipe, "3–4")}`,
      `Add ${veg || proteinName(recipe)}. Cook 6–10 minutes, stirring now and then, until browned in spots and tender.`,
      sauce
        ? `Stir in ${sauce}. Simmer 2–4 minutes, until the pan looks saucy, not dry.`
        : `Salt. Taste a piece: it should be tender with browned edges.`,
      `${endPlate(recipe)}`,
    ];
  }
  if (isGroundMeat(recipe)) {
    return [
      `Set a wide skillet over medium-high heat with a film of ${fat(recipe)}. Add the ${meat}${andArom(recipe)}.`,
      `Cook 6–8 minutes, breaking the meat up with a spoon, until no pink remains. Drain extra fat.`,
      veg ? `Add ${veg} and cook 3–4 minutes, until they soften.` : `Keep the heat on medium.`,
      sauce
        ? `Stir in ${sauce}. Simmer 4–6 minutes, until the sauce clings to the meat.`
        : `Season with salt and pepper. Taste.`,
      `${endPlate(recipe)}`,
    ];
  }
  return [
    `Pat the ${meat} dry. Salt both sides. Set a wide skillet over medium-high heat with a film of ${fat(recipe)}.`,
    `Sear the ${meat} ${searN} minutes per side, until browned. Move to a plate.`,
    `In the same pan, ${cookAromStep(recipe, "3–4").replace(/^([A-Z])/, (c) => c.toLowerCase())}${veg ? ` Add ${veg} if they still need cooking.` : ""}`,
    sauce
      ? `Add ${sauce}. Simmer 3–5 minutes, scraping the browned bits. Return the ${meat} to the pan to heat through, 2 minutes.`
      : `Return the ${meat} to the pan. Cook 2 minutes more, until cooked through.`,
    `${endPlate(recipe, `Plate the ${meat} and spoon the pan juices over.`)}`,
  ];
}

function tacoMethod(recipe: MethodRecipe): string[] {
  const meat = proteinName(recipe);
  const wrap = named(recipe, /tortilla|taco shell|lettuce|tostada|pita|wrap/, "tortillas");
  const topping = join(namesMatching(recipe, /cabbage|salsa|avocado|cheese|cilantro|onion|lime|crema|sour cream|pickle|tomato/i));
  if (recipe.protein === "eggs") {
    return [
      `Scramble the eggs over medium-low heat until just set, still a little wet.`,
      `Warm the ${wrap} in a dry pan 15 seconds a side so they flex.`,
      topping
        ? `Spoon the eggs into the ${wrap}. Top with ${topping}.`
        : `Spoon the eggs into the ${wrap}.`,
      `Roll tight. Serve hot.`,
    ];
  }
  return [
    `Set a skillet over medium-high heat with ${fat(recipe)}. Add the ${meat}${andArom(recipe)}.`,
    isGroundMeat(recipe)
      ? `Cook 6–8 minutes, stirring, until the filling is browned and cooked through. Salt to taste.`
      : `Cook 4–6 minutes per side, until cooked through. Salt to taste. Slice if needed.`,
    `Warm the ${wrap} in a dry pan 20–30 seconds a side, until they flex.`,
    topping
      ? `Spoon the filling into the ${wrap}. Top with ${topping}.`
      : `Spoon the filling into the ${wrap}.`,
    `Squeeze lime over if you have it. Serve right away so the ${wrap} stay tender.`,
  ];
}

function toastMethod(recipe: MethodRecipe): string[] {
  const bread = named(recipe, /bun|bread|toast|roll|bagel|english muffin|baguette/, "bread");
  const meat = proteinName(recipe);
  const n = recipe.name.toLowerCase();
  const blob = hintText(recipe);

  if (
    /\b(pancake|waffle|crêpe|crepe|muffin|scone|biscuit|dough|cinnamon roll|soda bread|no-knead|pizza bagel|bagel pizza|pizza muffin)\b/.test(
      n,
    ) ||
    (/\b(flour|yeast|cornmeal|pumpkin puree)\b/.test(meat) && !/sandwich|burger|toast|bagel/.test(n))
  ) {
    return dessertMethod(recipe);
  }

  if (/bagel|bread|muffin|toast|roll|bun|baguette/.test(meat)) {
    const topping = join(
      recipe.ingredients.filter((i) => !/bagel|bread|muffin|toast|roll|bun|baguette/.test(i.name)).map((i) => i.name).slice(0, 5),
    );
    return [
      `Split and toast the ${bread} until the cut side is gold.`,
      topping ? `Spoon ${topping} over the ${bread}.` : `Add the topping.`,
      /pizza|broil/.test(`${n} ${blob}`)
        ? `Broil 3–5 minutes, until the cheese bubbles and browns in spots.`
        : `Serve at once so the ${bread} stays crisp.`,
      `Serve hot.`,
    ];
  }

  if (isGroundMeat(recipe)) {
    const sauce = join(namesMatching(recipe, /ketchup|mustard|bbq|barbecue|worcestershire|mayo/i));
    return [
      `Set a wide skillet over medium-high heat. Add the ${meat}${andArom(recipe)}. Cook 6–8 minutes, breaking it up, until no pink remains. Drain extra fat.`,
      sauce
        ? `Stir in ${sauce}. Simmer 8–10 minutes on medium-low, until the sauce clings to the meat.`
        : `Season with salt and pepper. Keep warm.`,
      `Toast the ${bread} 1–2 minutes, cut side down, until gold.`,
      `Spoon the filling onto the ${bread}.`,
      `Serve hot so the bread stays crisp.`,
    ];
  }

  const coldFill = /smoked salmon|lox|pâté|pate|sardine|tuna salad|cream cheese|tomato|avocado/.test(`${meat} ${n} ${blob}`);
  if (coldFill && recipe.protein !== "eggs") {
    const spread = named(recipe, /cream cheese|mayo|mayonnaise|butter|hummus/, "");
    const topping = join(
      recipe.ingredients.filter((i) => !/bread|bagel|toast|roll|bun|english muffin|baguette/.test(i.name)).map((i) => i.name).slice(0, 5),
    );
    return [
      `Toast the ${bread} on both sides until gold, about 1–2 minutes a side.`,
      spread ? `Spread the ${spread} on the ${bread}.` : `Lay the ${bread} on plates.`,
      topping ? `Pile ${topping} on top.` : `Lay the filling on the ${bread}.`,
      `Serve at once so the ${bread} stays crisp.`,
    ];
  }

  if (recipe.protein === "eggs") {
    return [
      `Toast the ${bread} on both sides until gold, about 1–2 minutes a side.`,
      `Fry the eggs in a little butter over medium heat, 2–3 minutes, until the whites set.`,
      `Lay the eggs on the ${bread}. Spoon any cheese or sauce over the top.`,
      `Serve right away so the bread stays crisp.`,
    ];
  }

  return [
    `Toast the ${bread} on both sides until gold, about 1–2 minutes a side.`,
    /slices?|deli|leftover|roast|\bham\b/.test(meat)
      ? `Warm the ${meat} in a skillet 1–2 minutes a side, just until hot. Do not brown it hard or it will dry out.`
      : `Cook the ${meat}${andArom(recipe)} in a skillet over medium heat, 4–6 minutes, until cooked through.`,
    `Lay the ${meat} on the ${bread}. Spoon any sauce or cheese over the top.`,
    `Serve right away so the bread stays crisp.`,
  ];
}

function saladMethod(recipe: MethodRecipe): string[] {
  const greens = named(recipe, /lettuce|romaine|frisée|spinach|arugula|cabbage|greens/, "the greens");
  const dressing = join(namesMatching(recipe, /oil|vinegar|lemon|dijon|mustard|garlic|anchovy/i));
  const extras = join(namesMatching(recipe, /tomato|cucumber|olive|onion|egg|cheese|crouton|avocado|bean|tuna|chicken/i));
  return [
    `Wash and dry ${greens}. Tear into bite-size pieces and put them in a wide bowl.`,
    dressing
      ? `Whisk ${dressing} with a pinch of salt until the dressing looks even.`
      : `Stir olive oil with lemon or vinegar and a pinch of salt.`,
    extras ? `Add ${extras} to the bowl.` : `Keep the bowl ready.`,
    `Toss with just enough dressing to coat the leaves, not drown them.`,
    `Taste a leaf for salt. Serve ${recipe.name.toLowerCase()} right away.`,
  ];
}

function curryMethod(recipe: MethodRecipe): string[] {
  const meat = proteinName(recipe);
  const spice = named(recipe, /curry|garam|berbere|chili powder|cumin|turmeric|paprika/, "the spices");
  const liq = liquid(recipe);
  const simmerN = hintMinutes(recipe, Math.max(15, recipe.minutes - 10));
  const rice = named(recipe, /rice|naan|roti|couscous/, "rice");
  return [
    `Set a heavy pot over medium heat with ${fat(recipe)}. ${cookAromStep(recipe, "6–8")}`,
    `Stir in ${spice} and cook 30–60 seconds, until the pot smells like the spices.`,
    recipe.protein === "veg"
      ? `Add ${vegList(recipe)} and the ${liq}. Stir.`
      : `Add the ${meat} and the ${liq}. Stir so nothing is stuck on the bottom.`,
    `Simmer gently ${simmerN} minutes, until the sauce thickens and the ${meat} is tender. Salt to taste.`,
    `${endPlate(recipe, `Serve with ${rice}.`)}`,
  ];
}

function dessertMethod(recipe: MethodRecipe): string[] {
  const n = recipe.name.toLowerCase();
  const list = join(recipe.ingredients.map((i) => i.name).slice(0, 6));
  const blob = hintText(recipe);
  const ice = named(recipe, /ice cream|gelato|nice cream/, "");
  const coffee = named(recipe, /espresso|coffee/, "");
  if (/affogato/.test(n) || (ice && coffee && /espresso|affogato/.test(n))) {
    return specialMethod({ ...recipe, id: recipe.id ?? "it-affogato", name: "Affogato" }) ?? [
      "Chill cups. Scoop vanilla ice cream. Pour hot espresso over. Serve at once.",
    ];
  }
  if (/nice cream/.test(n) || named(recipe, /frozen banana/, "")) {
    return specialMethod({ ...recipe, id: recipe.id ?? "vn-nice-cream", name: "Banana nice cream" }) ?? [
      "Blend frozen bananas until they look like soft-serve. Scoop and eat at once.",
    ];
  }
  if (ice) {
    return [
      `Get out the ${ice} and keep it frozen until the second you scoop.`,
      named(recipe, /sauce|caramel|chocolate|berry|espresso/, "")
        ? `Scoop into cold bowls. Spoon ${named(recipe, /sauce|caramel|chocolate|berry|espresso/, "the topping")} over.`
        : "Scoop into cold bowls.",
      "Do not stir the scoops together. Ice cream is served as it is, not mixed.",
      "Serve immediately.",
      `Eat ${recipe.name.toLowerCase()} before it melts.`,
    ];
  }

  const noBake =
    /\b(panna cotta|affogato|mousse|chia|yogurt|gelato|ice cream|nice cream|bark|pops?|ambrosia|fudge|pralines?|brittle|icing|frosting|fondant|horchata|pots de cr[eè]me|boiled custard|matcha pudding|whip|float|trifle|curds and cream|sugared grapes|rum balls|popcorn balls|candied|stewed|grilled peach|cinnamon apple|fried peach|banana boat|s['’]?mores|horchata|no-bake)\b/.test(
      n,
    );
  const bakedKind =
    /\b(cake|cookies?|pie|tarts?|crust|cobbler|crisp|brownies?|muffins?|gingerbread|doughnuts?|fritters?|dumplings?|galette|turnover|pandowdy|shortnin|jelly roll|upside-down|banana bread|yorkshire|souffl[eé]|biscuits?|scones?|grunt|chess pie|pudding|spoon bread|clafoutis|flan|cheesecakes?|rugelach)\b/.test(
      n,
    );
  const hasFlour = recipe.ingredients.some((i) => /\b(flour|self-rising|cornmeal|pastry|phyllo|puff pastry|tart shells?)\b/.test(i.name));
  const baked = !noBake && (/bake|oven|roast|preheat/.test(blob) || bakedKind || (hasFlour && /cake|cookie|pie|bread|tart|crust/.test(n)));

  if (!baked) {
    if (/s['’]?mores/.test(n)) {
      return [
        "Toast the marshmallows over a flame or under a broiler until the outside is gold and the inside is molten.",
        "Sandwich each marshmallow with a square of chocolate between two graham crackers.",
        "Press gently so the chocolate melts. Eat at once, while it is still warm.",
      ];
    }
    if (/rum balls/.test(n)) {
      return [
        "Crush the wafers. Mix with cocoa, rum, sugar, and syrup until the mix holds together.",
        "Roll into balls with wet hands. Toss in extra sugar or cocoa.",
        "Chill at least 1 hour so they firm up. Serve cold.",
      ];
    }
    if (/sugared grapes/.test(n)) {
      return [
        "Dip grapes in lightly beaten egg white, letting extra drip off.",
        "Roll in sugar until coated.",
        "Dry on a rack 30 minutes. Serve cold.",
      ];
    }
    if (/\bbark\b/.test(n)) {
      return [
        "Line a sheet with parchment. Spread yogurt in a thin even layer.",
        "Scatter berries and coconut over the top. Press them in lightly.",
        "Freeze at least 3 hours. Break into shards and keep frozen.",
      ];
    }
    if (/matcha/.test(n)) {
      return [
        "Whisk matcha, sugar, and starch into cold milk until no lumps remain.",
        "Cook over medium heat, stirring, until thick, 4–6 minutes. Do not boil hard.",
        "Stir in vanilla. Spoon into cups. Chill until cold.",
      ];
    }
    if (/yogurt/.test(n) && /berr/.test(n)) {
      return [
        "Spoon the yogurt into bowls.",
        "Scatter the berries and pistachios or nuts over the top.",
        "Drizzle with honey. Serve cold.",
      ];
    }
    if (/pops?/.test(n)) {
      return [
        `Stir ${list} until even.`,
        "Spoon into popsicle molds, tapping to knock out air.",
        "Freeze at least 4 hours, until solid.",
        "Run a mold under warm water 3 seconds to release.",
        `Eat ${recipe.name.toLowerCase()} frozen.`,
      ];
    }
    if (named(recipe, /gelatin/, "")) {
      return [
        `Bloom the gelatin in 3 tablespoons cold water for 5 minutes.`,
        `Warm the dairy and sugar over low heat until the sugar dissolves. Do not boil.`,
        `Take off the heat. Stir in the bloomed gelatin until smooth.`,
        "Pour into cups. Chill the mold at least 4 hours, until the gelatin is set.",
        `Serve ${recipe.name.toLowerCase()} cold.`,
      ];
    }
    if (/chia/.test(n) || named(recipe, /chia/, "")) {
      const chia = named(recipe, /chia/, "chia seeds");
      const milk = named(recipe, /milk|coconut|yogurt/, "milk");
      return [
        `Stir the ${chia} into the ${milk} until no dry seeds sit on top.`,
        "Rest 10 minutes, then stir again so the seeds don't clump.",
        "Cover and chill at least 2 hours, or overnight.",
        named(recipe, /cocoa|chocolate|berry|mango/, "")
          ? `Stir in ${named(recipe, /cocoa|chocolate|berry|mango/, "the flavoring")} before serving.`
          : "Stir once more. Add a pinch of salt if it tastes flat.",
        `Spoon ${recipe.name.toLowerCase()} into bowls and eat cold.`,
      ];
    }
    if (/fudge|praline|brittle|caramel|fondant/.test(n)) {
      return [
        `Get out ${list}. Line a pan with parchment.`,
        `Melt the sugar and dairy in a saucepan over medium heat, stirring, until smooth and thick.`,
        "Take off the heat. Stir in the remaining flavorings.",
        "Pour into the pan. Cool until firm, about 1 hour.",
        "Cut or break into pieces. Store airtight.",
      ];
    }
    if (/icing|frosting/.test(n)) {
      return [
        `Get out ${list}.`,
        "Beat until smooth and spreadable, 2–3 minutes. Add a splash of liquid if it is stiff, more sugar if it is loose.",
        "Taste. It should be sweet and hold a peak.",
        "Use right away, or cover and keep cool.",
        `Spread ${recipe.name.toLowerCase()} on a cooled cake.`,
      ];
    }
    if (/grilled peach|cinnamon apple|fried peach|stewed|banana boat/.test(n)) {
      const fruit = named(recipe, /peach|apple|prune|kumquat|banana|berry|fruit/, "fruit");
      return [
        `Get a skillet hot over medium heat with ${fat(recipe)}.`,
        `Add the ${fruit} and cook 6–8 minutes, until soft and the edges brown.`,
        named(recipe, /cinnamon|sugar|honey|butter/, "")
          ? `Add ${named(recipe, /cinnamon|sugar|honey|butter/, "the seasoning")} and toss 1 minute more.`
          : "Toss so every piece is coated.",
        "Take off the heat.",
        `Serve ${recipe.name.toLowerCase()} warm.`,
      ];
    }
    if (/mousse|whip/.test(n)) {
      return [
        `Get out ${list}. Chill the bowl 10 minutes if you can.`,
        "Beat until thick and it holds a soft peak, 2–4 minutes.",
        "Taste. Fold, don't stir, if you are adding a flavoring.",
        "Spoon into cups. Chill at least 1 hour.",
        `Serve ${recipe.name.toLowerCase()} cold.`,
      ];
    }
    return [
      `Get out ${list}.`,
      "Stir until even.",
      "Spoon into cups or a dish.",
      "Chill until cold — at least 1 hour if it needs to set.",
      `Serve ${recipe.name.toLowerCase()} cold.`,
    ];
  }

  const temp = ovenTemp(recipe);
  const bakeN = hintMinutes(recipe, Math.max(18, recipe.minutes - 10));
  return [
    `Heat the oven to ${temp}°F. Butter a baking dish.`,
    `Get out ${list}. Mix the batter or filling until even.`,
    `Scrape into the dish and smooth the top.`,
    `Bake at ${temp}°F for ${bakeN} minutes, until set in the center. A knife in the middle should come out with just a little moisture, not wet batter.`,
    `Cool 10 minutes. Serve ${recipe.name.toLowerCase()} warm or at room temperature.`,
  ];
}

function fishMethod(recipe: MethodRecipe): string[] {
  const fish = proteinName(recipe);
  const lemon = named(recipe, /lemon|lime/, "lemon");
  return [
    `Pat the ${fish} dry. Salt both sides. Get a skillet hot over medium-high with ${fat(recipe)}.`,
    `Lay the ${fish} in the pan. Cook 3–4 minutes without moving, until the edges turn opaque and the underside is gold.`,
    `Flip once. Cook 2–4 minutes more, until the flesh flakes and the center is just opaque.`,
    `Add a knob of ${fat(recipe)} and the ${lemon} to the pan. Spoon the foaming fat over the fish for 30 seconds.`,
    `${endPlate(recipe, "Serve right away.")}`,
  ];
}

function bowlMethod(recipe: MethodRecipe): string[] {
  if (/mash|dip|spread|salad/.test(hintText(recipe)) && recipe.protein === "veg") {
    const main = vegList(recipe);
    return [
      `Cook ${main}${andArom(recipe)} in ${fat(recipe)} over medium heat until very soft, 15–20 minutes.`,
      `Mash or stir until the texture you want: mostly smooth, with some pieces left.`,
      `Season with salt. Stir in any remaining spices.`,
      endPlate(recipe, "Serve with bread, rice, or as a side."),
    ];
  }
  const grain = named(recipe, /rice|quinoa|couscous|bulgur|farro|noodle/, "");
  const meat = proteinName(recipe);
  if (grain) {
    const veg = vegList(recipe);
    const vegProtein = recipe.protein === "veg" || recipe.protein === "eggs";
    const leftoverGrain = /cooked|leftover|day-old/.test(grain);
    const leftoverMeat = /cooked|leftover|rotisserie|shredded/.test(meat);
    return [
      leftoverGrain
        ? `Fluff the ${grain}. Warm it in a skillet or the microwave until hot.`
        : `Cook the ${grain} in salted water according to the package, until tender. Drain if needed and keep warm.`,
      leftoverMeat
        ? `Warm the ${meat}${andArom(recipe)} in a skillet with ${fat(recipe)} 2–3 minutes, just until hot.`
        : vegProtein
          ? `Set a skillet over medium-high heat with ${fat(recipe)}. ${veg ? `Add ${veg}${andArom(recipe)} and cook 3–5 minutes, until just tender.` : cookAromStep(recipe, "3–4")}`
          : `Set a skillet over medium-high heat with ${fat(recipe)}. Cook the ${meat}${andArom(recipe)} 6–8 minutes, until cooked through.`,
      !vegProtein && veg && !leftoverMeat
        ? `Add ${veg} and cook 3–5 minutes more, until just tender. Season with salt.`
        : `Season with salt. Taste.`,
      `Spoon over the ${grain}. ${endPlate(recipe)}`,
    ];
  }
  return skilletMethod(recipe);
}

function isAirFry(recipe: MethodRecipe): boolean {
  return (recipe.tags ?? []).includes("air-fryer") || /air-?fryer/.test(recipe.name.toLowerCase());
}

function isSlowCook(recipe: MethodRecipe): boolean {
  return (recipe.tags ?? []).includes("slow-cooker") || /slow-?cooker|crockpot/.test(recipe.name.toLowerCase());
}

function isColdMix(recipe: MethodRecipe): boolean {
  if (isSlowCook(recipe) || isPressure(recipe) || isAirFry(recipe)) return false;
  if (isSandwichLike(recipe)) return false;
  const name = recipe.name.toLowerCase();
  const tags = (recipe.tags ?? []).join(" ").toLowerCase();
  if (/\b(wrap|taco|quesadilla|panini|sandwich|burger)\b/.test(name)) return false;
  if (/hummus/.test(name) && /\b(bowl|plate|wrap|salad)\b/.test(name)) return false;
  if (
    (recipe.plate === "green" || /\bsalad\b/.test(name) || /\bsalad\b/.test(tags)) &&
    !/parfait|overnight oats|muesli|bircher/.test(`${name} ${tags}`)
  ) {
    return false;
  }
  const hint = `${recipe.id ?? ""} ${name} ${tags}`.toLowerCase();
  if (
    /overnight oats|parfait|hummus|bircher|muesli|yogurt bowl|yogurt breakfast|cottage bowl|cottage cheese bowl|smoked trout|poke|hiyayakko|chilled tofu|tuna rice/.test(
      hint,
    )
  ) {
    return true;
  }
  const steps = recipe.steps.join(" ").toLowerCase();
  if (/stir everything in a jar/.test(steps)) return true;
  if (
    /fridge overnight|eat cold/.test(steps) &&
    /oat|muesli|parfait|bircher|yogurt/.test(`${hint} ${steps}`)
  ) {
    return true;
  }
  return false;
}

function isSandwichLike(recipe: MethodRecipe): boolean {
  const n = recipe.name.toLowerCase();
  const tags = recipe.tags ?? [];
  return (
    tags.includes("sandwich") ||
    /wrap|quesadilla|panini|reuben|nachos|cuban sandwich|club sandwich|chicken salad|egg salad|chickpea salad|tuna salad|salad sandwich|muffuletta/.test(n)
  );
}

function isSauceName(recipe: MethodRecipe): boolean {
  const n = recipe.name.toLowerCase();
  if (/oyster dressing|cornbread dressing|bread stuffing|sage dressing/.test(n)) return false;
  return (
    (recipe.tags ?? []).includes("sauce") ||
    /sauce|gravy|vinaigrette|aioli|pesto|ranch|mayonnaise dressing|french dressing/.test(n)
  );
}

function mixJarMethod(recipe: MethodRecipe): string[] {
  const list = join(recipe.ingredients.map((i) => i.name).slice(0, 6));
  const n = `${recipe.id ?? ""} ${recipe.name}`.toLowerCase();
  if (/hummus|dip/.test(n)) {
    return [
      `Blend ${list} until smooth, scraping the sides, 1–2 minutes.`,
      "Taste for salt and lemon.",
      "Spoon into a bowl. Drizzle oil on top if you have it. Serve with bread or vegetables.",
    ];
  }
  if (/poke|tuna rice/.test(n)) {
    const fish = named(recipe, /tuna|salmon|ahi|fish/, proteinName(recipe));
    const rice = named(recipe, /rice/, "rice");
    return [
      `Cube the ${fish}. Toss with the soy or tamari, sesame oil, and scallion until every piece is glossy.`,
      "Slice the cucumber and avocado if you have them. Fluff the rice.",
      `Spoon the ${rice} into bowls. Top with the ${fish} and the vegetables. Serve cold, not cooked.`,
    ];
  }
  if (/hiyayakko|chilled tofu/.test(n)) {
    return [
      "Chill the tofu well. Drain and cube it onto a plate.",
      "Scatter grated ginger and sliced scallion over the tofu.",
      "Spoon tamari and a drop of sesame oil over the top. Serve cold, straight from the fridge.",
    ];
  }
  if (/parfait|cottage|yogurt/.test(n) && !/overnight|oat/.test(n)) {
    return [
      `Spoon the ${named(recipe, /yogurt|cottage/, "yogurt")} into bowls.`,
      `Add ${join(namesMatching(recipe, /cucumber|tomato|berr|almond|dill|fruit/)) || "the toppings"} from the list.`,
      "Finish with the seasoning or oil. Serve cold, straight from the fridge.",
    ];
  }
  if (/trout/.test(n)) {
    return [
      `Flake the ${named(recipe, /trout/, "smoked trout")}. Stir yogurt with dill and lemon.`,
      "Slice the cucumber.",
      "Plate the trout with cucumber and the yogurt. Serve cold, straight from the fridge.",
    ];
  }
  return [
    `Stir ${list} together in a jar or bowl until every bit is wet.`,
    "Cover and refrigerate overnight, at least 6 hours.",
    "Stir in the morning. Eat cold, or warm 30 seconds if you want.",
  ];
}

function sandwichPressMethod(recipe: MethodRecipe): string[] {
  const n = recipe.name.toLowerCase();
  const bread = named(recipe, /bread|roll|tortilla|ciabatta|rye|bun|chip|loaf|wrap|pita/, "bread");
  const filling = join(
    recipe.ingredients
      .filter((i) => !/bread|roll|tortilla|ciabatta|rye|bun|butter|oil|chip|loaf|lettuce/.test(i.name))
      .map((i) => i.name)
      .slice(0, 5),
  );
  if (/salad/.test(n)) {
    return [
      `Chop or mash ${filling} and stir until the salad holds together.`,
      "Taste for salt. Chill 10 minutes if you have time.",
      `Pile onto the ${bread} with lettuce if you have it. Serve cold.`,
    ];
  }
  if (/\bwrap\b/.test(n)) {
    const wrap = named(recipe, /wrap|pita|tortilla/, bread);
    const spread = named(recipe, /hummus|tahini|mayo|mayonnaise|pesto|spread/, "");
    const veg = join(
      namesMatching(recipe, /carrot|cucumber|spinach|pepper|lettuce|tomato|cabbage|onion|avocado|olive|falafel/),
    );
    if (/falafel/.test(n)) {
      return [
        `Crisp the falafel in a skillet over medium heat, 2–3 minutes a side, until hot and browned.`,
        `Warm the ${wrap} in a dry pan 15 seconds a side so they flex.`,
        spread
          ? `Spread the ${spread} on the ${wrap}. Pile on ${veg || filling}.`
          : `Pile ${veg || filling} onto the ${wrap}.`,
        "Roll tight, slice in half, and eat.",
      ];
    }
    return [
      `Warm the ${wrap} in a dry pan 15 seconds a side so they flex.`,
      spread
        ? `Spread the ${spread} on the ${wrap}, going almost to the edges.`
        : `Lay out the ${wrap} and add ${filling}.`,
      veg ? `Pile on ${veg}.` : `Pile on ${filling}.`,
      "Roll tight, slice in half, and eat.",
    ];
  }
  if (/muffuletta/.test(n)) {
    return [
      `Split the ${bread}. Spoon olive salad on both cut sides.`,
      `Layer ${filling}.`,
      "Wrap and weight 30 minutes. Cut into wedges and serve.",
    ];
  }
  if (/quesadilla/.test(n)) {
    return [
      `Scatter ${filling} on half of each tortilla. Fold.`,
      "Set a dry skillet over medium. Cook 2–3 minutes a side, until the cheese melts and the tortilla blisters.",
      "Cut into wedges. Serve with salsa.",
    ];
  }
  if (/nachos/.test(n)) {
    return [
      `Heat a skillet over medium. Layer the ${bread} with beans and cheese.`,
      "Cover until the cheese melts, 3–5 minutes.",
      "Spoon salsa and scallions over. Serve from the pan.",
    ];
  }
  return [
    `Lay out the ${bread}. Spread the condiment. Layer ${filling}.`,
    "Brush the outside with butter or oil. Press in a skillet over medium 3–4 minutes a side, until the cheese runs and the bread is gold.",
    "Cut into pieces and serve hot, while the bread is still crisp.",
  ];
}

function airFryMethod(recipe: MethodRecipe): string[] {
  const food = proteinName(recipe);
  const mins = hintMinutes(recipe, Math.max(8, Math.min(20, recipe.minutes)));
  const oil = named(recipe, /olive oil|oil/, "oil");
  const citrus = named(recipe, /\b(lime|lemon)\b/, "");
  return [
    `Pat the ${food} dry. Toss with the ${oil} and salt.`,
    `Air-fry at 400°F for ${mins} minutes, turning once, until the edges are browned.`,
    citrus ? `Squeeze the ${citrus} over. Serve hot.` : "Finish with a pinch of salt. Serve hot.",
  ];
}

function slowCookerMethod(recipe: MethodRecipe): string[] {
  const list = join(recipe.ingredients.map((i) => i.name).slice(0, 6));
  const n = recipe.steps.join(" ").toLowerCase();
  const hrs = n.match(/(\d+)\s*hours?/)?.[1] ?? String(Math.max(4, Math.round(recipe.minutes / 60)));
  const heat = /\bhigh\b/.test(n) ? "high" : "low";
  const meat = proteinName(recipe);
  if (recipe.protein !== "veg" && recipe.protein !== "eggs") {
    return [
      `Pat the ${meat} dry. Brown it in a skillet over medium-high heat, 3–4 minutes a side, then move it to the slow cooker.`,
      `Add ${list} around the meat.`,
      `Cover. Cook on ${heat} for ${hrs} hours, until the meat is tender.`,
      "Taste for salt. Slice across the grain and spoon the juices over.",
    ];
  }
  return [
    `Get out ${list}. Put everything in the slow cooker.`,
    `Cover. Cook on ${heat} for ${hrs} hours, until tender.`,
    "Taste for salt. Serve hot.",
  ];
}

function granolaMethod(recipe: MethodRecipe): string[] {
  const list = join(recipe.ingredients.map((i) => i.name).slice(0, 6));
  return [
    "Heat the oven to 325°F. Line a sheet pan with parchment.",
    `Stir ${list} until every oat is coated.`,
    "Spread in an even layer. Bake 30–35 minutes, stirring once, until gold.",
    "Cool on the pan — it crisps as it cools.",
    "Store airtight. Eat with yogurt or milk.",
  ];
}

export function hasSpecialistMethod(recipe: MethodRecipe): boolean {
  const n = recipe.name.toLowerCase();
  if (specialMethod(recipe)) return true;
  if (isDrink(recipe)) return true;
  if (isColdMix(recipe)) return true;
  if (isSandwichLike(recipe)) return true;
  if (isAirFry(recipe)) return true;
  if (isSlowCook(recipe)) return true;
  if (isPressure(recipe)) return true;
  if (isSauceName(recipe)) return true;
  if (/granola/.test(n)) return true;
  if (/pudding|custard|spoon bread|clafoutis|flan|panna cotta/.test(n)) return true;
  return false;
}

export function knownDishMethod(recipe: MethodRecipe): string[] | null {
  const special = specialMethod(recipe);
  return special ? pad(special) : null;
}

export function writeDishMethod(recipe: MethodRecipe): string[] {
  const special = specialMethod(recipe);
  if (special) return pad(special);
  if (isDrink(recipe)) return pad(drinkMethod(recipe));
  if (isColdMix(recipe)) return pad(mixJarMethod(recipe));
  if (isSandwichLike(recipe)) return pad(sandwichPressMethod(recipe));
  if (isAirFry(recipe)) return pad(airFryMethod(recipe));
  if (isSlowCook(recipe)) return pad(slowCookerMethod(recipe));
  if (isPressure(recipe)) return pad(pressureMethod(recipe));
  if (/granola/.test(recipe.name.toLowerCase())) return pad(granolaMethod(recipe));
  if (/pudding|custard|spoon bread|clafoutis|flan|panna cotta/.test(recipe.name.toLowerCase())) {
    return pad(dessertMethod(recipe));
  }
  if ((recipe.tags ?? []).includes("dry-rub") || /\brub\b/.test(recipe.name.toLowerCase())) {
    return pad(rubMethod(recipe));
  }
  if (isSauceName(recipe)) {
    return pad(sauceMethod(recipe));
  }

  switch (recipe.plate) {
    case "pasta":
      return pad(pastaMethod(recipe));
    case "soup":
      return pad(soupMethod(recipe));
    case "roast":
      return pad(roastMethod(recipe));
    case "skillet":
      return pad(skilletMethod(recipe));
    case "taco":
      return pad(tacoMethod(recipe));
    case "toast":
      return pad(toastMethod(recipe));
    case "green":
      return pad(saladMethod(recipe));
    case "curry":
      return pad(curryMethod(recipe));
    case "dessert":
      return pad(dessertMethod(recipe));
    case "fish":
      return pad(fishMethod(recipe));
    case "bowl":
      return pad(bowlMethod(recipe));
    default:
      return pad(skilletMethod(recipe));
  }
}
