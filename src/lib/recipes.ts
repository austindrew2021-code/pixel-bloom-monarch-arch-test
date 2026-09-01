import type { Addon, Recipe } from "./types";
import { BREAKFAST_RECIPES } from "./catalog-breakfast";
import { DESSERT_RECIPES } from "./catalog-desserts";
import { EXPAND_RECIPES } from "./catalog-expand";
import { EXTRA_RECIPES } from "./catalog-extra";
import { PLACE_RECIPES } from "./catalog-places";
import { SAUCE_RECIPES } from "./catalog-sauces";
import { SOUTHERN_RECIPES } from "./catalog-southern";
import { WORLD_RECIPES } from "./catalog-world";
import { PLUS_RECIPES } from "./catalog-plus";
import { MORE_RECIPES } from "./catalog-more";
import { CLASSIC_RECIPES } from "./catalog-classics";
import { WARTIME_RECIPES } from "./catalog-wartime";
import { HERITAGE_RECIPES } from "./catalog-heritage";
import { BOOK_RECIPES } from "./catalog-books";
import { TABLE_RECIPES } from "./catalog-table";
import { SWEET_ERA_RECIPES } from "./catalog-sweet";
import { polishCatalog } from "./cook-steps";
import { decorateDietTags } from "./diet";

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
			cal: 420,
			protein: 38,
			carbs: 6,
			fat: 26
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
			"Heat the oven to 425°F. Pat the chicken dry and salt it generously inside and out.",
			"Stuff the cavity with halved lemons, smashed garlic, and thyme.",
			"Rub the skin with olive oil, pepper, and a last pinch of salt.",
			"Roast 60–70 minutes until juices run clear and the skin is deep gold.",
			"Rest 10 minutes before carving. Spoon pan juices over the slices."
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
			cal: 510,
			protein: 16,
			carbs: 78,
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
			cal: 390,
			protein: 16,
			carbs: 54,
			fat: 13
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
			cal: 430,
			protein: 36,
			carbs: 8,
			fat: 28
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
			"Heat the oven to 425°F. Toss asparagus with oil, garlic, and salt on a sheet pan.",
			"Nestle salmon beside it. Season, add lemon slices, and roast 12–14 minutes.",
			"Serve with extra lemon at the table."
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
			cal: 380,
			protein: 32,
			carbs: 28,
			fat: 14
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
			"Start the rice. Slice chicken thin and toss with a spoon of soy.",
			"Sear chicken in a hot skillet until browned. Set aside.",
			"Stir-fry snap peas and pepper. Add ginger, garlic, remaining soy, and chicken.",
			"Glaze 1 minute. Finish with sesame oil and serve over rice."
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
			cal: 310,
			protein: 18,
			carbs: 44,
			fat: 8
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
			protein: 34,
			carbs: 22,
			fat: 24
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
			"Simmer covered 20 minutes until cooked through."
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
			cal: 360,
			protein: 12,
			carbs: 52,
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
			cal: 480,
			protein: 24,
			carbs: 18,
			fat: 34
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
			cal: 470,
			protein: 16,
			carbs: 48,
			fat: 24
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
			cal: 450,
			protein: 36,
			carbs: 32,
			fat: 18
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
			"Marinate chicken in lemon, oregano, salt, and oil. Grill or sear until cooked.",
			"Chop cucumber, tomato, and onion. Stir yogurt with lemon and salt.",
			"Slice chicken over rice. Add salad and a spoon of yogurt."
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
			cal: 520,
			protein: 14,
			carbs: 72,
			fat: 18
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
			"Sauté mushrooms in butter until browned; set aside.",
			"Cook shallot, add rice, then wine. Add broth a ladle at a time, stirring.",
			"When creamy, fold in mushrooms and parmesan."
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
			cal: 410,
			protein: 28,
			carbs: 32,
			fat: 18
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
			"Brown the 1½ lb of ground beef with the chopped onion. Drain extra fat.",
			"Stir in the 2 tablespoons of chili powder, the 1 teaspoon of cumin, the crushed tomatoes, the 2 cans of kidney beans, and a pinch of salt. Simmer 35 minutes.",
			"Serve with the cheddar."
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
			cal: 360,
			protein: 28,
			carbs: 34,
			fat: 10
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
			cal: 280,
			protein: 16,
			carbs: 18,
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
			cal: 490,
			protein: 16,
			carbs: 62,
			fat: 20
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
			cal: 340,
			protein: 28,
			carbs: 22,
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
		steps: ["Drain tuna and beans. Toss with lemon, oil, shaved onion, and parsley.", "Spoon over arugula. Salt generously."]
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
			cal: 410,
			protein: 15,
			carbs: 52,
			fat: 16
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
			cal: 320,
			protein: 30,
			carbs: 8,
			fat: 18
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
			cal: 540,
			protein: 14,
			carbs: 68,
			fat: 24
		},
		ingredients: [
			I("shelf-stable gnocchi", 1, "lb", "Pantry"),
			I("basil pesto", .5, "cup", "Pantry"),
			I("cherry tomatoes", 1, "pint", "Produce"),
			I("baby spinach", 3, "cups", "Produce"),
			I("parmesan", 1, "oz", "Dairy & Eggs")
		],
		steps: ["Crisp gnocchi in a slick of oil without boiling first.", "Add tomatoes until they burst. Kill the heat, fold in pesto and spinach."]
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
			cal: 310,
			protein: 16,
			carbs: 18,
			fat: 20
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
			cal: 390,
			protein: 32,
			carbs: 24,
			fat: 18
		},
		ingredients: [
			I("ground turkey", 1.5, "lb", "Meat & Seafood"),
			I("black beans", 1, "can", "Pantry"),
			I("frozen corn", 1, "cup", "Frozen"),
			I("taco seasoning", 2, "tbsp", "Herbs & Spices"),
			I("cheddar", 3, "oz", "Dairy & Eggs"),
			I("lettuce", 1, "head", "Produce")
		],
		steps: ["Brown the 1½ lb of ground turkey. Stir in the 2 tablespoons of taco seasoning, the black beans, and the 1 cup of frozen corn with 2 tablespoons of water.", "Simmer 8 minutes. Top with the cheddar and shredded lettuce."]
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
			cal: 430,
			protein: 14,
			carbs: 64,
			fat: 14
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
			cal: 520,
			protein: 24,
			carbs: 70,
			fat: 16
		},
		ingredients: [
			I("short pasta", 12, "oz", "Pantry"),
			I("ham steak", 8, "oz", "Meat & Seafood"),
			I("frozen peas", 1.5, "cups", "Frozen"),
			I("lemon", 1, "", "Produce"),
			I("cream", .5, "cup", "Dairy & Eggs"),
			I("parmesan", 1, "oz", "Dairy & Eggs")
		],
		steps: ["Boil pasta. In a pan, warm diced ham, peas, cream, and lemon zest.", "Toss with pasta, pasta water, and parmesan."]
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
			protein: 42,
			carbs: 4,
			fat: 38
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
			cal: 480,
			protein: 28,
			carbs: 48,
			fat: 20
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
			cal: 390,
			protein: 44,
			carbs: 8,
			fat: 18
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
			"Mix the 1 cup of plain Greek yogurt with the 4 cloves of garlic (minced), the juice of the lemon, the 1 teaspoon of cumin, and a pinch of salt.",
			"Coat the 2 pounds of chicken thighs and rest at least 20 minutes, or up to overnight in the fridge.",
			"Grill or roast at 425°F until the edges char and the thighs are cooked through, 18–22 minutes.",
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
			cal: 510,
			protein: 40,
			carbs: 34,
			fat: 24
		},
		ingredients: [
			I("salmon fillets", 4, "", "Meat & Seafood"),
			I("quinoa", 1.5, "cups", "Pantry"),
			I("dill", .25, "cup", "Produce"),
			I("Greek yogurt", .5, "cup", "Dairy & Eggs"),
			I("Dijon mustard", 1, "tbsp", "Pantry"),
			I("lemon", 1, "", "Produce")
		],
		steps: ["Roast salmon at 400°F for 12 minutes. Cook quinoa with salt.", "Fold dill into quinoa. Stir yogurt with mustard and lemon for a sauce."]
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
			cal: 410,
			protein: 32,
			carbs: 12,
			fat: 26
		},
		ingredients: [
			I("ground beef", 1.5, "lb", "Meat & Seafood"),
			I("zucchini", 3, "", "Produce"),
			I("garlic", 3, "cloves", "Produce"),
			I("crushed tomatoes", 1, "cup", "Pantry"),
			I("oregano", 1, "tsp", "Herbs & Spices"),
			I("parmesan", 1, "oz", "Dairy & Eggs")
		],
		steps: ["Brown beef. Add sliced zucchini, garlic, tomato, and oregano.", "Simmer until zucchini is tender. Finish with parmesan."]
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
			protein: 32,
			carbs: 12,
			fat: 12
		},
		ingredients: [
			I("shrimp", 1.5, "lb", "Meat & Seafood"),
			I("cauliflower", 1, "head", "Produce"),
			I("garlic", 5, "cloves", "Produce"),
			I("olive oil", 2, "tbsp", "Pantry"),
			I("lemon", 1, "", "Produce"),
			I("parsley", .25, "cup", "Produce")
		],
		steps: ["Roast cauliflower florets at 425°F until browned.", "Sauté shrimp and garlic. Toss with cauliflower, lemon, and parsley."]
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
			protein: 28,
			carbs: 28,
			fat: 14
		},
		ingredients: [
			I("cottage cheese", 1, "cup", "Dairy & Eggs"),
			I("eggs", 2, "", "Dairy & Eggs"),
			I("sourdough", 2, "slices", "Bakery"),
			I("chives", 2, "tbsp", "Produce"),
			I("chili flakes", .25, "tsp", "Herbs & Spices")
		],
		steps: ["Toast the bread. Spread cottage cheese thickly.", "Fry or poach eggs. Set on toast with chives and chili."]
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
			cal: 360,
			protein: 34,
			carbs: 30,
			fat: 10
		},
		ingredients: [
			I("ground turkey", 2, "lb", "Meat & Seafood"),
			I("black beans", 2, "cans", "Pantry"),
			I("crushed tomatoes", 1, "can", "Pantry"),
			I("onion", 1, "", "Produce"),
			I("chili powder", 2, "tbsp", "Herbs & Spices"),
			I("Greek yogurt", .5, "cup", "Dairy & Eggs")
		],
		steps: ["Brown the 2 lb of ground turkey with the onion. Stir in the 2 tablespoons of chili powder, the crushed tomatoes, and the 2 cans of black beans.", "Simmer 25 minutes. Top bowls with the Greek yogurt."]
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
			cal: 580,
			protein: 32,
			carbs: 48,
			fat: 28
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
			"Make a simple bolognese with beef, onion, garlic, and tomatoes. Simmer 30 minutes.",
			"Layer noodles, sauce, ricotta, and mozzarella. Bake 45 minutes at 375°F.",
			"Rest 15 minutes. Cool leftovers in portions."
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
			cal: 440,
			protein: 36,
			carbs: 46,
			fat: 12
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
			"Bake 30 minutes, until the chicken is cooked through and the edges are browned.",
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
			cal: 280,
			protein: 12,
			carbs: 46,
			fat: 6
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
		steps: ["Sweat carrot, celery, and onion. Add tomato, broth, beans, and zucchini.", "Simmer 25 minutes. Add pasta and kale until tender. Season well."]
	},
	{
		id: "pulled-pork",
		name: "Slow oven pulled pork",
		description: "Rub, roast, shred. Tacos, bowls, sandwiches.",
		minutes: 240,
		servings: 10,
		protein: "pork",
		plate: "roast",
		pack: "batch",
		tags: ["batch"],
		nutrition: {
			cal: 390,
			protein: 34,
			carbs: 8,
			fat: 24
		},
		ingredients: [
			I("pork shoulder", 4, "lb", "Meat & Seafood"),
			I("brown sugar", 2, "tbsp", "Pantry"),
			I("paprika", 2, "tbsp", "Herbs & Spices"),
			I("cumin", 1, "tsp", "Herbs & Spices"),
			I("onion", 1, "", "Produce"),
			I("apple cider vinegar", .25, "cup", "Pantry")
		],
		steps: ["Rub pork with sugar and spices. Set on onion in a Dutch oven with vinegar.", "Cover and roast at 300°F for 4 hours. Shred. Keep the juices."]
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
			cal: 260,
			protein: 8,
			carbs: 38,
			fat: 8
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
			cal: 320,
			protein: 10,
			carbs: 48,
			fat: 12
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
			protein: 28,
			carbs: 26,
			fat: 12
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
			cal: 380,
			protein: 20,
			carbs: 42,
			fat: 14
		},
		ingredients: [
			I("eggs", 12, "", "Dairy & Eggs"),
			I("black beans", 1, "can", "Pantry"),
			I("cheddar", 8, "oz", "Dairy & Eggs"),
			I("flour tortillas", 8, "", "Bakery"),
			I("potato", 2, "", "Produce"),
			I("salsa", 1, "cup", "Pantry")
		],
		steps: ["Crisp diced potato. Scramble eggs softly. Warm beans.", "Fill tortillas, wrap tight in foil, freeze. Reheat from frozen in a skillet or microwave."]
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
  ].map(decorateDietTags),
);

const RECIPE_BY_ID = new Map(RECIPES.map((r) => [r.id, r]));

export const ADDONS: Addon[] = [
  {
    id: "kitchen-table",
    name: "Kitchen Table",
    tagline: "Chef + family, one bill",
    description:
      "40 AI Chef plates a week, any homemade dish fitted to each eater's calories and body goal, plus six family seats with live meal pings, plus a savings tracker showing what home cooking is worth versus takeout, plus a training dashboard — PR history, best lifts, and a volume trend. Includes a few free Streak Saves a month so one missed night never costs you the streak. Kitchen+ and Family a la carte are $4.99 each ($9.98). Together here they're $7.99. Body Sync stays free. Extra plate packs are below if you run out. Nothing is charged in this test kitchen.",
    price: 7.99,
    period: "month",
  },
  {
    id: "chef-plus",
    name: "Kitchen+",
    tagline: "The chef cooks the whole world",
    description:
      "Free kitchens get 3 AI Chef plates a week from the library. Kitchen+ raises that to 40 plates a week, and the chef invents homemade dishes fitted to your goal, calories, allergies, and what you lifted. Unlimited Snap. Kitchen Table already includes this.",
    price: 4.99,
    period: "month",
  },
  {
    id: "family",
    name: "Family table",
    tagline: "One kitchen, six seats, live updates",
    description:
      "Share tonight with the people who eat it. Invite codes, live meal pings, and a feed when someone plates, cooks, or heads to the store. Each seat can keep its own body goal — the table follows the strictest Cut so nobody gets fritters on a diet. Kitchen Table already includes this.",
    price: 4.99,
    period: "month",
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
    id: "streak-save",
    name: "Streak Save",
    tagline: "Missed a night? Keep the streak",
    description:
      "Restores a cooking streak after one missed night, no different than it was. Kitchen Table includes a few free Streak Saves every month — this only charges if you've used those up. Offered right when a streak actually breaks, never before.",
    price: 1.99,
    period: "once",
  },
  {
    id: "body-sync",
    name: "Body Sync",
    tagline: "Included — your watch plates dinner",
    description:
      "Apple Health, Health Connect, Garmin, and Fitbit already hold the day: rings, heart, sleep, water. Body Sync is free. It reads that and plates tonight to match. Short sleep gets an easier dinner. A hard session puts the carbs back. Always allow keeps Fuel current after you leave.",
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
