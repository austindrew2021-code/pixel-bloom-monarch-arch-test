import { I, dish } from "./catalog-kit.ts";
import type { Recipe, RecipeSource } from "./types";

function src(
  book: string,
  author: string,
  year: number,
  era: string,
  archiveId: string,
  credit: string,
): RecipeSource {
  return { book, author, year, era, archiveId, credit };
}

const virginia = src(
  "The Virginia Housewife",
  "Mary Randolph",
  1824,
  "1820s",
  "virginiahousewif00rand",
  "Mary Randolph, The Virginia Housewife (1824). Public domain.",
);
const simmons = src(
  "American Cookery",
  "Amelia Simmons",
  1796,
  "1790s",
  "americancookery00simm",
  "Amelia Simmons, American Cookery (Hartford, 1796). Public domain. The first American cookbook.",
);
const whiteHouse = src(
  "White House Cook Book",
  "F. L. Gillette & Hugo Ziemann",
  1887,
  "1880s",
  "whitehousecookbo00gill",
  "F. L. Gillette and Hugo Ziemann, White House Cook Book (1887). Public domain.",
);
const gentile = src(
  "The Italian Cook Book",
  "Maria Gentile",
  1919,
  "1910s",
  "italiancookbook00gent",
  "Maria Gentile, The Italian Cook Book (Italian Book Co., 1919). Public domain via Project Gutenberg #24407.",
);
const foreign365 = src(
  "365 Foreign Dishes",
  "Anonymous",
  1908,
  "1900s",
  "365foreigndishes00newy",
  "365 Foreign Dishes (George W. Jacobs, 1908). Public domain.",
);
const paDutch = src(
  "Pennsylvania German household cooking",
  "Traditional",
  1900,
  "1900s",
  "pagermanhousehold",
  "Pennsylvania German / Dutch household dishes as cooked in 19th-century kitchens. Traditional, public domain.",
);
const picayune = src(
  "The Picayune Creole Cook Book",
  "The Picayune",
  1901,
  "1900s",
  "picayunecreoleco00neworich",
  "The Picayune Creole Cook Book (New Orleans, 1901). Public domain.",
);
const kephart = src(
  "Camping and Woodcraft",
  "Horace Kephart",
  1917,
  "1910s",
  "campingwoodcraft00keph",
  "Horace Kephart, Camping and Woodcraft (1917). Public domain.",
);
const ladiesAid = src(
  "Woman Suffrage Cook Book",
  "Mrs. Hattie A. Burr",
  1886,
  "1880s",
  "womansuffragecoo00burr",
  "Mrs. Hattie A. Burr, The Woman Suffrage Cook Book (Boston, 1886), and typical Ladies' Aid church-supper dishes. Public domain.",
);
const hill = src(
  "Salads, Sandwiches and Chafing Dishes",
  "Janet McKenzie Hill",
  1909,
  "1900s",
  "saladssandwiches00hill",
  "Janet McKenzie Hill, Salads, Sandwiches and Chafing Dishes (1909). Public domain.",
);
const bosse = src(
  "Chinese-Japanese Cook Book",
  "Sara Bosse & Onoto Watanna",
  1914,
  "1910s",
  "chinesejapanesec00boss",
  "Sara Bosse and Onoto Watanna (Winnifred Eaton), Chinese-Japanese Cook Book (Rand McNally, 1914). Public domain.",
);
const oliveGreen = src(
  "How to Cook Fish",
  "Olive Green",
  1908,
  "1900s",
  "howtocookfish00gree",
  "Olive Green, How to Cook Fish (Putnam, 1908). Public domain.",
);
const jewish = src(
  "The International Jewish Cook Book",
  "Florence Kreisler Greenbaum",
  1918,
  "1910s",
  "internationaljew00gree",
  "Florence Kreisler Greenbaum, The International Jewish Cook Book (Bloch, 1918). Public domain.",
);
const fulton = src(
  "Vegetarian Cookery",
  "E. G. Fulton",
  1904,
  "1900s",
  "vegetariancooker00fult",
  "Early American vegetarian household cooking, 1900–1910. Public domain.",
);
const desserts365 = src(
  "365 Desserts",
  "Anonymous",
  1900,
  "1900s",
  "365desserts00newy",
  "365 Desserts: A Dessert for Every Day in the Year (1900). Public domain.",
);
const twenties = src(
  "American luncheon cookery",
  "Household magazines, 1920s",
  1925,
  "1920s",
  "americanluncheon1920s",
  "American luncheon and supper dishes as printed in 1920s household pages. Recipes here follow public-domain 1925 and earlier sources.",
);

function h(
  id: string,
  name: string,
  cuisine: string,
  tags: string[],
  protein: Recipe["protein"],
  plate: Recipe["plate"],
  minutes: number,
  description: string,
  ingredients: Recipe["ingredients"],
  steps: string[],
  source: RecipeSource,
  nutrition: Recipe["nutrition"],
): Recipe {
  return dish({
    id,
    name,
    cuisine,
    description,
    minutes,
    protein,
    plate,
    tags: Array.from(new Set(["vintage", ...tags])),
    ingredients,
    steps,
    nutrition,
    source,
  });
}

export const HERITAGE_RECIPES: Recipe[] = [
  // --- Virginia Housewife / Simmons (colonial) ---
  h("vh-va-beaten-biscuits", "Beaten biscuits", "Southern", ["era-1820s", "book-virginia", "baking", "vegetarian", "old-school"], "veg", "bowl", 50, "Mary Randolph's biscuits: dough beaten until it blisters, pricked, baked hot.", [I("flour", 4, "cups", "Pantry"), I("lard or butter", 0.5, "cup", "Dairy & Eggs"), I("salt", 1, "tsp", "Herbs & Spices"), I("cold water", 1, "cup", "Other")], ["Heat the oven to 400°F. Rub the lard into the flour and salt until the mix looks like coarse meal.", "Add cold water a little at a time until a very stiff dough forms. It should not be sticky.", "Beat the dough with a rolling pin or mallet 15–20 minutes, until the surface blisters. This is the whole method — do not add yeast.", "Roll ½ inch thick. Cut small rounds. Prick each biscuit all over with a fork.", "Bake 20–25 minutes, until pale gold and dry in the center. Serve split, with butter or ham."], virginia, { cal: 140, protein: 3, carbs: 20, fat: 5 }),
  h("vh-va-chicken-pudding", "Virginia chicken pudding", "Southern", ["era-1820s", "book-virginia", "old-school"], "chicken", "roast", 70, "Jointed chicken in a batter pudding, baked until the custard sets around the bird.", [I("chicken", 1, "bird", "Meat & Seafood"), I("flour", 1, "cup", "Pantry"), I("milk", 2, "cups", "Dairy & Eggs"), I("eggs", 3, "", "Dairy & Eggs"), I("butter", 2, "tbsp", "Dairy & Eggs"), I("salt", 1, "tsp", "Herbs & Spices")], ["Joint the chicken. Salt it. Brown the pieces in butter 8 minutes, until the skin is gold.", "Heat the oven to 375°F. Lay the chicken in a buttered baking dish.", "Beat the eggs, milk, flour, and salt into a smooth batter, no lumps.", "Pour the batter over the chicken. It should come about halfway up the pieces.", "Bake 45 minutes, until the pudding is puffed and set and the chicken is cooked through. Serve from the dish."], virginia, { cal: 480, protein: 38, carbs: 22, fat: 26 }),
  h("vh-va-fried-catfish", "Randolph fried catfish", "Southern", ["era-1820s", "book-virginia", "old-school"], "fish", "fish", 25, "Catfish, cornmeal, hot lard. The Virginia Housewife fish fry.", [I("catfish fillets", 1.5, "lb", "Meat & Seafood"), I("cornmeal", 1, "cup", "Pantry"), I("lard or oil", 1, "cup", "Pantry"), I("salt", 1.5, "tsp", "Herbs & Spices"), I("black pepper", 0.5, "tsp", "Herbs & Spices"), I("lemon", 1, "", "Produce")], ["Pat the catfish dry. Salt and pepper both sides.", "Dredge each fillet in cornmeal, pressing so it sticks. Shake off the extra.", "Heat ½ inch of lard in a skillet until a pinch of meal sizzles at once, about 365°F.", "Fry 3–4 minutes a side, until the crust is deep gold and the fish flakes. Do not crowd the pan.", "Drain the fried fillets on paper. Serve hot with lemon wedges."], virginia, { cal: 380, protein: 28, carbs: 16, fat: 22 }),
  h("vh-am-indian-pudding", "Indian pudding", "American", ["era-1790s", "baking", "dessert", "vegetarian", "old-school"], "veg", "dessert", 120, "Amelia Simmons: cornmeal, molasses, milk, baked long and slow.", [I("cornmeal", 0.5, "cup", "Pantry"), I("milk", 4, "cups", "Dairy & Eggs"), I("molasses", 0.5, "cup", "Pantry"), I("butter", 2, "tbsp", "Dairy & Eggs"), I("ginger", 1, "tsp", "Herbs & Spices"), I("salt", 0.5, "tsp", "Herbs & Spices")], ["Heat the oven to 300°F. Butter a baking dish.", "Scald 3 cups of the milk. Whisk the cornmeal into the remaining cup of cold milk, then stir into the hot milk.", "Cook over low heat 10 minutes, stirring, until it thickens. Take off the heat. Stir in molasses, butter, ginger, and salt.", "Pour into the dish. Bake 90 minutes, until the center is just set and the top is dark.", "Serve the pudding warm, with cream if you have it."], simmons, { cal: 240, protein: 6, carbs: 40, fat: 7 }),
  h("vh-am-slapjacks", "Slapjacks", "American", ["era-1790s", "breakfast", "vegetarian", "old-school"], "veg", "skillet", 20, "Simmons's flapjacks: a thin batter of flour, milk, and egg, fried on a griddle.", [I("flour", 1.5, "cups", "Pantry"), I("milk", 1.5, "cups", "Dairy & Eggs"), I("egg", 1, "", "Dairy & Eggs"), I("salt", 0.5, "tsp", "Herbs & Spices"), I("lard or butter", 2, "tbsp", "Dairy & Eggs")], ["Beat the egg. Stir in the 1½ cups of milk, then the 1½ cups of flour and the ½ teaspoon of salt, until the batter is smooth and pourable.", "Heat a griddle or skillet over medium heat and grease it with a little of the 2 tablespoons of lard or butter. The fat greases the pan between batches; it does not go into the batter.", "Pour ¼-cup rounds. Cook 2 minutes, until bubbles open on top and the edges look dry.", "Flip once and cook 1–2 minutes more, until gold on the second side.", "Serve stacked, with molasses or butter."], simmons, { cal: 180, protein: 6, carbs: 26, fat: 6 }),
  h("vh-va-hoe-cakes", "Hoe cakes", "Southern", ["era-1820s", "book-virginia", "breakfast", "vegetarian", "old-school"], "veg", "skillet", 20, "Cornmeal, water, salt, fried in a little fat. Bread when there is no oven.", [I("cornmeal", 2, "cups", "Pantry"), I("boiling water", 1.5, "cups", "Other"), I("salt", 1, "tsp", "Herbs & Spices"), I("bacon fat or lard", 3, "tbsp", "Pantry")], ["Stir the 1 teaspoon of salt into the 2 cups of cornmeal. Pour on the 1½ cups of boiling water and mix to a thick batter. Rest 5 minutes so the meal swells.", "Heat the 3 tablespoons of bacon fat or lard in a skillet over medium heat. The fat goes in the pan, not in the batter.", "Drop the batter in 3-inch cakes, flattening them slightly with the back of the spoon.", "Fry 3–4 minutes a side, until a brown crust forms and the middle is cooked through.", "Serve hot with the 2 tablespoons of butter or molasses."], virginia, { cal: 200, protein: 4, carbs: 32, fat: 7 }),
  h("vh-va-apple-tansey", "Apple tansey", "American", ["era-1820s", "book-virginia", "breakfast", "vegetarian"], "eggs", "skillet", 20, "Sliced apples fried, eggs poured over, a nutmeg custard in the pan.", [I("apples", 3, "", "Produce"), I("eggs", 4, "", "Dairy & Eggs"), I("butter", 2, "tbsp", "Dairy & Eggs"), I("sugar", 2, "tbsp", "Pantry"), I("nutmeg", 0.25, "tsp", "Herbs & Spices"), I("cream", 2, "tbsp", "Dairy & Eggs")], ["Peel, core, and slice the apples. Melt the butter in a skillet over medium heat.", "Fry the apples 6–8 minutes, until they soften and take a little color.", "Beat the eggs with cream, sugar, nutmeg, and a pinch of salt.", "Pour the eggs over the apples. Cook 4 minutes, tilting the pan, until the eggs are just set.", "Slide onto a plate. Serve hot, apples on top of the eggs."], virginia, { cal: 280, protein: 10, carbs: 22, fat: 16 }),
  h("vh-va-brunswick", "Virginia Brunswick stew", "Southern", ["era-1820s", "book-virginia", "old-school", "soup"], "chicken", "soup", 120, "Chicken, lima beans, corn, tomato — the Tidewater pot. Squirrel if you have it; chicken if you do not.", [I("chicken", 1, "bird", "Meat & Seafood"), I("lima beans", 2, "cups", "Produce"), I("corn kernels", 2, "cups", "Produce"), I("tomatoes", 4, "", "Produce"), I("onion", 1, "", "Produce"), I("potato", 2, "", "Produce")], ["Cover the chicken with water. Simmer 45 minutes. Lift it out, pull the meat, and return the meat to the broth. Discard the bones.", "Add the chopped onion, potato, lima beans, and tomatoes. Simmer 30 minutes.", "Add the corn. Cook 15 minutes more, until the stew is thick enough to stand a spoon.", "Salt and pepper. Some cooks mash a little of the potato to thicken further.", "Serve in bowls with bread. It is better the next day."], virginia, { cal: 360, protein: 32, carbs: 32, fat: 10 }),

  // --- White House 1887 ---
  h("vh-wh-oyster-stew", "White House oyster stew", "American", ["era-1880s", "book-white-house", "soup", "quick"], "seafood", "soup", 20, "Oysters, milk, butter, a cracker. The 1887 White House kettle.", [I("oysters", 1, "pint", "Meat & Seafood"), I("milk", 3, "cups", "Dairy & Eggs"), I("butter", 3, "tbsp", "Dairy & Eggs"), I("salt", 1, "tsp", "Herbs & Spices"), I("paprika", 0.25, "tsp", "Herbs & Spices"), I("common crackers", 8, "", "Bakery")], ["Drain the oysters, saving their liquor. Pick over for shell.", "Warm the milk with the oyster liquor in a saucepan over medium-low heat. Do not boil.", "Add the oysters and butter. Cook 3–4 minutes, until the oyster edges ruffle. Take off the heat.", "Add salt and paprika. Taste the stew — the oysters are already briny.", "Serve at once in warm bowls with crackers. Oysters go tough if they sit."], whiteHouse, { cal: 280, protein: 16, carbs: 14, fat: 16 }),
  h("vh-wh-beef-a-la-mode", "Beef à la mode", "American", ["era-1880s", "book-white-house", "old-school"], "beef", "roast", 210, "A larded round of beef, onion, carrot, a long slow braise. Company meat of 1887.", [I("beef round", 3, "lb", "Meat & Seafood"), I("salt pork", 4, "oz", "Meat & Seafood"), I("onion", 2, "", "Produce"), I("carrot", 3, "", "Produce"), I("flour", 3, "tbsp", "Pantry"), I("beef broth", 2, "cups", "Pantry")], ["Cut the salt pork into strips and lard the beef, or lay the pork over the top. Salt and pepper the meat.", "Brown the beef on all sides in a heavy pot, 8 minutes. Take it out.", "Cook the sliced onion and carrot in the pot 5 minutes. Sprinkle the flour, stir 1 minute, then add the broth.", "Return the beef. Cover. Simmer on low, or bake at 325°F, 3 hours, until a fork slides in.", "Slice across the grain. Serve with the vegetables and gravy."], whiteHouse, { cal: 420, protein: 42, carbs: 8, fat: 22 }),
  h("vh-wh-saratoga", "Saratoga potatoes", "American", ["era-1880s", "book-white-house", "vegetarian"], "veg", "skillet", 30, "Paper-thin potatoes, soaked, dried, fried crisp. The Saratoga chip of the White House book.", [I("potatoes", 2, "lb", "Produce"), I("lard or oil", 4, "cups", "Pantry"), I("salt", 1, "tsp", "Herbs & Spices")], ["Peel the 2 pounds of potatoes and slice them as thin as you can — a mandoline if you have one.", "Soak the slices in cold water 20 minutes to pull the starch out, then drain and dry them thoroughly on a cloth. Any water left on them will spit in the fat.", "Toss them in the 1 tablespoon of cornstarch, which is what gives the chip its glassy snap.", "Heat the 4 cups of lard or oil to 365°F and fry a small handful at a time, 2–3 minutes, until pale gold and crisp. Do not crowd the pot.", "Lift them onto paper and salt them at once with the 1 teaspoon of salt, while they are still hot enough to take it.", "Serve as soon as they cool enough to pick up. They soften if they sit in a closed dish."], whiteHouse, { cal: 220, protein: 2, carbs: 22, fat: 14 }),
  h("vh-wh-chicken-croquettes", "Chicken croquettes", "American", ["era-1880s", "book-white-house", "old-school"], "chicken", "skillet", 45, "Minced chicken bound with thick white sauce, shaped, crumbed, fried.", [I("cooked chicken", 2, "cups", "Meat & Seafood"), I("butter", 3, "tbsp", "Dairy & Eggs"), I("flour", 0.33, "cup", "Pantry"), I("milk", 1, "cup", "Dairy & Eggs"), I("eggs", 2, "", "Dairy & Eggs"), I("bread crumbs", 1.5, "cups", "Bakery")], ["Mince the chicken fine. Melt the butter, add the flour, cook 2 minutes. Whisk in the milk until very thick. Salt, pepper, a pinch of nutmeg.", "Stir the chicken into the sauce. Chill 1 hour, until the mix holds a shape.", "Shape into cones or cylinders with wet hands.", "Beat the eggs. Roll each croquette in crumbs, then egg, then crumbs again.", "Fry in 365°F fat 3–4 minutes, until deep gold. Drain. Serve hot."], whiteHouse, { cal: 340, protein: 22, carbs: 18, fat: 20 }),
  h("vh-wh-clam-chowder", "White House clam chowder", "American", ["era-1880s", "book-white-house", "soup"], "seafood", "soup", 40, "Clams, salt pork, potato, milk. New England in the 1887 book.", [I("clams", 2, "dozen", "Meat & Seafood"), I("salt pork", 2, "oz", "Meat & Seafood"), I("potatoes", 3, "", "Produce"), I("onion", 1, "", "Produce"), I("milk", 3, "cups", "Dairy & Eggs"), I("common crackers", 6, "", "Bakery")], ["Steam or shuck the clams. Chop the meat. Save 1 cup of the liquor, strained.", "Try out the diced salt pork until crisp. Cook the chopped onion in the fat 4 minutes.", "Add diced potatoes and the clam liquor plus water to cover. Simmer 15 minutes, until the potato is tender.", "Add the clams and the milk. Heat until steaming — do not boil or the milk will curdle.", "Salt, pepper. Serve with split crackers in the bowl."], whiteHouse, { cal: 320, protein: 18, carbs: 28, fat: 14 }),
  h("vh-wh-floating-island", "Floating island", "American", ["era-1880s", "book-white-house", "dessert", "vegetarian"], "eggs", "dessert", 30, "Soft custard in a dish, islands of poached meringue. A White House sweet.", [I("milk", 3, "cups", "Dairy & Eggs"), I("eggs", 4, "", "Dairy & Eggs"), I("sugar", 0.5, "cup", "Pantry"), I("vanilla", 1, "tsp", "Pantry"), I("salt", 1, "pinch", "Herbs & Spices")], ["Separate the eggs. Scald the milk. Beat the yolks with 6 tablespoons of the sugar.", "Stir a little hot milk into the yolks, then return all to the pan. Cook over low heat, stirring, until the custard coats a spoon. Do not boil. Add vanilla. Cool.", "Beat the whites with the remaining sugar and the salt until stiff.", "Poach spoonfuls of meringue in barely simmering milk or water 1 minute a side. Lift onto a cloth.", "Pour the custard into a dish. Float the meringues on top. Serve cold."], whiteHouse, { cal: 180, protein: 8, carbs: 22, fat: 6 }),
  h("vh-wh-macaroni-cheese", "Baked macaroni and cheese", "American", ["era-1880s", "book-white-house", "vegetarian", "old-school", "comfort"], "veg", "pasta", 40, "Boiled macaroni, white sauce, grated cheese, crumbs on top. The 1887 bake.", [I("macaroni", 8, "oz", "Pantry"), I("cheddar or American cheese", 8, "oz", "Dairy & Eggs"), I("butter", 3, "tbsp", "Dairy & Eggs"), I("flour", 3, "tbsp", "Pantry"), I("milk", 2, "cups", "Dairy & Eggs"), I("bread crumbs", 0.5, "cup", "Bakery")], ["Heat the oven to 375°F. Boil the macaroni in salted water until just tender, 8–10 minutes. Drain.", "Melt the butter, add the flour, cook 2 minutes. Whisk in the milk until smooth and thick, 4 minutes.", "Stir in most of the grated cheese until melted. Salt and pepper.", "Mix the macaroni with the sauce. Turn into a buttered dish. Top with remaining cheese and crumbs.", "Bake 20 minutes, until bubbling and the top is gold. Serve hot."], whiteHouse, { cal: 480, protein: 20, carbs: 44, fat: 24 }),
  h("vh-wh-hash", "White House hash", "American", ["era-1880s", "book-white-house", "old-school", "budget"], "beef", "skillet", 25, "Yesterday's roast, potato, onion, browned in a pan until a crust forms.", [I("cooked roast beef", 2, "cups", "Meat & Seafood"), I("cooked potatoes", 2, "cups", "Produce"), I("onion", 1, "", "Produce"), I("butter or drippings", 2, "tbsp", "Dairy & Eggs"), I("beef broth", 0.5, "cup", "Pantry"), I("parsley", 2, "tbsp", "Produce")], ["Chop the 2 cups of cooked roast beef and the 2 cups of cooked potatoes separately, not too fine, and chop the onion.", "Melt the 2 tablespoons of butter or drippings in a skillet over medium heat and cook the onion 4 minutes.", "Add the beef and potato and press them into an even layer. Pour the ½ cup of beef broth in around the edge.", "Cook without stirring 10 minutes, until a brown crust forms underneath. Stirring is what stops a hash from crusting.", "Fold it over, or turn it out crust side up, and scatter the 2 tablespoons of parsley.", "Fry the egg and set it on top if it is breakfast. Serve hot."], whiteHouse, { cal: 340, protein: 24, carbs: 22, fat: 16 }),

  // --- Gentile 1919 ---
  h("vh-gt-brodo", "Brodo", "Italian", ["era-1910s", "book-gentile", "international", "italian", "soup"], "beef", "soup", 180, "Maria Gentile: beef and bones in cold water, brought slowly, greens in. The broth that starts the Italian kitchen.", [I("beef shank", 2, "lb", "Meat & Seafood"), I("beef bones", 1, "lb", "Meat & Seafood"), I("carrot", 1, "", "Produce"), I("celery", 2, "stalks", "Produce"), I("onion", 1, "", "Produce"), I("parsley", 4, "sprigs", "Produce")], ["Put the meat and bones in a pot with 3 quarts of cold water. Bring slowly to a simmer — never a hard boil.", "Skim the foam. Add the whole carrot, celery, onion, and parsley, and 1 teaspoon salt.", "Simmer uncovered 2½ hours. Skim now and then. The surface should barely tremble.", "Lift out the meat (serve it separately or chop it back in). Strain the broth through cloth.", "Cool and lift the fat, or serve the same day with pasta or rice."], gentile, { cal: 80, protein: 10, carbs: 2, fat: 3 }),
  h("vh-gt-minestrone", "Minestrone alla Milanese", "Italian", ["era-1910s", "book-gentile", "international", "italian", "soup"], "pork", "soup", 90, "Salt pork, rice, cabbage, beans — Gentile's Milanese minestrone, good hot or cold.", [I("salt pork", 4, "oz", "Meat & Seafood"), I("rice", 0.5, "cup", "Pantry"), I("cabbage", 0.25, "head", "Produce"), I("carrot", 2, "", "Produce"), I("zucchini", 1, "", "Produce"), I("cooked white beans", 1, "cup", "Pantry")], ["Dice the salt pork. Render it in a pot 6 minutes. Add sliced carrot and cook 4 minutes.", "Add 8 cups water, the shredded cabbage, and the zucchini. Simmer 30 minutes.", "Add the rice and the beans. Cook 18 minutes more, until the rice is tender.", "Salt, pepper, a little grated cheese if you have it. The soup should be thick.", "Serve hot, or cool and eat cold the next day as Gentile says the Milanese do."], gentile, { cal: 280, protein: 10, carbs: 32, fat: 12 }),
  h("vh-gt-risotto", "Risotto alla Milanese", "Italian", ["era-1910s", "book-gentile", "international", "italian", "vegetarian"], "veg", "bowl", 35, "Onion in butter, rice, broth by the ladle, saffron, cheese. Gentile's method.", [I("arborio or short rice", 1.5, "cups", "Pantry"), I("onion", 1, "", "Produce"), I("butter", 4, "tbsp", "Dairy & Eggs"), I("beef or vegetable broth", 5, "cups", "Pantry"), I("saffron", 1, "pinch", "Herbs & Spices"), I("parmesan", 2, "oz", "Dairy & Eggs")], ["Keep the broth hot in a separate pot. Melt 2 tablespoons of butter. Cook the sliced onion until gold, 6 minutes. Do not burn it.", "Add the rice and stir 2 minutes, until the grains look glassy.", "Add broth a ladle at a time, stirring, waiting until each is absorbed, 18 minutes in all.", "Dissolve the saffron in a spoon of broth and stir it in with the remaining butter and the grated cheese.", "Take off the heat. The risotto should be creamy, not dry, and served at once."], gentile, { cal: 420, protein: 12, carbs: 62, fat: 14 }),
  h("vh-gt-cacciatora", "Pollo alla cacciatora", "Italian", ["era-1910s", "book-gentile", "international", "italian"], "chicken", "skillet", 50, "Hunter's chicken: browned joints, onion, tomato. Gentile's way with a tough bird.", [I("chicken", 1, "bird", "Meat & Seafood"), I("onion", 1, "", "Produce"), I("tomatoes", 4, "", "Produce"), I("olive oil", 3, "tbsp", "Pantry"), I("rosemary", 1, "sprig", "Produce"), I("salt", 1, "tsp", "Herbs & Spices")], ["Joint the chicken. Salt it. Brown the pieces in oil 8 minutes, until the skin is gold. Take them out.", "Cook the chopped onion in the same pan 5 minutes. Add chopped tomatoes and rosemary.", "Return the chicken. Add ½ cup water. Cover and simmer 30 minutes, until the joints run clear.", "Uncover 5 minutes if the sauce is thin. Pepper.", "Serve with bread or polenta. This is the method Gentile gives for a bird that is not young."], gentile, { cal: 380, protein: 36, carbs: 8, fat: 22 }),
  h("vh-gt-pomodoro", "Salsa di pomodoro", "Italian", ["era-1910s", "book-gentile", "international", "italian", "sauce", "vegetarian", "vegan"], "veg", "bowl", 40, "Onion, garlic, celery, parsley, tomato. Gentile's sauce for pasta, meat, or rice.", [I("ripe tomatoes", 2, "lb", "Produce"), I("onion", 0.25, "", "Produce"), I("garlic", 1, "clove", "Produce"), I("celery", 1, "stalk", "Produce"), I("olive oil", 3, "tbsp", "Pantry"), I("parsley", 2, "tbsp", "Produce")], ["Chop the onion, garlic, celery, and parsley very fine.", "Warm the oil. Cook the chopped aromatics 6 minutes, until soft, without browning.", "Add the chopped tomatoes. Simmer 25 minutes, stirring, until the sauce is thick.", "Salt. Rub through a sieve if you want it smooth, or leave it rustic.", "Spoon the sauce over pasta, over boiled meat, or thin it with a little water and cook in it."], gentile, { cal: 60, protein: 1, carbs: 6, fat: 4 }),
  h("vh-gt-balsamella", "Balsamella", "Italian", ["era-1910s", "book-gentile", "international", "italian", "sauce", "vegetarian"], "veg", "bowl", 12, "Gentile's balsamella: butter, flour, milk, stirred to a cream. Not French béchamel with onion.", [I("butter", 2, "tbsp", "Dairy & Eggs"), I("flour", 2, "tbsp", "Pantry"), I("milk", 2, "cups", "Dairy & Eggs"), I("salt", 0.25, "tsp", "Herbs & Spices")], ["Melt the butter in a saucepan over medium-low heat. Add the flour and cook 2 minutes, stirring, without browning.", "Pour in the milk little by little, stirring without stopping, until the sauce is as thick as cream.", "If it is too thick, add milk. If too thin, cook a minute more.", "Salt the sauce. Take the pan off the heat.", "Spoon it at once into baked pasta or vegetables, or use it as Gentile says, as the base of many dishes."], gentile, { cal: 90, protein: 3, carbs: 6, fat: 6 }),
  h("vh-gt-spaghetti-burro", "Pasta al burro e formaggio", "Italian", ["era-1910s", "book-gentile", "international", "italian", "vegetarian", "quick"], "veg", "pasta", 20, "The thickest spaghetti, butter, grated cheese. Gentile's simplest pasta.", [I("spaghetti or mezzani", 1, "lb", "Pantry"), I("butter", 6, "tbsp", "Dairy & Eggs"), I("parmesan", 3, "oz", "Dairy & Eggs"), I("salt", 1, "tbsp", "Herbs & Spices"), I("black pepper", 0.5, "tsp", "Herbs & Spices")], ["Bring a large pot of water to a boil. Salt it. Cook the pasta until just tender, 9–11 minutes.", "Drain the pasta, saving a cup of the pasta water.", "Return the pasta to the pot off the heat. Add the butter and most of the cheese, tossing until every strand is coated.", "If it looks dry, add a splash of pasta water. Pepper.", "Serve at once with the rest of the cheese at the table."], gentile, { cal: 520, protein: 18, carbs: 68, fat: 20 }),
  h("vh-gt-gnocchi", "Potato gnocchi", "Italian", ["era-1910s", "book-gentile", "international", "italian", "vegetarian"], "veg", "pasta", 50, "Riced potato, flour, a short boil. Gentile's gnocchi, sauced as you like.", [I("russet potatoes", 2, "lb", "Produce"), I("flour", 1.5, "cups", "Pantry"), I("egg", 1, "", "Dairy & Eggs"), I("salt", 1, "tsp", "Herbs & Spices"), I("butter", 3, "tbsp", "Dairy & Eggs"), I("parmesan", 2, "oz", "Dairy & Eggs")], ["Boil the potatoes in their skins until tender, 25 minutes. Drain, peel, and rice them while still hot. Spread to steam off moisture.", "When just warm, mix in the egg, salt, and enough flour to make a soft dough that does not stick. Do not knead long.", "Roll into ropes as thick as a finger. Cut ¾-inch pieces. Press each on a fork if you want ridges.", "Boil in salted water. They are done 30 seconds after they float, about 2 minutes.", "Lift into a dish with butter and cheese, or tomato sauce. Serve at once."], gentile, { cal: 340, protein: 10, carbs: 58, fat: 8 }),
  h("vh-gt-zucchine", "Zucchine fritte", "Italian", ["era-1910s", "book-gentile", "international", "italian", "vegetarian"], "veg", "skillet", 25, "Small squash, salted, floured, fried in oil. Gentile's zucchine.", [I("small zucchini", 1.5, "lb", "Produce"), I("flour", 0.5, "cup", "Pantry"), I("olive oil", 0.75, "cup", "Pantry"), I("salt", 1, "tsp", "Herbs & Spices")], ["Trim the zucchini and cut into sticks or coins. Salt them 10 minutes, then pat dry.", "Toss in flour. Shake in a sieve so only a thin coat remains.", "Heat ½ inch of oil until a bit of flour sizzles.", "Fry without crowding 3–4 minutes, until gold. Do not move them at first or they break.", "Drain the fried zucchini. Salt while hot. Serve at once."], gentile, { cal: 180, protein: 3, carbs: 12, fat: 14 }),
  h("vh-gt-panata", "Panata", "Italian", ["era-1910s", "book-gentile", "international", "italian", "soup", "budget", "vegetarian"], "eggs", "soup", 20, "Stale bread, egg, cheese, nutmeg, stirred into warm broth. Gentile's bread soup.", [I("stale bread crumbs", 1.5, "cups", "Bakery"), I("eggs", 2, "", "Dairy & Eggs"), I("parmesan", 0.5, "cup", "Dairy & Eggs"), I("beef or chicken broth", 6, "cups", "Pantry"), I("nutmeg", 1, "pinch", "Herbs & Spices"), I("salt", 0.5, "tsp", "Herbs & Spices")], ["Beat the 2 eggs with the 1½ cups of stale bread crumbs, the ½ cup of grated parmesan, the pinch of nutmeg and the ½ teaspoon of salt until you have a thick paste.", "Warm the 6 cups of beef or chicken broth until it is hot but not boiling.", "Stir the paste into the broth a spoonful at a time so it disperses instead of setting in one lump.", "Set it over low heat and stir gently 8–10 minutes, until the soup thickens. Do not let it boil hard or the egg will scramble into threads.", "Ladle into bowls, and add leftover vegetables if you have them, as Gentile allows."], gentile, { cal: 220, protein: 14, carbs: 20, fat: 10 }),
];
