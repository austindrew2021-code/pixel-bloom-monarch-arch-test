import type { Addon, Recipe } from "./types";
import { BREAKFAST_RECIPES } from "./catalog-breakfast.ts";
import { DESSERT_RECIPES } from "./catalog-desserts.ts";
import { EXPAND_RECIPES } from "./catalog-expand.ts";
import { EXTRA_RECIPES } from "./catalog-extra.ts";
import { PLACE_RECIPES } from "./catalog-places.ts";
import { SAUCE_RECIPES } from "./catalog-sauces.ts";
import { SOUTHERN_RECIPES } from "./catalog-southern.ts";
import { WORLD_RECIPES } from "./catalog-world.ts";
import { PLUS_RECIPES } from "./catalog-plus.ts";
import { MORE_RECIPES } from "./catalog-more.ts";
import { CLASSIC_RECIPES } from "./catalog-classics.ts";
import { WARTIME_RECIPES } from "./catalog-wartime.ts";
import { HERITAGE_RECIPES } from "./catalog-heritage.ts";
import { BOOK_RECIPES } from "./catalog-books.ts";
import { TABLE_RECIPES } from "./catalog-table.ts";
import { SWEET_ERA_RECIPES } from "./catalog-sweet.ts";
import { polishCatalog } from "./cook-steps.ts";
import { decorateDietTags } from "./diet.ts";

const I = (
  name: string,
  qty: number,
  unit: string,
  aisle: Recipe["ingredients"][number]["aisle"],
) => ({
	name,
	qty,
	unit,
	aisle
});
const CORE_RECIPES: Recipe[] = [
	{
		id: "lemon-garlic-chicken",
		name: "Lemon garlic roast chicken",
		description: "A quiet Sunday bird with lemon, thyme, and crisp skin.",
		minutes: 75,
		servings: 4,
		protein: "chicken",
		plate: "roast",
		pack: "free",
		tags: ["roast", "comfort"],
		nutrition: {
			cal: 510,
			protein: 62,
			carbs: 5,
			fat: 28
		},
		ingredients: [
			I("whole chicken", 1, "bird", "Meat & Seafood"),
			I("lemon", 2, "", "Produce"),
			I("garlic", 6, "cloves", "Produce"),
			I("fresh thyme", 6, "sprigs", "Produce"),
			I("olive oil", 2, "tbsp", "Pantry"),
			I("kosher salt", 1.5, "tsp", "Herbs & Spices"),
			I("black pepper", 1, "tsp", "Herbs & Spices")
		],
		steps: [
      "Heat the oven to 425°F. Pat the whole chicken dry and salt it generously inside and out with the 1½ teaspoons of kosher salt.",
      "Stuff the cavity with the 2 halved lemons, the 6 cloves of smashed garlic, and the 6 sprigs of fresh thyme.",
      "Rub the skin with the 2 tablespoons of olive oil and the 1 teaspoon of black pepper.",
      "Roast 60–70 minutes, until the skin is deep gold and a thermometer in the thickest part of the thigh, not touching bone, reads 165°F.",
      "Rest 10 minutes before carving. Spoon the pan juices over the slices.",
    ]
	},
	{
		id: "tomato-basil-pasta",
		name: "Tomato basil pasta",
		description: "Ripe tomatoes collapsed into a simple pan sauce.",
		minutes: 30,
		servings: 4,
		protein: "veg",
		plate: "pasta",
		pack: "free",
		tags: ["vegetarian", "quick"],
		nutrition: {
			cal: 515,
			protein: 19,
			carbs: 75,
			fat: 16
		},
		ingredients: [
			I("spaghetti", 12, "oz", "Pantry"),
			I("ripe tomatoes", 6, "", "Produce"),
			I("garlic", 4, "cloves", "Produce"),
			I("fresh basil", 1, "bunch", "Produce"),
			I("olive oil", 3, "tbsp", "Pantry"),
			I("parmesan", 2, "oz", "Dairy & Eggs"),
			I("red pepper flakes", .5, "tsp", "Herbs & Spices")
		],
		steps: [
			"Boil pasta in well-salted water until just shy of al dente. Save a cup of water.",
			"Warm olive oil and garlic until fragrant. Add chopped tomatoes and a pinch of salt.",
			"Simmer until the tomatoes slump, 10 minutes. Add pasta, a splash of the pasta water, and basil.",
			"Toss until glossy. Finish with parmesan and pepper flakes."
		]
	},
	{
		id: "black-bean-tacos",
		name: "Black bean tacos",
		description: "Weeknight tacos with lime, cumin, and a crisp cabbage slaw.",
		minutes: 25,
		servings: 4,
		protein: "veg",
		plate: "taco",
		pack: "free",
		tags: [
			"vegetarian",
			"quick",
			"budget"
		],
		nutrition: {
			cal: 575,
			protein: 20,
			carbs: 85,
			fat: 20
		},
		ingredients: [
			I("black beans", 2, "cans", "Pantry"),
			I("corn tortillas", 12, "", "Bakery"),
			I("red cabbage", .5, "head", "Produce"),
			I("lime", 2, "", "Produce"),
			I("avocado", 2, "", "Produce"),
			I("cumin", 1, "tsp", "Herbs & Spices"),
			I("chili powder", 1, "tsp", "Herbs & Spices"),
			I("sour cream", .5, "cup", "Dairy & Eggs")
		],
		steps: [
			"Warm the 2 cans of black beans with the 1 teaspoon of cumin, the 1 teaspoon of chili powder, salt, and 2 tablespoons of water.",
			"Shred the ½ head of red cabbage and toss with the juice of the 2 limes and a pinch of salt.",
			"Char the 12 corn tortillas in a dry pan. Fill with beans, slaw, the 2 avocados, and the ½ cup of sour cream."
		]
	},
	{
		id: "salmon-asparagus",
		name: "Sheet-pan salmon & asparagus",
		description: "One pan, lemon, and dinner in twenty minutes.",
		minutes: 22,
		servings: 4,
		protein: "fish",
		plate: "fish",
		pack: "free",
		tags: ["quick", "pescatarian"],
		nutrition: {
			cal: 445,
			protein: 40,
			carbs: 6,
			fat: 29
		},
		ingredients: [
			I("salmon fillets", 4, "", "Meat & Seafood"),
			I("asparagus", 1, "bunch", "Produce"),
			I("lemon", 1, "", "Produce"),
			I("olive oil", 2, "tbsp", "Pantry"),
			I("garlic", 2, "cloves", "Produce"),
			I("kosher salt", 1, "tsp", "Herbs & Spices")
		],
		steps: [
      "Heat the oven to 425°F. Toss the 1 bunch of trimmed asparagus with the 2 tablespoons of olive oil, the 2 sliced cloves of garlic, and the 1 teaspoon of kosher salt on a sheet pan.",
      "Pat the 4 salmon fillets dry, season them, and nestle them among the asparagus with a few slices of the lemon on top.",
      "Roast 12–14 minutes, until the salmon flakes at the thickest part and the centre is just opaque.",
      "Serve from the pan, with the rest of the lemon cut into wedges.",
    ]
	},
	{
		id: "chicken-stir-fry",
		name: "Ginger chicken stir-fry",
		description: "Hot pan, snap peas, and a soy-ginger glaze.",
		minutes: 25,
		servings: 4,
		protein: "chicken",
		plate: "skillet",
		pack: "free",
		tags: ["quick"],
		nutrition: {
			cal: 600,
			protein: 43,
			carbs: 66,
			fat: 17
		},
		ingredients: [
			I("chicken thighs", 1.5, "lb", "Meat & Seafood"),
			I("snap peas", 12, "oz", "Produce"),
			I("bell pepper", 1, "", "Produce"),
			I("fresh ginger", 1, "tbsp", "Produce"),
			I("garlic", 3, "cloves", "Produce"),
			I("soy sauce", 3, "tbsp", "Pantry"),
			I("rice", 1.5, "cups", "Pantry"),
			I("sesame oil", 1, "tsp", "Pantry")
		],
		steps: [
      "Start the 1½ cups of rice. Slice the 1½ pounds of chicken thighs thin across the grain and toss with a spoon of the 3 tablespoons of soy sauce.",
      "Sear the chicken in a hot skillet in one layer, 3–4 minutes, turning once, until browned outside and no longer pink inside — 165°F at the centre of a slice. Set aside.",
      "Stir-fry the 12 ounces of snap peas and the sliced bell pepper 2–3 minutes, until bright and blistered but still snapping.",
      "Add the 1 tablespoon of ginger, the 3 cloves of garlic, the remaining soy sauce, and the chicken with any juices.",
      "Toss 1 minute to glaze. Finish with the 1 teaspoon of sesame oil and serve over the rice.",
    ]
	},
	{
		id: "lentil-soup",
		name: "Red lentil soup",
		description: "A pot of warmth with cumin, lemon, and olive oil.",
		minutes: 40,
		servings: 6,
		protein: "veg",
		plate: "soup",
		pack: "free",
		tags: [
			"vegetarian",
			"budget",
			"batch"
		],
		nutrition: {
			cal: 155,
			protein: 9,
			carbs: 20,
			fat: 5
		},
		ingredients: [
			I("red lentils", 2, "cups", "Pantry"),
			I("onion", 1, "", "Produce"),
			I("carrot", 2, "", "Produce"),
			I("garlic", 4, "cloves", "Produce"),
			I("cumin", 1.5, "tsp", "Herbs & Spices"),
			I("vegetable broth", 6, "cups", "Pantry"),
			I("lemon", 1, "", "Produce"),
			I("olive oil", 2, "tbsp", "Pantry")
		],
		steps: [
			"Sweat onion and carrot in olive oil with salt until soft.",
			"Add garlic and cumin. Stir in lentils and broth. Simmer 25 minutes.",
			"Blend half the pot if you like it creamy. Finish with lemon."
		]
	},
	{
		id: "turkey-meatballs",
		name: "Turkey meatballs",
		description: "Tender meatballs in a quick tomato sauce.",
		minutes: 45,
		servings: 4,
		protein: "turkey",
		plate: "skillet",
		pack: "free",
		tags: ["comfort"],
		nutrition: {
			cal: 440,
			protein: 54,
			carbs: 12,
			fat: 19
		},
		ingredients: [
			I("ground turkey", 1.5, "lb", "Meat & Seafood"),
			I("breadcrumb", .5, "cup", "Pantry"),
			I("egg", 1, "", "Dairy & Eggs"),
			I("parsley", .25, "cup", "Produce"),
			I("crushed tomatoes", 1, "can", "Pantry"),
			I("garlic", 3, "cloves", "Produce"),
			I("parmesan", 1, "oz", "Dairy & Eggs")
		],
		steps: [
			"Mix turkey, breadcrumbs, egg, chopped parsley, salt, and grated parmesan.",
			"Roll into balls. Brown in a skillet, then pour in crushed tomatoes and garlic.",
			"Simmer covered 20 minutes, until a thermometer pushed into the middle of a meatball reads 165°F."
		]
	},
	{
		id: "veggie-fried-rice",
		name: "Veggie fried rice",
		description: "Cold rice, a hot wok, and whatever is in the crisper.",
		minutes: 20,
		servings: 4,
		protein: "eggs",
		plate: "skillet",
		pack: "free",
		tags: [
			"vegetarian",
			"quick",
			"budget"
		],
		nutrition: {
			cal: 835,
			protein: 21,
			carbs: 157,
			fat: 12
		},
		ingredients: [
			I("cooked rice", 4, "cups", "Pantry"),
			I("eggs", 3, "", "Dairy & Eggs"),
			I("frozen peas", 1, "cup", "Frozen"),
			I("carrot", 2, "", "Produce"),
			I("green onion", 4, "", "Produce"),
			I("soy sauce", 3, "tbsp", "Pantry"),
			I("garlic", 2, "cloves", "Produce")
		],
		steps: [
			"Scramble eggs in a slick of oil; set aside.",
			"Stir-fry carrot and peas. Add rice, breaking up clumps.",
			"Season with soy and garlic. Fold in eggs and green onion."
		]
	},
	{
		id: "sausage-peppers",
		name: "Sausage, peppers & onions",
		description: "Sheet-pan supper that tastes like a ballpark in the best way.",
		minutes: 35,
		servings: 4,
		protein: "pork",
		plate: "roast",
		pack: "free",
		tags: ["budget"],
		nutrition: {
			cal: 620,
			protein: 32,
			carbs: 16,
			fat: 48
		},
		ingredients: [
			I("Italian sausage", 1.5, "lb", "Meat & Seafood"),
			I("bell peppers", 3, "", "Produce"),
			I("onion", 2, "", "Produce"),
			I("olive oil", 2, "tbsp", "Pantry"),
			I("dried oregano", 1, "tsp", "Herbs & Spices")
		],
		steps: [
			"Heat the oven to 425°F. Slice the 3 bell peppers and the 2 onions. Toss them on a sheet pan with the 2 tablespoons of olive oil, the 1 teaspoon of dried oregano, and salt.",
			"Nestle the 1½ pounds of Italian sausage on the pan among the vegetables.",
			"Roast 25–30 minutes, turning the sausages once, until they are browned and cooked through and the peppers are soft at the edges.",
			"Rest 3 minutes. Serve the sausages with the peppers and onions.",
		],
	},
	{
		id: "chickpea-curry",
		name: "Chickpea coconut curry",
		description: "A gentle yellow curry you can make with pantry cans.",
		minutes: 35,
		servings: 4,
		protein: "veg",
		plate: "curry",
		pack: "free",
		tags: ["vegetarian", "budget"],
		nutrition: {
			cal: 750,
			protein: 20,
			carbs: 99,
			fat: 32
		},
		ingredients: [
			I("chickpeas", 2, "cans", "Pantry"),
			I("coconut milk", 1, "can", "Pantry"),
			I("onion", 1, "", "Produce"),
			I("garlic", 3, "cloves", "Produce"),
			I("fresh ginger", 1, "tbsp", "Produce"),
			I("curry powder", 2, "tbsp", "Herbs & Spices"),
			I("spinach", 4, "cups", "Produce"),
			I("rice", 1.5, "cups", "Pantry")
		],
		steps: [
			"Sweat the chopped onion, the 3 minced garlic cloves, and the 1 tablespoon of fresh ginger in oil 5 minutes, until soft.",
			"Stir in the 2 tablespoons of curry powder and cook 30 seconds, until fragrant.",
			"Add the 2 cans of chickpeas and the 1 can of coconut milk. Simmer 15 minutes, until the sauce thickens.",
			"Fold in the 4 cups of spinach until wilted. Serve over the 1½ cups of cooked rice.",
		],
	},
	{
		id: "greek-bowls",
		name: "Greek chicken bowls",
		description: "Cucumber, tomato, yogurt, and lemon-oregano chicken.",
		minutes: 35,
		servings: 4,
		protein: "chicken",
		plate: "bowl",
		pack: "free",
		tags: [],
		nutrition: {
			cal: 670,
			protein: 62,
			carbs: 67,
			fat: 16
		},
		ingredients: [
			I("chicken breasts", 1.5, "lb", "Meat & Seafood"),
			I("cucumber", 1, "", "Produce"),
			I("cherry tomatoes", 1, "pint", "Produce"),
			I("red onion", .5, "", "Produce"),
			I("plain yogurt", 1, "cup", "Dairy & Eggs"),
			I("lemon", 1, "", "Produce"),
			I("dried oregano", 1, "tsp", "Herbs & Spices"),
			I("rice", 1.5, "cups", "Pantry")
		],
		steps: [
      "Marinate the 1½ pounds of chicken breasts in the juice of the lemon, the 1 teaspoon of dried oregano, the 1 teaspoon of salt, and the 2 tablespoons of oil for 15 minutes.",
      "Grill or sear them 5–6 minutes a side, until the thickest part reads 165°F. Rest on a board.",
      "Chop the cucumber, halve the 1 pint of cherry tomatoes, and thinly slice the ½ red onion. Toss them together.",
      "Stir the 1 cup of plain yogurt with a squeeze of lemon and a pinch of salt.",
      "Slice the rested chicken over the 1½ cups of cooked rice. Add the salad and a spoon of the yogurt.",
    ]
	},
	{
		id: "mushroom-risotto",
		name: "Mushroom risotto",
		description: "Slow-stirred rice with brown butter mushrooms.",
		minutes: 50,
		servings: 4,
		protein: "veg",
		plate: "skillet",
		pack: "free",
		tags: ["vegetarian", "comfort"],
		nutrition: {
			cal: 460,
			protein: 17,
			carbs: 64,
			fat: 14
		},
		ingredients: [
			I("arborio rice", 1.5, "cups", "Pantry"),
			I("mixed mushrooms", 1, "lb", "Produce"),
			I("shallot", 2, "", "Produce"),
			I("vegetable broth", 5, "cups", "Pantry"),
			I("white wine", .5, "cup", "Pantry"),
			I("parmesan", 2, "oz", "Dairy & Eggs"),
			I("butter", 3, "tbsp", "Dairy & Eggs")
		],
		steps: [
      "Sauté the 1 pound of mixed mushrooms in the 3 tablespoons of butter over high heat until browned and squeaky, 8 minutes. Set aside.",
      "Soften the 2 chopped shallots in the same pan, stir in the 1½ cups of arborio rice until the grains turn glassy, then pour in the ½ cup of white wine and let it cook away.",
      "Add the 5 cups of vegetable broth a ladle at a time, stirring, waiting for each to be absorbed before the next. This takes 18–20 minutes.",
      "The risotto is ready when the grains are tender with the faintest bite and a spoon dragged through leaves a trail that fills back in slowly.",
      "Fold in the mushrooms and the 2 ounces of parmesan off the heat. Serve at once — it stiffens as it sits.",
    ]
	},
	{
		id: "beef-chili",
		name: "Weeknight beef chili",
		description: "A pot that gets better if you leave it on the stove.",
		minutes: 55,
		servings: 6,
		protein: "beef",
		plate: "soup",
		pack: "free",
		tags: [
			"budget",
			"batch",
			"comfort"
		],
		nutrition: {
			cal: 500,
			protein: 43,
			carbs: 26,
			fat: 26
		},
		ingredients: [
			I("ground beef", 1.5, "lb", "Meat & Seafood"),
			I("kidney beans", 2, "cans", "Pantry"),
			I("crushed tomatoes", 1, "can", "Pantry"),
			I("onion", 1, "", "Produce"),
			I("chili powder", 2, "tbsp", "Herbs & Spices"),
			I("cumin", 1, "tsp", "Herbs & Spices"),
			I("cheddar", 4, "oz", "Dairy & Eggs")
		],
		steps: [
      "Set a wide pot over medium-high heat. Brown the 1½ pounds of ground beef with the chopped onion, breaking it up, until no pink remains.",
      "Tilt the pan and drain off the extra fat so the chili is not greasy.",
      "Stir in the 2 tablespoons of chili powder and the 1 teaspoon of cumin and cook 30 seconds, until they smell toasted.",
      "Add the 1 can of crushed tomatoes, the 2 cans of drained kidney beans, the 1 teaspoon of salt, and a cup of water. Simmer 35 minutes, uncovered, until it thickens and the fat rises.",
      "Spoon into bowls and pass the 4 ounces of grated cheddar at the table.",
    ]
	},
	{
		id: "honey-garlic-shrimp",
		name: "Honey garlic shrimp",
		description: "Sticky, fast, and good over rice with broccoli.",
		minutes: 20,
		servings: 4,
		protein: "seafood",
		plate: "skillet",
		pack: "free",
		tags: ["quick", "pescatarian"],
		nutrition: {
			cal: 520,
			protein: 50,
			carbs: 78,
			fat: 1
		},
		ingredients: [
			I("shrimp", 1.5, "lb", "Meat & Seafood"),
			I("honey", 3, "tbsp", "Pantry"),
			I("soy sauce", 3, "tbsp", "Pantry"),
			I("garlic", 4, "cloves", "Produce"),
			I("broccoli", 1, "head", "Produce"),
			I("rice", 1.5, "cups", "Pantry")
		],
		steps: [
			"Cook the 1½ cups of rice. Steam or roast the head of broccoli until just tender, 8–10 minutes.",
			"Pat the 1½ pounds of shrimp dry. Sear in a hot skillet 1 minute a side, until they just turn pink.",
			"Add the 3 tablespoons of honey, the 3 tablespoons of soy sauce, and the 4 minced garlic cloves. Toss 1–2 minutes, until the sauce is sticky and coats the shrimp.",
			"Serve the shrimp over the rice with the broccoli.",
		],
	},
	{
		id: "shakshuka",
		name: "Shakshuka",
		description: "Eggs poached in a spiced tomato pan. Breakfast for dinner.",
		minutes: 30,
		servings: 4,
		protein: "eggs",
		plate: "skillet",
		pack: "free",
		tags: [
			"vegetarian",
			"quick",
			"budget"
		],
		nutrition: {
			cal: 515,
			protein: 25,
			carbs: 68,
			fat: 16
		},
		ingredients: [
			I("eggs", 6, "", "Dairy & Eggs"),
			I("crushed tomatoes", 1, "can", "Pantry"),
			I("bell pepper", 1, "", "Produce"),
			I("onion", 1, "", "Produce"),
			I("cumin", 1, "tsp", "Herbs & Spices"),
			I("paprika", 1, "tsp", "Herbs & Spices"),
			I("feta", 3, "oz", "Dairy & Eggs"),
			I("crusty bread", 1, "loaf", "Bakery")
		],
		steps: [
			"Cook the onion and bell pepper until soft. Stir in the 1 teaspoon of cumin, the 1 teaspoon of paprika, and the crushed tomatoes; simmer 10 minutes.",
			"Make wells and crack in the 6 eggs. Cover until the whites set.",
			"Scatter the feta. Serve with the crusty bread."
		]
	},
	{
		id: "peanut-noodles",
		name: "Peanut noodle bowls",
		description: "Cold-or-warm noodles with a lime-peanut sauce.",
		minutes: 25,
		servings: 4,
		protein: "veg",
		plate: "bowl",
		pack: "free",
		tags: [
			"vegetarian",
			"quick",
			"budget"
		],
		nutrition: {
			cal: 475,
			protein: 18,
			carbs: 76,
			fat: 12
		},
		ingredients: [
			I("spaghetti or ramen", 12, "oz", "Pantry"),
			I("peanut butter", .33, "cup", "Pantry"),
			I("soy sauce", 3, "tbsp", "Pantry"),
			I("lime", 1, "", "Produce"),
			I("cucumber", 1, "", "Produce"),
			I("carrot", 2, "", "Produce"),
			I("garlic", 1, "clove", "Produce")
		],
		steps: [
			"Cook the 12 ounces of spaghetti or ramen in salted water until tender. Drain. Save a splash of the cooking water.",
			"Whisk the ⅓ cup of peanut butter with the 3 tablespoons of soy sauce, the juice of the lime, the minced garlic, and a splash of warm water until the sauce is pourable.",
			"Shave the 2 carrots and slice the cucumber.",
			"Toss the noodles with the peanut sauce, adding a little cooking water if it is too thick. Pile on the carrot and cucumber. Serve warm or cold.",
		],
	},
	{
		id: "tuna-white-bean",
		name: "Tuna & white bean salad",
		description: "No stove. Olive oil, lemon, parsley, dinner.",
		minutes: 12,
		servings: 2,
		protein: "fish",
		plate: "green",
		pack: "weeknight",
		tags: ["quick", "pescatarian"],
		nutrition: {
			cal: 475,
			protein: 48,
			carbs: 36,
			fat: 16
		},
		ingredients: [
			I("canned tuna", 2, "cans", "Pantry"),
			I("white beans", 1, "can", "Pantry"),
			I("lemon", 1, "", "Produce"),
			I("parsley", .5, "bunch", "Produce"),
			I("red onion", .25, "", "Produce"),
			I("olive oil", 2, "tbsp", "Pantry"),
			I("arugula", 4, "cups", "Produce")
		],
		steps: [
      "Wash and dry the 4 cups of arugula and put it in a wide bowl.",
      "Whisk the juice of the lemon with the 2 tablespoons of olive oil and a pinch of the 1 teaspoon of salt until the dressing looks even.",
      "Drain the 2 cans of tuna and the 1 can of white beans well. Add them to the bowl with the ½ bunch of chopped parsley and the thinly sliced ¼ red onion.",
      "Pour the dressing over and toss gently, so the beans stay whole and the leaves are coated rather than drowned.",
      "Taste for salt and serve right away, while the leaves are still crisp.",
    ]
	},
	{
		id: "crispy-chickpea-wraps",
		name: "Crispy chickpea wraps",
		description: "Skillet chickpeas, yogurt, and a warm tortilla.",
		minutes: 18,
		servings: 4,
		protein: "veg",
		plate: "taco",
		pack: "weeknight",
		tags: ["vegetarian", "quick"],
		nutrition: {
			cal: 390,
			protein: 17,
			carbs: 54,
			fat: 13
		},
		ingredients: [
			I("chickpeas", 2, "cans", "Pantry"),
			I("flour tortillas", 4, "", "Bakery"),
			I("plain yogurt", .75, "cup", "Dairy & Eggs"),
			I("cucumber", 1, "", "Produce"),
			I("smoked paprika", 1, "tsp", "Herbs & Spices"),
			I("lettuce", 1, "head", "Produce")
		],
		steps: [
			"Drain the 2 cans of chickpeas. Smash them lightly with a fork so some stay whole.",
			"Set a wide skillet over medium-high heat with a slick of oil. Fry the chickpeas with the 1 teaspoon of smoked paprika and salt until the edges are crisp, 6–8 minutes.",
			"Warm the 4 flour tortillas. Spread the ¾ cup of plain yogurt on each one.",
			"Pile on the crisp chickpeas, sliced cucumber, and shredded lettuce. Roll and eat while the chickpeas are still hot.",
		],
	},
	{
		id: "miso-butter-cod",
		name: "Miso butter cod",
		description: "Broiled fish with a salty-sweet glaze.",
		minutes: 16,
		servings: 4,
		protein: "fish",
		plate: "fish",
		pack: "weeknight",
		tags: ["quick", "pescatarian"],
		nutrition: {
			cal: 580,
			protein: 62,
			carbs: 49,
			fat: 16
		},
		ingredients: [
			I("cod fillets", 4, "", "Meat & Seafood"),
			I("white miso", 2, "tbsp", "Pantry"),
			I("butter", 2, "tbsp", "Dairy & Eggs"),
			I("honey", 1, "tsp", "Pantry"),
			I("bok choy", 4, "heads", "Produce")
		],
		steps: [
			"Mash the white miso with the soft butter and honey until it is a smooth paste.",
			"Spread the paste on the cod fillets.",
			"Broil 8–10 minutes, until the glaze is browned and bubbling.",
			"Steam the bok choy alongside until just tender, 4–5 minutes. Serve the fish with the bok choy.",
		],
	},
	{
		id: "pesto-gnocchi",
		name: "Skillet pesto gnocchi",
		description: "Crisped gnocchi, jar pesto, bursting tomatoes.",
		minutes: 20,
		servings: 4,
		protein: "veg",
		plate: "pasta",
		pack: "weeknight",
		tags: ["vegetarian", "quick"],
		nutrition: {
			cal: 520,
			protein: 19,
			carbs: 86,
			fat: 11
		},
		ingredients: [
			I("shelf-stable gnocchi", 1, "lb", "Pantry"),
			I("basil pesto", .5, "cup", "Pantry"),
			I("cherry tomatoes", 1, "pint", "Produce"),
			I("baby spinach", 3, "cups", "Produce"),
			I("parmesan", 1, "oz", "Dairy & Eggs")
		],
		steps: [
      "Set a wide skillet over medium-high heat with the 2 tablespoons of oil. Add the 1 pound of shelf-stable gnocchi straight from the packet — do not boil them first.",
      "Fry 6–8 minutes, turning every couple of minutes, until they are blistered and crisp on two sides and soft inside.",
      "Add the 1 pint of cherry tomatoes and cook 3–4 minutes, pressing a few with the spoon, until they burst and make a little sauce.",
      "Take the pan off the heat. Fold in the ½ cup of basil pesto and the 3 cups of baby spinach so the spinach wilts in the residual heat — pesto cooked hard turns bitter and grey.",
      "Shower the 1 ounce of parmesan over and serve straight from the pan.",
    ]
	},
	{
		id: "egg-fried-greens",
		name: "Eggs over garlicky greens",
		description: "A skillet of greens and a fried egg. Toast on the side.",
		minutes: 15,
		servings: 2,
		protein: "eggs",
		plate: "toast",
		pack: "weeknight",
		tags: [
			"vegetarian",
			"quick",
			"budget"
		],
		nutrition: {
			cal: 460,
			protein: 22,
			carbs: 36,
			fat: 26
		},
		ingredients: [
			I("eggs", 4, "", "Dairy & Eggs"),
			I("kale or chard", 1, "bunch", "Produce"),
			I("garlic", 3, "cloves", "Produce"),
			I("olive oil", 2, "tbsp", "Pantry"),
			I("sourdough", 4, "slices", "Bakery"),
			I("chili flakes", .5, "tsp", "Herbs & Spices")
		],
		steps: [
			"Wilt the bunch of kale or chard with the garlic in the olive oil over medium heat, 4–5 minutes. Season well.",
			"Fry the 4 eggs in the same pan until the whites are set.",
			"Toast the 4 slices of sourdough. Pile the greens on the toast, top with the eggs, and scatter chili flakes.",
		],
	},
	{
		id: "turkey-taco-skillet",
		name: "Turkey taco skillet",
		description: "One pan, pantry spices, dinner in a bowl.",
		minutes: 22,
		servings: 4,
		protein: "turkey",
		plate: "skillet",
		pack: "weeknight",
		tags: ["quick"],
		nutrition: {
			cal: 585,
			protein: 61,
			carbs: 22,
			fat: 28
		},
		ingredients: [
			I("ground turkey", 1.5, "lb", "Meat & Seafood"),
			I("black beans", 1, "can", "Pantry"),
			I("frozen corn", 1, "cup", "Frozen"),
			I("taco seasoning", 2, "tbsp", "Herbs & Spices"),
			I("cheddar", 3, "oz", "Dairy & Eggs"),
			I("lettuce", 1, "head", "Produce")
		],
		steps: [
      "Set a wide skillet over medium-high heat with a film of the 2 tablespoons of oil. Add the 1½ pounds of ground turkey and the 2 tablespoons of taco seasoning.",
      "Cook 6–8 minutes, breaking the meat up with a spoon, until no pink remains and it reads 165°F. Drain extra fat.",
      "Add the 1 can of drained black beans and the 1 cup of frozen corn and cook 3–4 minutes, until hot through. Season with the 1 teaspoon of salt and pepper. Taste.",
      "Take the pan off the heat and scatter the 3 ounces of cheddar over so it melts in the residual heat.",
      "Shred the 1 head of lettuce and put it on the table cold, for people to pile on top. Do not cook it.",
    ]
	},
	{
		id: "sesame-soba",
		name: "Sesame soba",
		description: "Chilled noodles, cucumber, and a toasted sesame dressing.",
		minutes: 18,
		servings: 4,
		protein: "veg",
		plate: "bowl",
		pack: "weeknight",
		tags: ["vegetarian", "quick"],
		nutrition: {
			cal: 305,
			protein: 10,
			carbs: 49,
			fat: 8
		},
		ingredients: [
			I("soba noodles", 8, "oz", "Pantry"),
			I("tahini or sesame paste", 3, "tbsp", "Pantry"),
			I("soy sauce", 2, "tbsp", "Pantry"),
			I("cucumber", 1, "", "Produce"),
			I("green onion", 3, "", "Produce"),
			I("sesame oil", 1, "tsp", "Pantry")
		],
		steps: [
			"Cook the 8 ounces of soba noodles in salted water until tender, 4–5 minutes. Drain and rinse under cold water.",
			"Whisk the 3 tablespoons of tahini or sesame paste with the 2 tablespoons of soy sauce, the 1 teaspoon of sesame oil, and a splash of cold water until pourable.",
			"Slice the cucumber and the 3 green onions.",
			"Toss the cold noodles with the sesame sauce, cucumber, and green onion. Serve cold or at room temperature.",
		],
	},
	{
		id: "ham-pea-pasta",
		name: "Ham, pea & lemon pasta",
		description: "A fridge-door pasta that still feels considered.",
		minutes: 20,
		servings: 4,
		protein: "pork",
		plate: "pasta",
		pack: "weeknight",
		tags: ["quick", "budget"],
		nutrition: {
			cal: 575,
			protein: 27,
			carbs: 72,
			fat: 20
		},
		ingredients: [
			I("short pasta", 12, "oz", "Pantry"),
			I("ham steak", 8, "oz", "Meat & Seafood"),
			I("frozen peas", 1.5, "cups", "Frozen"),
			I("lemon", 1, "", "Produce"),
			I("cream", .5, "cup", "Dairy & Eggs"),
			I("parmesan", 1, "oz", "Dairy & Eggs")
		],
		steps: [
      "Bring a large pot of salted water to a boil. Cook the 12 ounces of short pasta until just shy of al dente, 8–10 minutes. Ladle out a cup of the pasta water and drain.",
      "Meanwhile dice the 8 ounces of ham steak and brown it in the 2 tablespoons of oil in a wide skillet over medium heat, 4–5 minutes, until the edges catch.",
      "Pour in the ½ cup of cream and let it bubble gently 2 minutes, until it thickens a little. Add the 1½ cups of frozen peas and warm them through.",
      "Add the pasta with a splash of the pasta water and toss over medium heat until the sauce coats every strand, 1–2 minutes.",
      "Take the pan off the heat before the lemon goes in, or the cream will split. Squeeze the lemon over, toss with the 1 ounce of parmesan and the 1 teaspoon of salt, and serve at once.",
    ]
	},
	{
		id: "steak-chimichurri",
		name: "Steak with chimichurri",
		description: "Seared steak and a sharp parsley sauce.",
		minutes: 25,
		servings: 4,
		protein: "beef",
		plate: "skillet",
		pack: "protein",
		tags: [],
		nutrition: {
			cal: 520,
			protein: 47,
			carbs: 2,
			fat: 35
		},
		ingredients: [
			I("sirloin steaks", 1.5, "lb", "Meat & Seafood"),
			I("parsley", 1, "bunch", "Produce"),
			I("garlic", 3, "cloves", "Produce"),
			I("red wine vinegar", 2, "tbsp", "Pantry"),
			I("olive oil", .33, "cup", "Pantry"),
			I("red pepper flakes", .5, "tsp", "Herbs & Spices")
		],
		steps: [
			"Chop the 1 bunch of parsley and the 3 cloves of garlic. Stir with the 2 tablespoons of red wine vinegar, the ⅓ cup of olive oil, the ½ teaspoon of red pepper flakes, and a pinch of salt.",
			"Pat the 1½ pounds of sirloin steaks dry and salt both sides well.",
			"Set a wide skillet over high heat. Sear the steaks 3–4 minutes per side, until browned outside and still pink in the center if you like them medium.",
			"Rest 5 minutes off the heat. Slice across the grain and spoon the chimichurri over.",
		],
	},
	{
		id: "tofu-power-bowls",
		name: "Crispy tofu power bowls",
		description: "Baked tofu, quinoa, and a sesame-lime drizzle.",
		minutes: 35,
		servings: 4,
		protein: "veg",
		plate: "bowl",
		pack: "protein",
		tags: ["vegetarian"],
		nutrition: {
			cal: 495,
			protein: 32,
			carbs: 60,
			fat: 17
		},
		ingredients: [
			I("extra-firm tofu", 14, "oz", "Produce"),
			I("quinoa", 1.5, "cups", "Pantry"),
			I("edamame", 1.5, "cups", "Frozen"),
			I("broccoli", 1, "head", "Produce"),
			I("soy sauce", 2, "tbsp", "Pantry"),
			I("tahini", 2, "tbsp", "Pantry"),
			I("lime", 1, "", "Produce")
		],
		steps: [
			"Heat the oven to 425°F. Press the 14 ounces of extra-firm tofu 10 minutes, then cube and toss with the 2 tablespoons of soy sauce.",
			"Spread the tofu on a sheet and bake 20–25 minutes, until the edges are crisp.",
			"Cook the 1½ cups of quinoa in salted water until the grains are tender, then drain. Steam the head of broccoli and the 1½ cups of edamame until just tender, 4–5 minutes.",
			"Whisk the 2 tablespoons of tahini with the juice of the lime and a splash of water until pourable.",
			"Divide the quinoa, tofu, broccoli, and edamame among bowls. Spoon the tahini-lime over and serve.",
		],
	},
	{
		id: "greek-yogurt-chicken",
		name: "Yogurt-marinated chicken",
		description: "Tender grilled chicken from a garlic-yogurt bath.",
		minutes: 40,
		servings: 4,
		protein: "chicken",
		plate: "roast",
		pack: "protein",
		tags: [],
		nutrition: {
			cal: 445,
			protein: 52,
			carbs: 9,
			fat: 22
		},
		ingredients: [
			I("chicken thighs", 2, "lb", "Meat & Seafood"),
			I("plain Greek yogurt", 1, "cup", "Dairy & Eggs"),
			I("garlic", 4, "cloves", "Produce"),
			I("lemon", 1, "", "Produce"),
			I("cumin", 1, "tsp", "Herbs & Spices"),
			I("cucumber", 1, "", "Produce")
		],
		steps: [
      "Mix the 1 cup of plain Greek yogurt with the 4 minced cloves of garlic, the juice of the lemon, the 1 teaspoon of cumin, and the 1 teaspoon of salt.",
      "Coat the 2 pounds of chicken thighs and rest at least 20 minutes, or up to overnight in the fridge. Scrape most of the marinade off before cooking or it burns rather than chars.",
      "Grill, or roast at 425°F, 18–22 minutes, until the edges char and the thickest part reads 165°F.",
      "Rest 5 minutes. Slice and serve with the cucumber, cut into thick spears.",
    ],
	},
	{
		id: "salmon-quinoa",
		name: "Roasted salmon quinoa",
		description: "Oven salmon, herbed quinoa, and a mustard yogurt.",
		minutes: 30,
		servings: 4,
		protein: "fish",
		plate: "fish",
		pack: "protein",
		tags: ["pescatarian"],
		nutrition: {
			cal: 680,
			protein: 48,
			carbs: 44,
			fat: 34
		},
		ingredients: [
			I("salmon fillets", 4, "", "Meat & Seafood"),
			I("quinoa", 1.5, "cups", "Pantry"),
			I("dill", .25, "cup", "Produce"),
			I("Greek yogurt", .5, "cup", "Dairy & Eggs"),
			I("Dijon mustard", 1, "tbsp", "Pantry"),
			I("lemon", 1, "", "Produce")
		],
		steps: [
      "Heat the oven to 425°F. Cook the 1½ cups of quinoa in salted water until the grains uncoil, 12–15 minutes, then drain and keep warm.",
      "Pat the 4 salmon fillets dry, season with the 1 teaspoon of salt, and set them on an oiled sheet pan. Brush with the 2 tablespoons of oil and the 1 tablespoon of Dijon mustard.",
      "Roast 10–12 minutes, until the flesh flakes at the thickest part and the centre is just opaque.",
      "Fork the ¼ cup of chopped dill through the quinoa and squeeze half the lemon over.",
      "Spoon the quinoa into bowls, lay the salmon on top, and put the ½ cup of Greek yogurt and the rest of the lemon on the table.",
    ]
	},
	{
		id: "beef-zucchini-skillet",
		name: "Beef & zucchini skillet",
		description: "A protein-heavy pan with garlic and tomato.",
		minutes: 28,
		servings: 4,
		protein: "beef",
		plate: "skillet",
		pack: "protein",
		tags: [],
		nutrition: {
			cal: 555,
			protein: 49,
			carbs: 9,
			fat: 38
		},
		ingredients: [
			I("ground beef", 1.5, "lb", "Meat & Seafood"),
			I("zucchini", 3, "", "Produce"),
			I("garlic", 3, "cloves", "Produce"),
			I("crushed tomatoes", 1, "cup", "Pantry"),
			I("oregano", 1, "tsp", "Herbs & Spices"),
			I("parmesan", 1, "oz", "Dairy & Eggs")
		],
		steps: [
      "Set a wide skillet over medium-high heat with the 2 tablespoons of oil. Add the 1½ pounds of ground beef.",
      "Cook 6–8 minutes, breaking the meat up with a spoon, until no pink remains. Drain off the extra fat.",
      "Add the 3 cloves of garlic and the 1 teaspoon of oregano and cook 30 seconds, until fragrant.",
      "Add the 3 zucchini in thick half-moons and the 1 cup of crushed tomatoes. Simmer 6–8 minutes, until the zucchini is tender and the sauce clings to the meat.",
      "Take off the heat, shower the 1 ounce of parmesan over, and serve.",
    ]
	},
	{
		id: "shrimp-cauliflower",
		name: "Garlic shrimp & cauliflower",
		description: "High protein, low fuss, lots of lemon.",
		minutes: 22,
		servings: 4,
		protein: "seafood",
		plate: "skillet",
		pack: "protein",
		tags: ["quick", "pescatarian"],
		nutrition: {
			cal: 280,
			protein: 45,
			carbs: 11,
			fat: 8
		},
		ingredients: [
			I("shrimp", 1.5, "lb", "Meat & Seafood"),
			I("cauliflower", 1, "head", "Produce"),
			I("garlic", 5, "cloves", "Produce"),
			I("olive oil", 2, "tbsp", "Pantry"),
			I("lemon", 1, "", "Produce"),
			I("parsley", .25, "cup", "Produce")
		],
		steps: [
      "Break the head of cauliflower into small florets. Steam or boil them 5–6 minutes, until a knife just goes in, and drain well.",
      "Pat the 1½ pounds of shrimp dry and season with the 1 teaspoon of salt.",
      "Set a wide skillet over medium-high heat with the 2 tablespoons of olive oil. Sear the shrimp 1 minute a side, just until they turn pink and curl into a loose C — a tight O means they are overdone. Move them to a plate.",
      "Add the 5 sliced cloves of garlic to the pan and cook 30 seconds, until fragrant but not browned. Add the cauliflower and toss 2 minutes to pick up the flavour.",
      "Return the shrimp with any juices, squeeze the lemon over, scatter the ¼ cup of parsley, and serve straight away.",
    ]
	},
	{
		id: "cottage-egg-toast",
		name: "Cottage cheese egg toast",
		description: "Savory toast with a protein punch for lunch.",
		minutes: 12,
		servings: 2,
		protein: "eggs",
		plate: "toast",
		pack: "protein",
		tags: ["vegetarian", "quick"],
		nutrition: {
			cal: 360,
			protein: 22,
			carbs: 18,
			fat: 22
		},
		ingredients: [
			I("cottage cheese", 1, "cup", "Dairy & Eggs"),
			I("eggs", 2, "", "Dairy & Eggs"),
			I("sourdough", 2, "slices", "Bakery"),
			I("chives", 2, "tbsp", "Produce"),
			I("chili flakes", .25, "tsp", "Herbs & Spices")
		],
		steps: [
      "Toast the 2 slices of sourdough on both sides until gold, 1–2 minutes a side.",
      "Spread the 1 cup of cottage cheese thickly over the warm toast.",
      "Fry the 2 eggs in the 2 tablespoons of butter over medium heat, 2–3 minutes, until the whites are set and the yolks still soft.",
      "Slide an egg onto each slice. Scatter the 2 tablespoons of chopped chives and the ¼ teaspoon of chili flakes over.",
      "Serve right away, while the toast is still crisp under the cheese.",
    ]
	},
	{
		id: "turkey-chili-bowl",
		name: "Turkey chili bowl",
		description: "Leaner chili, same comfort, extra protein.",
		minutes: 40,
		servings: 6,
		protein: "turkey",
		plate: "soup",
		pack: "protein",
		tags: ["batch"],
		nutrition: {
			cal: 480,
			protein: 52,
			carbs: 27,
			fat: 18
		},
		ingredients: [
			I("ground turkey", 2, "lb", "Meat & Seafood"),
			I("black beans", 2, "cans", "Pantry"),
			I("crushed tomatoes", 1, "can", "Pantry"),
			I("onion", 1, "", "Produce"),
			I("chili powder", 2, "tbsp", "Herbs & Spices"),
			I("Greek yogurt", .5, "cup", "Dairy & Eggs")
		],
		steps: [
      "Warm the 2 tablespoons of oil in a heavy pot over medium heat and soften the chopped onion, 5–6 minutes.",
      "Add the 2 pounds of ground turkey and cook 8 minutes, breaking it up, until no pink remains, some of it has browned, and it reads 165°F. Browning is where the flavour comes from — boiling it does not get you there.",
      "Stir in the 2 tablespoons of chili powder and cook 30 seconds, until it smells toasted.",
      "Add the 1 can of crushed tomatoes, the 2 cans of drained black beans, the 1 teaspoon of salt, and a cup of water. Simmer 25 minutes, uncovered, until it thickens.",
      "Ladle into warm bowls and pass the ½ cup of Greek yogurt at the table.",
    ]
	},
	{
		id: "lasagna-bolognese",
		name: "Lasagna bolognese",
		description: "A pan that feeds the week. Freeze the extra.",
		minutes: 110,
		servings: 8,
		protein: "beef",
		plate: "pasta",
		pack: "batch",
		tags: ["batch", "comfort"],
		nutrition: {
			cal: 525,
			protein: 41,
			carbs: 23,
			fat: 29
		},
		ingredients: [
			I("lasagna noodles", 12, "", "Pantry"),
			I("ground beef", 1.5, "lb", "Meat & Seafood"),
			I("crushed tomatoes", 2, "cans", "Pantry"),
			I("ricotta", 15, "oz", "Dairy & Eggs"),
			I("mozzarella", 12, "oz", "Dairy & Eggs"),
			I("onion", 1, "", "Produce"),
			I("garlic", 4, "cloves", "Produce")
		],
		steps: [
      "Brown the 1½ pounds of ground beef with the chopped onion in a wide pan, breaking it up, until no pink remains. Add the 4 cloves of garlic for the last minute.",
      "Add the 2 cans of crushed tomatoes and a good pinch of salt. Simmer 30 minutes, uncovered, until the sauce thickens and the fat rises.",
      "Boil the 12 lasagna noodles 2 minutes shy of the packet time and lay them out flat so they do not stick — or use no-boil sheets and add a splash of water to the sauce.",
      "Heat the oven to 375°F. Layer sauce, noodles, the 15 ounces of ricotta, and the 12 ounces of mozzarella, finishing with sauce and cheese.",
      "Bake 45 minutes, until bubbling and browned on top. Rest 15 minutes before cutting, or it slides apart. Cool leftovers in portions.",
    ]
	},
	{
		id: "chicken-rice-prep",
		name: "Soy-ginger chicken rice",
		description: "A tray of chicken and rice you can reheat all week.",
		minutes: 50,
		servings: 6,
		protein: "chicken",
		plate: "bowl",
		pack: "batch",
		tags: ["batch"],
		nutrition: {
			cal: 605,
			protein: 50,
			carbs: 62,
			fat: 18
		},
		ingredients: [
			I("chicken thighs", 2.5, "lb", "Meat & Seafood"),
			I("rice", 2, "cups", "Pantry"),
			I("soy sauce", .25, "cup", "Pantry"),
			I("fresh ginger", 2, "tbsp", "Produce"),
			I("broccoli", 2, "heads", "Produce"),
			I("garlic", 4, "cloves", "Produce"),
			I("green onion", 4, "", "Produce")
		],
		steps: [
			"Heat the oven to 400°F. Toss the 2½ pounds of chicken thighs with the ¼ cup of soy sauce, the 2 tablespoons of fresh ginger, and the 4 cloves of garlic.",
			"Bake 30 minutes, until the edges are browned and a thermometer in the thickest thigh reads 175°F.",
			"Cook the 2 cups of rice in salted water until tender. Steam the 2 heads of broccoli until just tender, 4–5 minutes.",
			"Slice the chicken. Divide rice, chicken, and broccoli among six boxes. Scatter the 4 green onions over.",
		],
	},
	{
		id: "veg-minestrone",
		name: "Big pot minestrone",
		description: "Beans, greens, pasta — a week of lunches.",
		minutes: 55,
		servings: 8,
		protein: "veg",
		plate: "soup",
		pack: "batch",
		tags: [
			"vegetarian",
			"budget",
			"batch"
		],
		nutrition: {
			cal: 210,
			protein: 12,
			carbs: 33,
			fat: 5
		},
		ingredients: [
			I("cannellini beans", 2, "cans", "Pantry"),
			I("diced tomatoes", 1, "can", "Pantry"),
			I("carrot", 3, "", "Produce"),
			I("celery", 3, "stalks", "Produce"),
			I("zucchini", 2, "", "Produce"),
			I("small pasta", 1, "cup", "Pantry"),
			I("kale", 1, "bunch", "Produce"),
			I("vegetable broth", 8, "cups", "Pantry")
		],
		steps: [
      "Warm the 2 tablespoons of oil in a heavy pot. Soften the 3 diced carrots and the 3 stalks of celery over medium heat, 6–8 minutes.",
      "Add the 1 can of diced tomatoes and the 8 cups of vegetable broth and bring to a simmer. Cook 20 minutes.",
      "Add the 2 cans of drained cannellini beans, the 2 diced zucchini, and the 1 cup of small pasta. Cook 8 minutes, until the pasta is tender and the zucchini still has some bite.",
      "Stir in the 1 bunch of shredded kale and cook 3 minutes more, until it wilts but keeps its colour.",
      "Season with the 1 teaspoon of salt and ladle into warm bowls.",
    ]
	},
	{
		id: "pulled-pork",
		name: "Slow oven pulled pork",
		description: "Rub, roast, shred. Tacos, bowls, sandwiches.",
		minutes: 260,
		servings: 10,
		protein: "pork",
		plate: "roast",
		pack: "batch",
		tags: ["batch"],
		nutrition: {
			cal: 490,
			protein: 49,
			carbs: 6,
			fat: 28
		},
		ingredients: [
			I("pork shoulder", 4, "lb", "Meat & Seafood"),
			I("brown sugar", 2, "tbsp", "Pantry"),
			I("paprika", 2, "tbsp", "Herbs & Spices"),
			I("cumin", 1, "tsp", "Herbs & Spices"),
			I("onion", 1, "", "Produce"),
			I("apple cider vinegar", .25, "cup", "Pantry")
		],
		steps: [
      "Heat the oven to 300°F. Pat the 4 pounds of pork shoulder dry and rub it all over with the 1 teaspoon of salt, the 2 tablespoons of paprika, the 2 tablespoons of brown sugar, and the 1 teaspoon of cumin.",
      "Set it on a bed of the sliced onion in a deep roasting pan, pour the ¼ cup of apple cider vinegar and the 2 tablespoons of oil around it, and cover tightly with foil.",
      "Roast 3½ hours covered, then uncover and give it 30 minutes more to darken the bark.",
      "Rest 20 minutes. It is ready when a fork twists in the shoulder with no resistance — if it does not, it needs longer, not more heat.",
      "Pull the meat apart with two forks, discarding the fat, and toss it through the onions and the pan juices.",
    ]
	},
	{
		id: "baked-oatmeal",
		name: "Baked blueberry oatmeal",
		description: "Breakfast you slice like cake all week.",
		minutes: 45,
		servings: 8,
		protein: "eggs",
		plate: "toast",
		pack: "batch",
		tags: [
			"vegetarian",
			"batch",
			"budget"
		],
		nutrition: {
			cal: 270,
			protein: 10,
			carbs: 39,
			fat: 9
		},
		ingredients: [
			I("rolled oats", 3, "cups", "Pantry"),
			I("milk", 2, "cups", "Dairy & Eggs"),
			I("eggs", 2, "", "Dairy & Eggs"),
			I("maple syrup", .33, "cup", "Pantry"),
			I("blueberries", 2, "cups", "Frozen"),
			I("cinnamon", 1, "tsp", "Herbs & Spices")
		],
		steps: [
			"Heat the oven to 375°F. Butter a baking dish.",
			"Stir the 3 cups of rolled oats, the 2 cups of milk, the 2 eggs, the ⅓ cup of maple syrup, the 1 teaspoon of cinnamon, and the 2 cups of blueberries until even.",
			"Pour into the buttered pan and spread in an even layer.",
			"Bake 35 minutes, until the center is set and the top is gold. Cool, then slice.",
		],
	},
	{
		id: "grain-salad",
		name: "Farro & roasted veg salad",
		description: "A sturdy salad that likes the fridge.",
		minutes: 50,
		servings: 8,
		protein: "veg",
		plate: "green",
		pack: "batch",
		tags: ["vegetarian", "batch"],
		nutrition: {
			cal: 335,
			protein: 11,
			carbs: 42,
			fat: 14
		},
		ingredients: [
			I("farro", 2, "cups", "Pantry"),
			I("sweet potato", 2, "", "Produce"),
			I("red onion", 1, "", "Produce"),
			I("kale", 1, "bunch", "Produce"),
			I("feta", 6, "oz", "Dairy & Eggs"),
			I("olive oil", .25, "cup", "Pantry"),
			I("lemon", 2, "", "Produce")
		],
		steps: [
			"Heat the oven to 425°F. Cook the 2 cups of farro in salted water until tender, then drain.",
			"Cube the 2 sweet potatoes and slice the red onion. Toss with some of the ¼ cup of olive oil and salt. Roast 25 minutes, until browned.",
			"Strip the bunch of kale. Massage with the juice of the 2 lemons and the rest of the oil until the leaves soften.",
			"Toss the farro, roasted vegetables, and kale with the 6 ounces of feta.",
		],
	},
	{
		id: "chicken-tortilla-soup",
		name: "Chicken tortilla soup",
		description: "A big pot with lime, cumin, and crunchy toppings.",
		minutes: 50,
		servings: 8,
		protein: "chicken",
		plate: "soup",
		pack: "batch",
		tags: ["batch"],
		nutrition: {
			cal: 330,
			protein: 43,
			carbs: 27,
			fat: 6
		},
		ingredients: [
			I("chicken breasts", 2, "lb", "Meat & Seafood"),
			I("black beans", 1, "can", "Pantry"),
			I("fire-roasted tomatoes", 1, "can", "Pantry"),
			I("corn", 1, "cup", "Frozen"),
			I("chicken broth", 6, "cups", "Pantry"),
			I("cumin", 2, "tsp", "Herbs & Spices"),
			I("tortilla chips", 1, "bag", "Pantry"),
			I("lime", 2, "", "Produce")
		],
		steps: [
			"Set a heavy pot over medium heat. Add the 2 pounds of chicken breasts, the 6 cups of chicken broth, the 1 can of fire-roasted tomatoes, and the 2 teaspoons of cumin.",
			"Simmer until the chicken shreds easily, about 20 minutes. Pull the chicken out, shred it, and return it to the pot.",
			"Add the 1 can of black beans and the 1 cup of corn. Simmer 10 minutes more.",
			"Ladle into bowls. Squeeze the 2 limes over and crush a handful of the tortilla chips on top.",
		],
	},
	{
		id: "breakfast-burritos",
		name: "Freezer breakfast burritos",
		description: "Eggs, beans, and cheese, wrapped for rushed mornings.",
		minutes: 60,
		servings: 8,
		protein: "eggs",
		plate: "taco",
		pack: "batch",
		tags: ["vegetarian", "batch"],
		nutrition: {
			cal: 370,
			protein: 22,
			carbs: 30,
			fat: 18
		},
		ingredients: [
			I("eggs", 12, "", "Dairy & Eggs"),
			I("black beans", 1, "can", "Pantry"),
			I("cheddar", 8, "oz", "Dairy & Eggs"),
			I("flour tortillas", 8, "", "Bakery"),
			I("potato", 2, "", "Produce"),
			I("salsa", 1, "cup", "Pantry")
		],
		steps: [
      "Dice the 2 potatoes small and fry them until crisp and tender, 12–15 minutes. Set aside.",
      "Beat the 12 eggs and scramble them over medium-low heat until just set and still a little wet — they finish cooking when reheated.",
      "Warm the 8 flour tortillas in a dry pan 15 seconds a side so they flex without cracking.",
      "Lay a line of egg down each tortilla with the potatoes, the 1 can of drained black beans, the 8 ounces of grated cheddar, and a spoon of the 1 cup of salsa. Fold the sides in and roll tight.",
      "Eat now, or cool completely, wrap each one in foil, and freeze up to 3 months. Reheat from frozen, unwrapped, 2–3 minutes in the microwave.",
    ]
	}
];
const CORE_FLAVOR: Record<string, { cuisine: string; aliases: string[]; extraTags?: string[] }> = {
	"lemon-garlic-chicken": {
		cuisine: "American",
		aliases: [
			"roast chicken",
			"sunday roast",
			"bird",
			"roast chook"
		],
		extraTags: ["old-school"]
	},
	"tomato-basil-pasta": {
		cuisine: "Italian",
		aliases: [
			"pomodoro",
			"spaghetti pomodoro",
			"tomato pasta"
		]
	},
	"black-bean-tacos": {
		cuisine: "Mexican",
		aliases: ["bean tacos", "veg tacos"]
	},
	"salmon-asparagus": {
		cuisine: "American",
		aliases: ["sheet pan salmon", "salmon dinner"]
	},
	"chicken-stir-fry": {
		cuisine: "East Asian",
		aliases: [
			"stirfry",
			"ginger chicken",
			"chix stir fry"
		]
	},
	"lentil-soup": {
		cuisine: "Middle Eastern",
		aliases: ["red lentil soup", "shorbat adas"]
	},
	"turkey-meatballs": {
		cuisine: "American",
		aliases: ["turkey balls"],
		extraTags: ["old-school"]
	},
	"veggie-fried-rice": {
		cuisine: "East Asian",
		aliases: ["fried rice", "egg fried rice"]
	},
	"sausage-peppers": {
		cuisine: "Italian",
		aliases: ["sausage and peppers", "sausage peppers onions"],
		extraTags: ["old-school"]
	},
	"chickpea-curry": {
		cuisine: "Indian",
		aliases: ["chana", "chickpea coconut"]
	},
	"greek-bowls": {
		cuisine: "Greek",
		aliases: ["greek chicken", "gyro bowl"]
	},
	"mushroom-risotto": {
		cuisine: "Italian",
		aliases: ["risotto"]
	},
	"beef-chili": {
		cuisine: "American",
		aliases: [
			"chili",
			"chilli",
			"chili con carne"
		],
		extraTags: ["old-school"]
	},
	"honey-garlic-shrimp": {
		cuisine: "East Asian",
		aliases: ["sticky shrimp", "garlic prawns"]
	},
	"shakshuka": {
		cuisine: "Middle Eastern",
		aliases: ["shakshouka", "eggs in tomato"]
	},
	"peanut-noodles": {
		cuisine: "East Asian",
		aliases: ["satay noodles", "peanut pasta"]
	},
	"tuna-white-bean": {
		cuisine: "Italian",
		aliases: ["tuna bean salad", "tonno e fagioli"]
	},
	"crispy-chickpea-wraps": {
		cuisine: "American",
		aliases: ["chickpea wrap"]
	},
	"miso-butter-cod": {
		cuisine: "East Asian",
		aliases: ["miso cod", "black cod"]
	},
	"pesto-gnocchi": {
		cuisine: "Italian",
		aliases: ["gnocchi", "gnoc"]
	},
	"egg-fried-greens": {
		cuisine: "American",
		aliases: ["eggs and greens"]
	},
	"turkey-taco-skillet": {
		cuisine: "Mexican",
		aliases: ["taco skillet", "turkey tacos"]
	},
	"sesame-soba": {
		cuisine: "East Asian",
		aliases: ["soba", "buckwheat noodles"]
	},
	"ham-pea-pasta": {
		cuisine: "Italian",
		aliases: ["ham pasta", "peas and pasta"]
	},
	"steak-chimichurri": {
		cuisine: "American",
		aliases: ["chimi steak", "argentine steak"]
	},
	"tofu-power-bowls": {
		cuisine: "East Asian",
		aliases: ["tofu bowl"]
	},
	"greek-yogurt-chicken": {
		cuisine: "Greek",
		aliases: ["yogurt chicken", "souvlaki chicken"]
	},
	"salmon-quinoa": {
		cuisine: "American",
		aliases: ["quinoa salmon"]
	},
	"beef-zucchini-skillet": {
		cuisine: "American",
		aliases: ["zucchini beef"]
	},
	"shrimp-cauliflower": {
		cuisine: "American",
		aliases: ["garlic shrimp"]
	},
	"cottage-egg-toast": {
		cuisine: "American",
		aliases: ["cottage cheese toast", "high protein toast"]
	},
	"turkey-chili-bowl": {
		cuisine: "American",
		aliases: ["turkey chili"]
	},
	"lasagna-bolognese": {
		cuisine: "Italian",
		aliases: [
			"lasagne",
			"lasagna",
			"bolognese lasagna"
		],
		extraTags: ["old-school"]
	},
	"chicken-rice-prep": {
		cuisine: "East Asian",
		aliases: ["meal prep chicken", "soy ginger chicken"]
	},
	"veg-minestrone": {
		cuisine: "Italian",
		aliases: ["minestrone"]
	},
	"pulled-pork": {
		cuisine: "American",
		aliases: ["slow pork", "oven pulled pork"],
		extraTags: ["old-school"]
	},
	"baked-oatmeal": {
		cuisine: "American",
		aliases: ["breakfast bake", "baked oats"]
	},
	"grain-salad": {
		cuisine: "American",
		aliases: ["farro salad", "roasted veg salad"]
	},
	"chicken-tortilla-soup": {
		cuisine: "Mexican",
		aliases: ["tortilla soup"]
	},
	"breakfast-burritos": {
		cuisine: "Mexican",
		aliases: ["freezer burritos", "egg burrito"]
	}
};
function withFlavor(list: Recipe[]) {
	return list.map((recipe) => {
		const extra = CORE_FLAVOR[recipe.id];
		if (!extra) return recipe;
		return {
			...recipe,
			cuisine: extra.cuisine,
			aliases: extra.aliases,
			tags: Array.from(new Set([
				...recipe.tags,
				...(extra.extraTags ?? []),
				extra.cuisine.toLowerCase()
			]))
		};
	});
}
const SOUTHERN_SOURCE = {
	book: "The Southern Cook Book of Fine Old Recipes",
	author: "Lillie S. Lustig, S. Claire Sondheim, Sarah Rensel",
	year: 1935,
	era: "1930s",
	archiveId: "southerncookbook00lustrich",
	credit: "The Southern Cook Book of Fine Old Recipes (Culinary Arts Press, 1935), compiled by Lillie S. Lustig, S. Claire Sondheim and Sarah Rensel. From the Prelinger Library / Internet Archive (southerncookbook00lustrich)."
};
function withSource(list: Recipe[], source: Recipe["source"], extraTags: string[]) {
	return list.map((recipe) => ({
		...recipe,
		source: recipe.source ?? source,
		tags: Array.from(new Set([...(recipe.tags ?? []), ...extraTags]))
	}));
}

// Diet flags are stamped after the polish so they read the rows the cook is
// actually shown: aligning the list to the method can add a butter, and a
// dairy-free badge computed before that would be a lie.
export const RECIPES: Recipe[] = polishCatalog(
  [
    ...withFlavor(CORE_RECIPES),
    ...EXTRA_RECIPES,
    ...WORLD_RECIPES,
    ...SAUCE_RECIPES,
    ...PLACE_RECIPES,
    ...DESSERT_RECIPES,
    ...BREAKFAST_RECIPES,
    ...withSource(SOUTHERN_RECIPES, SOUTHERN_SOURCE, ["vintage", "era-1930s", "book-southern-1935"]),
    ...EXPAND_RECIPES,
    ...PLUS_RECIPES,
    ...MORE_RECIPES,
    ...CLASSIC_RECIPES,
    ...WARTIME_RECIPES,
    ...HERITAGE_RECIPES,
    ...BOOK_RECIPES,
    ...TABLE_RECIPES,
    ...SWEET_ERA_RECIPES,
  ],
).map(decorateDietTags);

const RECIPE_BY_ID = new Map(RECIPES.map((r) => [r.id, r]));

export const ADDONS: Addon[] = [
  {
    id: "kitchen-table",
    name: "Kitchen Table",
    tagline: "Chef + family, one bill",
    description:
      "Extra chef dinners (40 a week, and invent), a live family table, the savings chart, training stats, and 3 streak saves a month. Budget week, leftovers, Fill cart, cook, and Next Gen stay free. $7.99/mo, or $69.99/year (two months on the house). Nothing is charged in this test kitchen.",
    price: 7.99,
    period: "month",
  },
  {
    id: "table-year",
    name: "Kitchen Table · year",
    tagline: "One bill, two months free",
    description:
      "A year of Kitchen Table for $69.99 instead of $95.88 monthly. Same kitchen: Chef, live seats, savings chart, training stats. Nothing is charged in this test kitchen.",
    price: 69.99,
    period: "once",
  },
  {
    id: "chef-plus",
    name: "Kitchen+",
    tagline: "More chef dinners each week",
    description:
      "Free kitchens get 3 chef dinners a week from the library. Kitchen+ raises that to 40 a week, and the chef can invent a homemade dish that fits your goal, calories, and allergies. Unlimited Snap. Kitchen Table already includes this.",
    price: 5.99,
    period: "month",
  },
  {
    id: "family",
    name: "Family table",
    tagline: "Share tonight with family",
    description:
      "Invite the people who eat with you. They get updates when dinner is picked or cooked. Each person can keep their own body goal. Kitchen Table already includes this.",
    price: 4.99,
    period: "month",
  },
  {
    id: "streak-save",
    name: "Streak Save",
    tagline: "Missed a night? Keep the streak",
    description:
      "Restores a cooking streak after one missed night, no different than it was. Kitchen Table includes a few free Streak Saves every month — this only charges if you've used those up. Offered right when a streak actually breaks, never before.",
    price: 1.99,
    period: "once",
  },
  {
    id: "founder",
    name: "Founder kitchen",
    tagline: "Lifetime Table — one bill, never again",
    description:
      "Kitchen Table for life, for the kitchens that believed first. $49 once instead of $7.99 every month. When billing is live, this is the one that never comes back. Limited in spirit, not a countdown clock.",
    price: 49,
    period: "once",
  },
  {
    id: "gift-table",
    name: "Gift a Table",
    tagline: "A month of dinner, for someone else",
    description:
      "You get a code. They type it in Extras and Kitchen Table is on for 30 days — Chef, seats, savings chart. $7.99 once. Cook, shop, and Fill cart stay free for everyone.",
    price: 7.99,
    period: "once",
  },
  {
    id: "trainer",
    name: "Trainer kitchen",
    tagline: "Plate up to 8 clients",
    description:
      "For a coach who eats with the people they train. Eight seats, Chef invent, live table pings. $19/mo — one bill, not eight. The kitchen they cook from stays free.",
    price: 19,
    period: "month",
  },
  {
    id: "team-kitchen",
    name: "Team kitchen",
    tagline: "Hockey, church, fire hall — one week",
    description:
      "Twelve seats and a shared week. $29 for the season, once. Catalog dinners, Fill cart, leftover vault — no 40-plate Chef burn. Rec league Sunday lunch, not a gym SKU.",
    price: 29,
    period: "once",
  },
  {
    id: "sos-3",
    name: "Weeknight SOS",
    tagline: "Three dinners when you're cooked",
    description:
      "Three extra Chef plates this week — the fridge-and-flyer kind. $2.99 once. Resets Monday. Dinner, shop, and cook stay ad-free.",
    price: 2.99,
    period: "once",
  },
  {
    id: "plates-15",
    name: "+15 Chef plates",
    tagline: "This week only",
    description:
      "Add 15 AI Chef plates to this week when the free three (or your Kitchen+ forty) run out. Resets Monday. Body Sync is free and is not part of this.",
    price: 2.99,
    period: "once",
  },
  {
    id: "plates-40",
    name: "+40 Chef plates",
    tagline: "A full extra week of Chef",
    description:
      "Add 40 AI Chef plates to this week. Best when you are cooking for a house and the Chef is doing the thinking. Resets Monday.",
    price: 5.99,
    period: "once",
  },
  {
    id: "skins-world",
    name: "World skins",
    tagline: "Egypt, Greece, Rome, the West, anime",
    description:
      "Six more kitchens to cook in — Pharaoh, Sparta, Athens, Rome, Wild West, Anime. Skins are paint, never a lock: the library, the log, Snap, and tonight's dinner work the same in every one. $3.99 once, yours for good.",
    price: 3.99,
    period: "once",
  },
  {
    id: "skins-season",
    name: "Season skins",
    tagline: "Petals, fireflies, falling leaves, snow",
    description:
      "Spring, Summer, Autumn, Winter — each with its own weather drifting behind the kitchen. $3.99 once, yours for good. Nothing you can cook with is behind this.",
    price: 3.99,
    period: "once",
  },
  {
    id: "tip-flour",
    name: "A bag of flour",
    tagline: "Buy the kitchen a staple",
    description:
      "A $3 thank-you. Dinner stays free. You get a chef plate this week as a nod. Nothing is charged in this test kitchen.",
    price: 3,
    period: "once",
  },
  {
    id: "tip-butter",
    name: "A week of butter",
    tagline: "Keep the lights on",
    description:
      "An $8 thank-you — about a week of dairy butter at Superstore. Three chef plates this week. Cook, shop, and Fill cart stay ad-free.",
    price: 8,
    period: "once",
  },
  {
    id: "body-sync",
    name: "Body Sync",
    tagline: "Included — your watch updates dinner",
    description:
      "Reads steps, heart, sleep, and workouts from Apple Health, Health Connect, Garmin, or Fitbit. A hard session puts carbs back. Short sleep gets an easier dinner. Always allow keeps this updating after you close the app. Free.",
    price: 0,
    period: "once",
  },
  {
    id: "midnight",
    name: "Midnight Kitchen",
    tagline: "Included — dim the kitchen anytime",
    description: "Ink walls, paprika light. Midnight is free. Toggle it from the header.",
    price: 0,
  },
];

export function recipeById(id: string): Recipe | undefined {
  return RECIPE_BY_ID.get(id);
}

export function packLabel(pack: Recipe["pack"]): string {
  if (pack === "weeknight") return "Weeknight";
  if (pack === "protein") return "Protein";
  if (pack === "batch") return "Batch";
  return "Library";
}
