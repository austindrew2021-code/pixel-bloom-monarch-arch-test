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
  h("vh-va-chicken-pudding", "Virginia chicken pudding", "Southern", ["era-1820s", "book-virginia", "old-school"], "chicken", "roast", 70, "Jointed chicken in a batter pudding, baked until the custard sets around the bird.", [I("chicken", 1, "bird", "Meat & Seafood"), I("flour", 1, "cup", "Pantry"), I("milk", 2, "cups", "Dairy & Eggs"), I("eggs", 3, "", "Dairy & Eggs"), I("butter", 2, "tbsp", "Dairy & Eggs"), I("salt", 1, "tsp", "Herbs & Spices")], ["Joint the chicken. Salt it. Brown the pieces in butter 8 minutes, until the skin is gold.", "Heat the oven to 375°F. Lay the chicken in a buttered baking dish.", "Beat the eggs, milk, flour, and salt into a smooth batter, no lumps.", "Pour the batter over the chicken. It should come about halfway up the pieces.", "Bake 45 minutes, until the pudding is puffed and set and the chicken reads 175°F at the thickest joint. Serve from the dish."], virginia, { cal: 480, protein: 38, carbs: 22, fat: 26 }),
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
  h("vh-gt-brodo", "Brodo", "Italian", ["era-1910s", "book-gentile", "international", "italian", "soup"], "beef", "soup", 180, "Maria Gentile: beef and bones in cold water, brought slowly, greens in. The broth that starts the Italian kitchen.", [I("beef shank", 2, "lb", "Meat & Seafood"), I("beef bones", 1, "lb", "Meat & Seafood"), I("carrot", 1, "", "Produce"), I("celery", 2, "stalks", "Produce"), I("onion", 1, "", "Produce"), I("parsley", 4, "sprigs", "Produce"), I("salt", 1, "tsp", "Herbs & Spices")], ["Put the meat and bones in a pot with 3 quarts of cold water. Bring slowly to a simmer — never a hard boil. Gentile is firm that the meat starts in cold water.", "Skim the foam. Add the whole carrot, celery, onion, and the 4 sprigs of parsley, and 1 teaspoon salt.", "Simmer uncovered 2½ hours. Skim now and then. The surface should barely tremble.", "Lift out the meat and strain the broth through cloth. The meat is not wasted — Gentile sends it on to meatballs or croquettes.", "Cool and lift the cake of fat off the top, or serve it the same day. It keeps some days and is the base of a great many Italian dishes."], gentile, { cal: 80, protein: 10, carbs: 2, fat: 3 }),
  h("vh-gt-minestrone", "Minestrone alla Milanese", "Italian", ["era-1910s", "book-gentile", "international", "italian", "soup"], "pork", "soup", 165, "Salt pork beaten to a paste with parsley and garlic, then carrots, cabbage and rice — Gentile's Milanese minestrone, good hot or cold.", [I("salt pork", 0.5, "lb", "Meat & Seafood"), I("parsley", 3, "sprigs", "Produce"), I("celery", 1, "stalk", "Produce"), I("garlic", 1, "clove", "Produce"), I("carrot", 2, "", "Produce"), I("cabbage", 0.25, "head", "Produce"), I("butter", 2, "tbsp", "Dairy & Eggs"), I("rice", 1, "cup", "Pantry"), I("salt", 1, "tsp", "Herbs & Spices")], ["Cut the rind off the ½ pound of salt pork and put the piece whole into 2 quarts of water over a low flame.", "Cut a small slice off the pork and beat it to a paste with the 3 sprigs of parsley, the 1 stalk of celery and the 1 clove of garlic. Stir that paste into the pot. It is what carries the flavour through the soup, and it is the step the dish is built on.", "Slice the 2 carrots and cut the rib out of the leaves of the ¼ head of cabbage. Add them with the 2 tablespoons of butter and the 1 teaspoon of salt.", "Let it boil slowly 2 hours. In the last half hour stir in the 1 cup of rice — a small handful for each person.", "When the pork is very soft, lift it out, slice it into little ribbons, and put it back. Serve it hot. Gentile says the minestrone is equally good eaten the cold day after."], gentile, { cal: 340, protein: 11, carbs: 34, fat: 18 }),
  h("vh-gt-risotto", "Risotto alla Milanese", "Italian", ["era-1910s", "book-gentile", "international", "italian", "vegetarian"], "veg", "bowl", 35, "Onion browned in butter and taken out again, rice fed with hot broth, saffron if you like it. Gentile's risotto.", [I("arborio or short rice", 1.5, "cups", "Pantry"), I("onion", 1, "", "Produce"), I("butter", 4, "tbsp", "Dairy & Eggs"), I("beef or vegetable broth", 5, "cups", "Pantry"), I("saffron", 1, "pinch", "Herbs & Spices"), I("parmesan", 2, "oz", "Dairy & Eggs"), I("salt", 1, "tsp", "Herbs & Spices")], ["Keep the 5 cups of broth hot in a second pot. Melt 2 tablespoons of the butter and brown the thinly sliced onion in it, 6 minutes.", "Take the onion out of the pan and keep it aside. Gentile browns it for what it leaves behind in the pan, not to leave it in the rice.", "Add the 1½ cups of rice little by little, stirring with a wooden spoon. Every time the rice goes dry, add more hot broth, and keep on that way about 18 minutes, until the rice is cooked through.", "Salt and pepper it, and add the pinch of saffron if you like it — Gentile leaves that to you. When the rice is almost done, stir in a last ladle of broth for depth.", "Dress it with the 2 ounces of grated parmesan and the rest of the 4 tablespoons of butter. Mix well and serve hot. It must not be overcooked, and it must not be left to cool before it is eaten."], gentile, { cal: 430, protein: 12, carbs: 62, fat: 15 }),
  h("vh-gt-cacciatora", "Pollo alla cacciatora", "Italian", ["era-1910s", "book-gentile", "international", "italian"], "chicken", "skillet", 60, "Hunter's chicken floured and sautéed, with a pint of tomatoes and half a dozen sweet green peppers. Gentile's way with a tough bird.", [I("chicken", 1, "", "Meat & Seafood"), I("onion", 1, "", "Produce"), I("flour", 0.25, "cup", "Pantry"), I("tomatoes", 1, "pint", "Produce"), I("sweet green peppers", 6, "", "Produce"), I("olive oil", 3, "tbsp", "Pantry"), I("salt", 1, "tsp", "Herbs & Spices")], ["Chop the large onion and leave it in cold water more than half an hour, then dry it.", "Brown the onion by itself in a little of the 3 tablespoons of oil, and lift it out of the pan. It goes back in later.", "Cut the chicken up. Sprinkle the pieces with the ¼ cup of flour, the 1 teaspoon of salt and pepper, and sauté them in the fat left in the pan until they are brown. The flour is what thickens the gravy later.", "Add the 1 pint of tomatoes and the 6 sweet green peppers, and put the onion back. When the gravy is thick enough, add hot water so the vegetables do not burn.", "Cover the pan tightly and simmer until the chicken is very tender and the thickest joint reads 175°F. Gentile gives this as the way to cook a tough bird, and says a young one will taste finer still."], gentile, { cal: 480, protein: 38, carbs: 16, fat: 28 }),
  h("vh-gt-pomodoro", "Salsa di pomodoro", "Italian", ["era-1910s", "book-gentile", "international", "italian", "sauce", "vegetarian", "vegan"], "veg", "bowl", 40, "Onion, garlic, celery, bay and parsley chopped fine, tomatoes cut in, everything on the fire at once. Gentile's tomato sauce.", [I("tomatoes", 8, "", "Produce"), I("onion", 0.25, "", "Produce"), I("garlic", 1, "clove", "Produce"), I("celery", 1, "stalk", "Produce"), I("bay leaves", 3, "", "Herbs & Spices"), I("parsley", 2, "tbsp", "Produce"), I("olive oil", 3, "tbsp", "Pantry"), I("salt", 1, "tsp", "Herbs & Spices")], ["Chop fine together the ¼ onion, the 1 clove of garlic, the 1 stalk of celery as long as your finger, the 3 bay leaves and just enough of the 2 tablespoons of parsley.", "Season them with the 3 tablespoons of oil, the 1 teaspoon of salt and a little pepper.", "Cut up the 8 tomatoes and put everything over the fire together. Gentile starts it all at once — there is no softening of the aromatics first.", "Stir it from time to time until the juice condenses into a thin custard, about 25 minutes.", "Strain it through a sieve and it is ready for use. Thinned with water it is an ingredient in a great many Italian recipes."], gentile, { cal: 110, protein: 2, carbs: 11, fat: 7 }),
  h("vh-gt-balsamella", "Balsamella", "Italian", ["era-1910s", "book-gentile", "international", "italian", "sauce", "vegetarian"], "veg", "bowl", 12, "Gentile's simpler cousin to béchamel — and she browns the flour, which the French sauce never does.", [I("flour", 1, "tbsp", "Pantry"), I("butter", 4, "tbsp", "Dairy & Eggs"), I("milk", 2, "cups", "Dairy & Eggs"), I("salt", 0.25, "tsp", "Herbs & Spices")], ["Put the 1 tablespoon of flour and the 4 tablespoons of butter — a piece as big as an egg — into a saucepan together and hold them over the fire.", "Stir them together and keep stirring until the flour begins to brown. This is where balsamella parts company with a French béchamel, which is never allowed to colour.", "Pour in the 2 cups of milk, stirring without stopping with a wooden spoon, until the liquid condenses like a cream.", "If it is too thick, loosen it. If it is too thin, put it back on the fire with a little more butter rolled in the 1 tablespoon of flour.", "Salt it and take it off the heat. A good balsamella and a well made brown stock are, as Gentile has it, the base and the principal secret of many savoury dishes."], gentile, { cal: 190, protein: 5, carbs: 8, fat: 15 }),
  h("vh-gt-spaghetti-burro", "Pasta al burro e formaggio", "Italian", ["era-1910s", "book-gentile", "international", "italian", "vegetarian", "quick"], "veg", "pasta", 25, "The simplest way to serve spaghetti: boiled soft, a generous quantity of butter, and grated cheese. Gentile prefers mezzani for it.", [I("spaghetti or mezzani", 1, "lb", "Pantry"), I("butter", 6, "tbsp", "Dairy & Eggs"), I("parmesan", 3, "oz", "Dairy & Eggs"), I("salt", 1, "tbsp", "Herbs & Spices")], ["Bring a large pot of salted water to a rolling boil. The pasta does not go in until the water is at the boil.", "Take as much of the 1 pound of pasta as will half fill the dish you mean to serve it in. Italians leave it unbroken; break it into three-inch lengths if turning it round a fork is not your gift.", "Boil it 12–15 minutes, until it is perfectly soft but has not lost its form, stirring often so it does not stick to the bottom.", "Turn it into a colander to drain, then into a warm dish with the 6 tablespoons of butter and most of the 3 ounces of grated cheese.", "Bring the rest of the cheese to the table so people can help themselves to it."], gentile, { cal: 560, protein: 18, carbs: 86, fat: 17 }),
  h("vh-gt-gnocchi", "Gnocchi", "Italian", ["era-1910s", "book-gentile", "international", "italian", "soup"], "chicken", "soup", 60, "Not the plain potato dumpling: Gentile's gnocchi carry ground chicken or turkey breast, cheese, yolks and nutmeg, and go into broth.", [I("russet potatoes", 2, "lb", "Produce"), I("cooked chicken or turkey breast", 8, "oz", "Meat & Seafood"), I("parmesan", 2, "oz", "Dairy & Eggs"), I("egg yolks", 2, "", "Dairy & Eggs"), I("nutmeg", 1, "pinch", "Herbs & Spices"), I("salt", 1, "tsp", "Herbs & Spices"), I("flour", 1.5, "cups", "Pantry"), I("broth", 6, "cups", "Pantry")], ["Boil the 2 pounds of mealy potatoes until tender, 25 minutes. Peel them while they are hot and mash them smooth.", "Grind the 8 ounces of cooked chicken or turkey breast fine and mix it through the potato with the 2 ounces of grated parmesan, the 2 egg yolks, the 1 teaspoon of salt and a very little nutmeg. If you are cooking the breast for this rather than using a roast leftover, take it to 165°F first.", "Turn the mixture out on a floured board with as much of the 1½ cups of flour as it takes to make a paste, and roll that into little sticks as thick as your small finger.", "Cut the sticks into pieces about half an inch long.", "Drop them into the 6 cups of boiling broth. Five or six minutes is all the cooking they need. Serve them in the broth. Gentile calls it an excellent soup, and worth making when there is roast breast to hand."], gentile, { cal: 470, protein: 26, carbs: 62, fat: 12 }),
  h("vh-gt-zucchine", "Zucchine fritte", "Italian", ["era-1910s", "book-gentile", "international", "italian", "vegetarian"], "veg", "skillet", 90, "Small squashes cut in strips, salted an hour or two, floured damp and fried. Gentile is clear that you do not dry them.", [I("small zucchini", 1.5, "lb", "Produce"), I("flour", 0.5, "cup", "Pantry"), I("olive oil", 0.75, "cup", "Pantry"), I("salt", 1, "tsp", "Herbs & Spices")], ["Choose the squashes that are long and thin. Wash them and cut them into little strips less than half an inch thick.", "Take away the softer part of the interior and salt them moderately.", "Leave them aside an hour or two, then drain them — but do not dry them. The damp is what makes it cling.", "Put them in the ½ cup of flour and rub them gently in a sieve so that only a thin coat stays on. Stir in the 1½ pounds of small zucchini.", "Straight after that, into a pan where the oil is already hot. Do not touch them at first or they break; once they have hardened a little, stir them, and take them out as they begin to brown."], gentile, { cal: 260, protein: 4, carbs: 18, fat: 20 }),
  h("vh-gt-panata", "Panata", "Italian", ["era-1910s", "book-gentile", "international", "italian", "soup", "budget", "vegetarian"], "eggs", "soup", 20, "Stale bread, egg, cheese, nutmeg, stirred into warm broth. Gentile's bread soup.", [I("stale bread crumbs", 1.5, "cups", "Bakery"), I("eggs", 2, "", "Dairy & Eggs"), I("parmesan", 0.5, "cup", "Dairy & Eggs"), I("beef or chicken broth", 6, "cups", "Pantry"), I("nutmeg", 1, "pinch", "Herbs & Spices"), I("salt", 0.5, "tsp", "Herbs & Spices")], ["Beat the 2 eggs with the 1½ cups of stale bread crumbs, the ½ cup of grated parmesan, the pinch of nutmeg and the ½ teaspoon of salt until you have a thick paste.", "Warm the 6 cups of beef or chicken broth until it is hot but not boiling.", "Stir the paste into the broth a spoonful at a time so it disperses instead of setting in one lump.", "Set it over low heat and stir gently 8–10 minutes, until the soup thickens. Do not let it boil hard or the egg will scramble into threads.", "Ladle into bowls, and add leftover vegetables if you have them, as Gentile allows."], gentile, { cal: 220, protein: 14, carbs: 20, fat: 10 }),
];
