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
  "americancookery12815gut",
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
  "italiancookbooka00gentiala",
  "Maria Gentile, The Italian Cook Book (Italian Book Co., 1919). Public domain via Project Gutenberg #24407.",
);
const foreign365 = src(
  "365 Foreign Dishes",
  "Anonymous",
  1908,
  "1900s",
  "365foreigndishes00phil",
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
  "cu31924003574187",
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
  "the-woman-suffrage-cook-book-compilation-accessible-version",
  "Mrs. Hattie A. Burr, The Woman Suffrage Cook Book (Boston, 1886), and typical Ladies' Aid church-supper dishes. Public domain.",
);
const hill = src(
  "Salads, Sandwiches and Chafing Dishes",
  "Janet McKenzie Hill",
  1909,
  "1900s",
  "saladssandwiches00hillrich",
  "Janet McKenzie Hill, Salads, Sandwiches and Chafing Dishes (1909). Public domain.",
);
const bosse = src(
  "Chinese-Japanese Cook Book",
  "Sara Bosse & Onoto Watanna",
  1914,
  "1910s",
  "chinesejapanesec00boss_1",
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
  "cu31924003580952",
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
  "365dessertsdesse00nels",
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
  source: Recipe["source"],
  nutrition: Recipe["nutrition"],
  /** Portions this makes. Left out, dish() stamps four, which is wrong for
   * a whole cake or a joint. */
  servings?: number,
  /** Other names the dish goes by, so renaming it to the book's title
   * does not hide it from search. */
  aliases?: string[],
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
      ...(servings ? { servings } : {}),
      ...(aliases && aliases.length ? { aliases } : {}),
  });
}

export const HERITAGE_RECIPES: Recipe[] = [
  // --- Virginia Housewife / Simmons (colonial) ---
  h("vh-va-beaten-biscuits", "Beaten biscuits", "Southern", ["era-1820s", "book-virginia", "baking", "vegetarian", "old-school"], "veg", "bowl", 50, "Mary Randolph's biscuits: dough beaten until it blisters, pricked, baked hot.", [I("flour", 4, "cups", "Pantry"), I("lard or butter", 0.5, "cup", "Dairy & Eggs"), I("salt", 1, "tsp", "Herbs & Spices"), I("cold water", 1, "cup", "Other")], ["Heat the oven to 400°F. Rub the lard into the flour and salt until the mix looks like coarse meal.", "Add cold water a little at a time until a very stiff dough forms. It should not be sticky.", "Beat the dough with a rolling pin or mallet 15–20 minutes, until the surface blisters. This is the whole method — do not add yeast.", "Roll ½ inch thick. Cut small rounds. Prick each biscuit all over with a fork.", "Bake 20–25 minutes, until pale gold and dry in the center. Serve split, with butter or ham."], undefined, { cal: 685, protein: 13, carbs: 95, fat: 27 }),
  h("vh-va-chicken-pudding", "Virginia chicken pudding", "Southern", ["era-1820s", "book-virginia-housewife", "old-school"], "chicken", "roast", 80, "Randolph's own title. The chicken is boiled nearly done with thyme and parsley, then laid in a thin egg batter and baked, with white gravy sent in a boat. The book makes it with four young chickens; this is a quarter of that.", [I("chicken", 1, "bird", "Meat & Seafood"), I("eggs", 3, "", "Dairy & Eggs"), I("milk", 1, "cup", "Dairy & Eggs"), I("butter", 3, "tbsp", "Dairy & Eggs"), I("flour", 1, "cup", "Pantry"), I("thyme", 3, "sprigs", "Herbs & Spices"), I("parsley", 3, "sprigs", "Produce"), I("salt", 1, "tsp", "Herbs & Spices")], ["Clean the chicken nicely and cut off the legs, wings and the rest at the joints.", "Put the pieces in a saucepan with some salt and water and a bundle of the 3 sprigs of thyme and the 3 sprigs of parsley. Boil them till nearly done, about 25 minutes.", "Beat the 3 eggs very light. Add the 1 cup of rich milk and 2 tablespoons of the butter, melted, with some pepper and the 1 teaspoon of salt.", "Stir in as much of the 1 cup of flour as will make a thin good batter — about three quarters of it.", "Heat the oven to 375°F. Take the chicken from the water and put it in the batter, then pour it into a deep dish.", "Bake it until the pudding is set and browned and the thickest joint reads 175°F, about 45 minutes.", "Send nice white gravy in a boat: melt the last tablespoon of butter, stir in the rest of the flour, and whisk in ½ cup of the water the chicken boiled in until it is smooth."], virginia, { cal: 715, protein: 71, carbs: 27, fat: 35 }, undefined, ["Chicken pudding, a favourite Virginia dish"]),
  h("vh-va-fried-catfish", "Randolph fried catfish", "Southern", ["era-1820s", "book-virginia", "old-school"], "fish", "fish", 25, "Catfish, cornmeal, hot lard. The Virginia Housewife fish fry.", [I("catfish fillets", 1.5, "lb", "Meat & Seafood"), I("cornmeal", 1, "cup", "Pantry"), I("lard or oil", 1, "cup", "Pantry"), I("salt", 1.5, "tsp", "Herbs & Spices"), I("black pepper", 0.5, "tsp", "Herbs & Spices"), I("lemon", 1, "", "Produce")], ["Pat the catfish dry. Salt and pepper both sides.", "Dredge each fillet in cornmeal, pressing so it sticks. Shake off the extra.", "Heat ½ inch of lard in a skillet until a pinch of meal sizzles at once, about 365°F.", "Fry 3–4 minutes a side, until the crust is deep gold and the fish flakes. Do not crowd the pan.", "Drain the fried fillets on paper. Serve hot with lemon wedges."], undefined, { cal: 450, protein: 40, carbs: 11, fat: 26 }),
  h("vh-am-indian-pudding", "Indian pudding", "American", ["era-1790s", "book-american-cookery", "dessert", "baking", "vegetarian", "gluten-free", "old-school"], "veg", "dessert", 170, "Simmons gives three. This is her No. 2: three pints of scalded milk to a pint of meal, salted and cooled before two eggs and four ounces of butter go in, and two and a half hours in the oven.", [I("milk", 6, "cups", "Dairy & Eggs"), I("cornmeal", 2, "cups", "Pantry"), I("eggs", 2, "", "Dairy & Eggs"), I("butter", 8, "tbsp", "Dairy & Eggs"), I("molasses", 0.5, "cup", "Pantry"), I("ginger", 1, "tsp", "Herbs & Spices"), I("nutmeg", 0.5, "tsp", "Herbs & Spices"), I("salt", 1, "tsp", "Herbs & Spices")], ["Scald the 6 cups of milk — three pints — and stir the 2 cups of Indian meal into it with the 1 teaspoon of salt.", "Let it stand until it is cool. Simmons is particular about the cooling in all three of her versions, and it is what keeps the eggs from scrambling.", "Heat the oven to 300°F and butter a baking dish with a little of the 8 tablespoons of butter.", "Add the 2 beaten eggs, the rest of the butter, the ½ cup of molasses, the 1 teaspoon of ginger and the ½ teaspoon of nutmeg.", "Pour it into the dish and bake two and a half hours, until the centre is just set and the top is dark.", "Serve it warm, with cream if you have it."], simmons, { cal: 440, protein: 11, carbs: 56, fat: 19 }, 8, ["A nice Indian pudding"]),
  h("vh-am-slapjacks", "Slapjacks", "American", ["era-1790s", "book-american-cookery", "breakfast", "vegetarian", "old-school"], "veg", "skillet", 25, "Simmons's slapjack is mostly Indian meal, not wheat: a quart of milk to a pint of cornmeal, four eggs and four spoons of flour, baked on a griddle or fried in a dry pan.", [I("milk", 4, "cups", "Dairy & Eggs"), I("cornmeal", 2, "cups", "Pantry"), I("eggs", 4, "", "Dairy & Eggs"), I("flour", 4, "tbsp", "Pantry"), I("lard or butter", 2, "tbsp", "Pantry"), I("salt", 0.5, "tsp", "Herbs & Spices")], ["Beat the 4 cups of milk, the 2 cups of Indian meal, the 4 eggs, the 4 tablespoons of flour and the ½ teaspoon of salt together into a batter.", "Heat a griddle and rub it with a little of the 2 tablespoons of lard or butter — or use a dry pan, which the book allows. The fat greases the pan between batches; it does not go into the batter.", "Pour the batter on in rounds and cook until bubbles open on top and the edges look dry, about 3 minutes.", "Turn them once and cook 2 minutes more, until gold on the second side.", "Serve them stacked, with molasses or butter."], simmons, { cal: 400, protein: 14, carbs: 54, fat: 14 }, 6, ["Indian slapjack", "flapjacks", "hoecakes"]),
  h("vh-va-hoe-cakes", "Hoe cakes", "Southern", ["era-1820s", "book-virginia", "breakfast", "vegetarian", "old-school"], "veg", "skillet", 20, "Cornmeal, water, salt, fried in a little fat. Bread when there is no oven.", [I("cornmeal", 2, "cups", "Pantry"), I("boiling water", 1.5, "cups", "Other"), I("salt", 1, "tsp", "Herbs & Spices"), I("bacon fat or lard", 3, "tbsp", "Pantry")], ["Stir the 1 teaspoon of salt into the 2 cups of cornmeal. Pour on the 1½ cups of boiling water and mix to a thick batter. Rest 5 minutes so the meal swells.", "Heat the 3 tablespoons of bacon fat or lard in a skillet over medium heat. The fat goes in the pan, not in the batter.", "Drop the batter in 3-inch cakes, flattening them slightly with the back of the spoon.", "Fry 3–4 minutes a side, until a brown crust forms and the middle is cooked through.", "Serve hot with the 2 tablespoons of butter or molasses."], undefined, { cal: 435, protein: 6, carbs: 63, fat: 17 }),
  h("vh-va-apple-tansey", "Apple tansey", "American", ["era-1820s", "book-virginia", "breakfast", "vegetarian"], "eggs", "skillet", 20, "Sliced apples fried, eggs poured over, a nutmeg custard in the pan.", [I("apples", 3, "", "Produce"), I("eggs", 4, "", "Dairy & Eggs"), I("butter", 2, "tbsp", "Dairy & Eggs"), I("sugar", 2, "tbsp", "Pantry"), I("nutmeg", 0.25, "tsp", "Herbs & Spices"), I("cream", 2, "tbsp", "Dairy & Eggs")], ["Peel, core, and slice the apples. Melt the butter in a skillet over medium heat.", "Fry the apples 6–8 minutes, until they soften and take a little color.", "Beat the eggs with cream, sugar, nutmeg, and a pinch of salt.", "Pour the eggs over the apples. Cook 4 minutes, tilting the pan, until the eggs are just set.", "Slide onto a plate. Serve hot, apples on top of the eggs."], undefined, { cal: 230, protein: 7, carbs: 26, fat: 12 }),
  h("vh-va-brunswick", "Virginia Brunswick stew", "Southern", ["era-1820s", "book-virginia", "old-school", "soup"], "chicken", "soup", 120, "Chicken, lima beans, corn, tomato — the Tidewater pot. Squirrel if you have it; chicken if you do not.", [I("chicken", 1, "bird", "Meat & Seafood"), I("lima beans", 2, "cups", "Produce"), I("corn kernels", 2, "cups", "Produce"), I("tomatoes", 4, "", "Produce"), I("onion", 1, "", "Produce"), I("potato", 2, "", "Produce")], ["Cover the chicken with water. Simmer 45 minutes. Lift it out, pull the meat, and return the meat to the broth. Discard the bones.", "Add the chopped onion, potato, lima beans, and tomatoes. Simmer 30 minutes.", "Add the corn. Cook 15 minutes more, until the stew is thick enough to stand a spoon.", "Salt and pepper. Some cooks mash a little of the potato to thicken further.", "Serve in bowls with bread. It is better the next day."], undefined, { cal: 800, protein: 78, carbs: 73, fat: 23 }),

  // --- White House 1887 ---
  h("vh-wh-oyster-stew", "White House oyster stew", "American", ["era-1880s", "book-white-house", "soup", "quick"], "seafood", "soup", 20, "Stewed oysters in milk: the liquor boiled up first, the oysters in until they ruffle, then boiling milk off the fire.", [I("oysters", 2, "quarts", "Meat & Seafood"), I("milk", 1, "pint", "Dairy & Eggs"), I("butter", 2, "tbsp", "Dairy & Eggs"), I("salt", 1, "tsp", "Herbs & Spices"), I("common crackers", 6, "", "Bakery")], ["Drain the liquor from the 2 quarts of oysters, mix with it a small teacupful of hot water, add a little salt and pepper, and set it over the fire in a saucepan.", "Let it boil up once, then put in the oysters and let them come to a boil.", "When they \"ruffle\" — the frill at the edge draws up, and that is the doneness sign — add the 2 tablespoonfuls of butter. If thickening is preferred, stir in a little flour or two tablespoonfuls of cracker crumbs at this point.", "The instant the butter is melted and well stirred in, put in the 1 pint of boiling milk and take the saucepan from the fire. Kept on the heat after the milk goes in, it curdles.", "Serve hot, with oyster or cream crackers."], whiteHouse, { cal: 555, protein: 40, carbs: 40, fat: 26 }),
  h("vh-wh-beef-a-la-mode", "Beef \u00e0 la mode", "American", ["era-1880s", "book-white-house", "old-school"], "beef", "roast", 210, "Ten pounds of round rubbed with six spices overnight, stuffed through the bone hole and through slits, bound in a circle.", [I("beef round", 10, "lb", "Meat & Seafood"), I("salt", 3, "tsp", "Herbs & Spices"), I("ground cloves", 2, "tsp", "Herbs & Spices"), I("cinnamon", 1, "tsp", "Herbs & Spices"), I("mace", 1, "tsp", "Herbs & Spices"), I("ground ginger", 1, "tsp", "Herbs & Spices"), I("bread crumbs", 1, "pint", "Bakery"), I("salt pork", 0.5, "lb", "Meat & Seafood"), I("sage", 2, "tsp", "Herbs & Spices"), I("thyme", 1, "tsp", "Herbs & Spices"), I("nutmeg", 1, "tsp", "Herbs & Spices"), I("onion", 1, "", "Produce"), I("flour", 0.25, "cup", "Pantry"), I("egg yolks", 2, "", "Dairy & Eggs")], ["Mix together three teaspoonfuls of salt, one of pepper, one of ginger, one of mace, one of cinnamon and two of cloves. Rub this mixture into the ten pounds of the upper part of a round of beef, and let it stand in this state over night.", "In the morning make a stuffing of the pint of fine bread crumbs, the half pound of fat salt pork cut in dice, a teaspoonful of ground thyme or summer savory, two teaspoonfuls of sage, half a teaspoonful of pepper, one of nutmeg, a little cloves and an onion minced fine, moistened with a little milk or water.", "Stuff this mixture into the place from whence you took out the bone. With a long skewer fasten the two ends of the beef together so that its form will be circular, and bind it around with tape to prevent the skewers giving way. Make incisions in the beef with a sharp knife, fill these incisions very closely with the stuffing, and dredge the whole with flour.", "Put it into a dripping-pan and pour over it a pint of hot water. Turn a large pan over it to keep in the steam, and roast slowly from three to four hours, allowing a quarter of an hour to each pound of meat, to an internal 145°F with a three-minute rest.", "If the meat is to be eaten hot, skim the fat off the gravy and, after it is taken off the fire, stir in the beaten yolks of two eggs. If onions are disliked you may omit them and substitute minced oysters."], whiteHouse, { cal: 555, protein: 51, carbs: 8, fat: 33 }, 24, ["beef a la mode", "pot roast"]),
  h("vh-wh-saratoga", "Saratoga potatoes", "American", ["era-1880s", "book-white-house", "vegetarian"], "veg", "skillet", 30, "Sliced into ice-water, shaken dry in a towel, dropped into very hot lard. Crisp, and nothing else added.", [I("potatoes", 6, "", "Produce"), I("lard", 4, "cups", "Pantry"), I("salt", 1, "tsp", "Herbs & Spices")], ["Peel good-sized potatoes and slice them as evenly as possible.", "Drop them into ice-water. The cold water washes the cut surfaces clean and lets the slices crisp rather than stick together.", "Have a kettle of very hot lard, as for cakes. Put a few at a time into a towel and shake, to dry the moisture out of them, and then drop them into the boiling lard. Wet potatoes in hot fat spit badly, which is why they are dried first.", "Stir them occasionally, and when of a light brown take them out with a skimmer.", "They will be crisp. Drain, salt, and serve."], whiteHouse, { cal: 440, protein: 5, carbs: 45, fat: 27 }),
  h("vh-wh-chicken-croquettes", "Chicken croquettes", "American", ["era-1880s", "book-white-house", "old-school"], "chicken", "skillet", 45, "A cup of cream thickened with a lump of butter the size of an egg, a pint of chopped chicken, fried like fish cakes.", [I("cream", 1, "cup", "Dairy & Eggs"), I("butter", 3, "tbsp", "Dairy & Eggs"), I("flour", 1, "tbsp", "Pantry"), I("salt", 1, "tsp", "Herbs & Spices"), I("onion", 1, "tbsp", "Produce"), I("bread crumbs", 1, "cup", "Bakery"), I("cooked chicken", 1, "pint", "Meat & Seafood"), I("eggs", 2, "", "Dairy & Eggs"), I("lard", 2, "cups", "Pantry")], ["Put the 1 cup of cream or milk in a saucepan, set it over the fire, and when it boils add a lump of butter as large as an egg in which has been mixed a tablespoonful of flour. The flour goes into the butter first, not into the pan — that is what keeps it from lumping.", "Let it boil up thick, remove from the fire, and when cool mix into it a teaspoonful of salt, half a teaspoonful of pepper, a bit of minced onion or parsley, the 1 cup of fine bread crumbs and the pint of finely-chopped cooked chicken.", "Lastly, beat up the 2 eggs and work them in with the whole.", "Flour your hands and make into small, round, flat cakes; dip in egg and bread crumbs and fry like fish cakes in butter and good sweet lard mixed, or in plenty of hot lard.", "Take them up with a skimmer and lay them on brown paper to free them from the grease. Serve hot."], whiteHouse, { cal: 790, protein: 41, carbs: 24, fat: 59 }),
  h("vh-wh-clam-chowder", "White House clam chowder", "American", ["era-1880s", "book-white-house", "soup"], "seafood", "soup", 40, "Fifty quahogs, their own liquor, and onions fried so delicately they go missing in the pot.", [I("clams", 50, "", "Meat & Seafood"), I("salt pork", 0.5, "lb", "Meat & Seafood"), I("onions", 3, "", "Produce"), I("potatoes", 6, "", "Produce"), I("common crackers", 1, "cup", "Bakery"), I("milk", 1, "quart", "Dairy & Eggs"), I("black pepper", 1, "tsp", "Herbs & Spices")], ["Wash the fifty round clams very thoroughly and put them in a pot with half a pint of water. When the shells are open they are done. Take them from the shells and chop fine, saving all the clam water for the chowder.", "Fry out the bowl of salt pork very gently, and when the scraps are a good brown take them out and put in the chopped onions to fry. Fry them in a frying pan, and have the chowder kettle very clean before they go in it, or the chowder will burn.", "The chief secret in chowder-making is to fry the onions so delicately that they will be missing in the chowder.", "Add a quart of hot water to the onions; put in the clams, the clam-water and the pork scraps. After it boils, add the potatoes, and when they are cooked the chowder is finished.", "Just before it is taken up, thicken it with a cup of powdered crackers and add the quart of fresh milk. If too rich, add more water. No seasoning is needed but good black pepper."], whiteHouse, { cal: 1040, protein: 33, carbs: 89, fat: 61 }),
  h("vh-wh-floating-island", "Floating island", "American", ["era-1880s", "book-white-house", "dessert", "vegetarian", "gluten-free", "old-school"], "eggs", "dessert", 40, "The White House custard: five yolks and one white cooked into a quart of scalded milk, chilled hard, and the four remaining whites beaten stiff with sugar and currant jelly and dipped over the top.", [I("milk", 4, "cups", "Dairy & Eggs"), I("eggs", 5, "", "Dairy & Eggs"), I("sugar", 8, "tbsp", "Pantry"), I("currant jelly", 2, "tbsp", "Pantry"), I("vanilla", 1, "tsp", "Pantry")], ["Scald the 4 cups of milk — one quart.", "Beat the yolks of the 5 eggs and one of the whites together with 5 tablespoons of the sugar. Stir a little of the scalded milk into them first to prevent curdling, then all of the milk.", "Cook it to the proper thickness — until it coats a spoon and reads 170°F — then take it from the fire. When cool, flavour it with the 1 teaspoon of vanilla.", "Pour it into a glass dish and let it become very cold.", "Before it is served, beat up the remaining four whites to a stiff froth and beat into them the last 3 tablespoons of sugar and the 2 tablespoons of currant jelly.", "Pour the froth over a shallow dish of boiling water so that the steam passing through it cooks it. This is the book's own direction in the companion recipe on the same page, and it is what keeps four raw whites off a cold custard.", "Dip the cooked froth over the top of the custard, far enough apart that the little white islands do not touch, and serve cold."], whiteHouse, { cal: 245, protein: 10, carbs: 29, fat: 9 }, 6),
  h("vh-wh-macaroni-cheese", "Baked macaroni and cheese", "American", ["era-1880s", "book-white-house", "vegetarian", "old-school", "comfort"], "veg", "pasta", 40, "Layered, not sauced: macaroni, grated cheese and bits of butter in turn, cracker crumbs on top, a teacup of milk poured over.", [I("macaroni", 0.5, "lb", "Pantry"), I("cheddar", 2, "cups", "Dairy & Eggs"), I("butter", 3, "tbsp", "Dairy & Eggs"), I("cracker crumbs", 0.75, "cup", "Pantry"), I("milk", 1, "cup", "Dairy & Eggs"), I("salt", 1, "tsp", "Herbs & Spices")], ["Break the half pound of macaroni into pieces an inch or two long. Cook it in boiling water, enough to cover it well, with a good teaspoonful of salt. Let it boil about twenty minutes.", "Drain it well, then put a layer in the bottom of a well-buttered pudding-dish.", "Upon this put some grated cheese and small pieces of butter and a bit of salt, then more macaroni, and so on, filling the dish. There is no white sauce in this one — the cheese, the butter and the milk make their own.", "Sprinkle the top layer with a thick layer of cracker crumbs, and pour over the whole a teacupful of cream or milk.", "Set it in the oven and bake half an hour. It should be nicely browned on top. Serve in the same dish in which it was baked."], whiteHouse, { cal: 630, protein: 26, carbs: 61, fat: 31 }),
  h("vh-wh-hash", "White House hash", "American", ["era-1880s", "book-white-house", "old-school", "budget"], "beef", "skillet", 25, "Twice as much cold boiled potato as beef, steamed under a lid until it will stand on the dish.", [I("cooked roast beef", 1, "cup", "Meat & Seafood"), I("cooked potatoes", 2, "cups", "Produce"), I("butter", 2, "tbsp", "Dairy & Eggs"), I("onion", 3, "slices", "Produce"), I("beef broth", 0.5, "cup", "Pantry"), I("salt", 1, "tsp", "Herbs & Spices")], ["Chop rather finely the cold roast beef or pieces of beefsteak, and also chop twice as much cold boiled potatoes. Two of potato to one of beef is the ratio, and it is what holds the hash together.", "Many like the flavor of onion; if so, fry two or three slices in the butter before adding the hash.", "Put over the fire a stewpan or frying pan, in which put a piece of butter as large as required to season it well, and add pepper and salt.", "Moisten with beef gravy if you have it, if not with hot water. Cover and let it steam and heat through thoroughly, stirring occasionally so that the ingredients are evenly distributed and the hash does not stick to the bottom of the pan.", "When done it should not be at all watery, nor yet dry, but have sufficient adhesiveness to stand well on a dish or on buttered toast."], whiteHouse, { cal: 200, protein: 11, carbs: 15, fat: 10 }),

  // --- Gentile 1919 ---
  h("vh-gt-brodo", "Brodo", "Italian", ["era-1910s", "book-gentile", "international", "italian", "soup"], "beef", "soup", 180, "Maria Gentile: beef and bones in cold water, brought slowly, greens in. The broth that starts the Italian kitchen.", [I("beef shank", 2, "lb", "Meat & Seafood"), I("beef bones", 1, "lb", "Meat & Seafood"), I("carrot", 1, "", "Produce"), I("celery", 2, "stalks", "Produce"), I("onion", 1, "", "Produce"), I("parsley", 4, "sprigs", "Produce"), I("salt", 1, "tsp", "Herbs & Spices")], ["Put the meat and bones in a pot with 3 quarts of cold water. Bring slowly to a simmer — never a hard boil. Gentile is firm that the meat starts in cold water.", "Skim the foam. Add the whole carrot, celery, onion, and the 4 sprigs of parsley, and 1 teaspoon salt.", "Simmer uncovered 2½ hours. Skim now and then. The surface should barely tremble.", "Lift out the meat and strain the broth through cloth. The meat is not wasted — Gentile sends it on to meatballs or croquettes.", "Cool and lift the cake of fat off the top, or serve it the same day. It keeps some days and is the base of a great many Italian dishes."], gentile, { cal: 615, protein: 69, carbs: 6, fat: 33 }),
  h("vh-gt-minestrone", "Minestrone alla Milanese", "Italian", ["era-1910s", "book-gentile", "international", "italian", "soup"], "pork", "soup", 165, "Salt pork beaten to a paste with parsley and garlic, then carrots, cabbage and rice — Gentile's Milanese minestrone, good hot or cold.", [I("salt pork", 0.5, "lb", "Meat & Seafood"), I("parsley", 3, "sprigs", "Produce"), I("celery", 1, "stalk", "Produce"), I("garlic", 1, "clove", "Produce"), I("carrot", 2, "", "Produce"), I("cabbage", 0.25, "head", "Produce"), I("butter", 2, "tbsp", "Dairy & Eggs"), I("rice", 1, "cup", "Pantry"), I("salt", 1, "tsp", "Herbs & Spices")], ["Cut the rind off the ½ pound of salt pork and put the piece whole into 2 quarts of water over a low flame.", "Cut a small slice off the pork and beat it to a paste with the 3 sprigs of parsley, the 1 stalk of celery and the 1 clove of garlic. Stir that paste into the pot. It is what carries the flavour through the soup, and it is the step the dish is built on.", "Slice the 2 carrots and cut the rib out of the leaves of the ¼ head of cabbage. Add them with the 2 tablespoons of butter and the 1 teaspoon of salt.", "Let it boil slowly 2 hours. In the last half hour stir in the 1 cup of rice — a small handful for each person.", "When the pork is very soft, lift it out, slice it into little ribbons, and put it back. Serve it hot. Gentile says the minestrone is equally good eaten the cold day after."], gentile, { cal: 670, protein: 7, carbs: 44, fat: 52 }),
  h("vh-gt-risotto", "Risotto alla Milanese", "Italian", ["era-1910s", "book-gentile", "international", "italian", "vegetarian"], "veg", "bowl", 35, "Onion browned in butter and taken out again, rice fed with hot broth, saffron if you like it. Gentile's risotto.", [I("arborio or short rice", 1.5, "cups", "Pantry"), I("onion", 1, "", "Produce"), I("butter", 4, "tbsp", "Dairy & Eggs"), I("beef or vegetable broth", 5, "cups", "Pantry"), I("saffron", 1, "pinch", "Herbs & Spices"), I("parmesan", 2, "oz", "Dairy & Eggs"), I("salt", 1, "tsp", "Herbs & Spices")], ["Keep the 5 cups of broth hot in a second pot. Melt 2 tablespoons of the butter and brown the thinly sliced onion in it, 6 minutes.", "Take the onion out of the pan and keep it aside. Gentile browns it for what it leaves behind in the pan, not to leave it in the rice.", "Add the 1½ cups of rice little by little, stirring with a wooden spoon. Every time the rice goes dry, add more hot broth, and keep on that way about 18 minutes, until the rice is cooked through.", "Salt and pepper it, and add the pinch of saffron if you like it — Gentile leaves that to you. When the rice is almost done, stir in a last ladle of broth for depth.", "Dress it with the 2 ounces of grated parmesan and the rest of the 4 tablespoons of butter. Mix well and serve hot. It must not be overcooked, and it must not be left to cool before it is eaten."], gentile, { cal: 800, protein: 56, carbs: 59, fat: 37 }),
  h("vh-gt-cacciatora", "Pollo alla cacciatora", "Italian", ["era-1910s", "book-gentile", "international", "italian"], "chicken", "skillet", 60, "Hunter's chicken floured and sautéed, with a pint of tomatoes and half a dozen sweet green peppers. Gentile's way with a tough bird.", [I("chicken", 1, "", "Meat & Seafood"), I("onion", 1, "", "Produce"), I("flour", 0.25, "cup", "Pantry"), I("tomatoes", 1, "pint", "Produce"), I("sweet green peppers", 6, "", "Produce"), I("olive oil", 3, "tbsp", "Pantry"), I("salt", 1, "tsp", "Herbs & Spices")], ["Chop the large onion and leave it in cold water more than half an hour, then dry it.", "Brown the onion by itself in a little of the 3 tablespoons of oil, and lift it out of the pan. It goes back in later.", "Cut the chicken up. Sprinkle the pieces with the ¼ cup of flour, the 1 teaspoon of salt and pepper, and sauté them in the fat left in the pan until they are brown. The flour is what thickens the gravy later.", "Add the 1 pint of tomatoes and the 6 sweet green peppers, and put the onion back. When the gravy is thick enough, add hot water so the vegetables do not burn.", "Cover the pan tightly and simmer until the chicken is very tender and the thickest joint reads 175°F. Gentile gives this as the way to cook a tough bird, and says a young one will taste finer still."], gentile, { cal: 645, protein: 66, carbs: 26, fat: 32 }),
  h("vh-gt-pomodoro", "Salsa di pomodoro", "Italian", ["era-1910s", "book-gentile", "international", "italian", "sauce", "vegetarian", "vegan"], "veg", "bowl", 40, "Onion, garlic, celery, bay and parsley chopped fine, tomatoes cut in, everything on the fire at once. Gentile's tomato sauce.", [I("tomatoes", 8, "", "Produce"), I("onion", 0.25, "", "Produce"), I("garlic", 1, "clove", "Produce"), I("celery", 1, "stalk", "Produce"), I("bay leaves", 3, "", "Herbs & Spices"), I("parsley", 2, "tbsp", "Produce"), I("olive oil", 3, "tbsp", "Pantry"), I("salt", 1, "tsp", "Herbs & Spices")], ["Chop fine together the ¼ onion, the 1 clove of garlic, the 1 stalk of celery as long as your finger, the 3 bay leaves and just enough of the 2 tablespoons of parsley.", "Season them with the 3 tablespoons of oil, the 1 teaspoon of salt and a little pepper.", "Cut up the 8 tomatoes and put everything over the fire together. Gentile starts it all at once — there is no softening of the aromatics first.", "Stir it from time to time until the juice condenses into a thin custard, about 25 minutes.", "Strain it through a sieve and it is ready for use. Thinned with water it is an ingredient in a great many Italian recipes."], gentile, { cal: 155, protein: 3, carbs: 14, fat: 11 }),
  h("vh-gt-balsamella", "Balsamella", "Italian", ["era-1910s", "book-gentile", "international", "italian", "sauce", "vegetarian"], "veg", "bowl", 12, "Gentile's simpler cousin to béchamel — and she browns the flour, which the French sauce never does.", [I("flour", 1, "tbsp", "Pantry"), I("butter", 4, "tbsp", "Dairy & Eggs"), I("milk", 2, "cups", "Dairy & Eggs"), I("salt", 0.25, "tsp", "Herbs & Spices")], ["Put the 1 tablespoon of flour and the 4 tablespoons of butter — a piece as big as an egg — into a saucepan together and hold them over the fire.", "Stir them together and keep stirring until the flour begins to brown. This is where balsamella parts company with a French béchamel, which is never allowed to colour.", "Pour in the 2 cups of milk, stirring without stopping with a wooden spoon, until the liquid condenses like a cream.", "If it is too thick, loosen it. If it is too thin, put it back on the fire with a little more butter rolled in the 1 tablespoon of flour.", "Salt it and take it off the heat. A good balsamella and a well made brown stock are, as Gentile has it, the base and the principal secret of many savoury dishes."], gentile, { cal: 185, protein: 4, carbs: 7, fat: 16 }),
  h("vh-gt-spaghetti-burro", "Pasta al burro e formaggio", "Italian", ["era-1910s", "book-gentile", "international", "italian", "vegetarian", "quick"], "veg", "pasta", 25, "The simplest way to serve spaghetti: boiled soft, a generous quantity of butter, and grated cheese. Gentile prefers mezzani for it.", [I("spaghetti or mezzani", 1, "lb", "Pantry"), I("butter", 6, "tbsp", "Dairy & Eggs"), I("parmesan", 3, "oz", "Dairy & Eggs"), I("salt", 1, "tbsp", "Herbs & Spices")], ["Bring a large pot of salted water to a rolling boil. The pasta does not go in until the water is at the boil.", "Take as much of the 1 pound of pasta as will half fill the dish you mean to serve it in. Italians leave it unbroken; break it into three-inch lengths if turning it round a fork is not your gift.", "Boil it 12–15 minutes, until it is perfectly soft but has not lost its form, stirring often so it does not stick to the bottom.", "Turn it into a colander to drain, then into a warm dish with the 6 tablespoons of butter and most of the 3 ounces of grated cheese.", "Bring the rest of the cheese to the table so people can help themselves to it."], gentile, { cal: 655, protein: 23, carbs: 86, fat: 24 }),
  h("vh-gt-gnocchi", "Gnocchi", "Italian", ["era-1910s", "book-gentile", "international", "italian", "soup"], "chicken", "soup", 60, "Not the plain potato dumpling: Gentile's gnocchi carry ground chicken or turkey breast, cheese, yolks and nutmeg, and go into broth.", [I("russet potatoes", 2, "lb", "Produce"), I("cooked chicken or turkey breast", 8, "oz", "Meat & Seafood"), I("parmesan", 2, "oz", "Dairy & Eggs"), I("egg yolks", 2, "", "Dairy & Eggs"), I("nutmeg", 1, "pinch", "Herbs & Spices"), I("salt", 1, "tsp", "Herbs & Spices"), I("flour", 1.5, "cups", "Pantry"), I("broth", 6, "cups", "Pantry")], ["Boil the 2 pounds of mealy potatoes until tender, 25 minutes. Peel them while they are hot and mash them smooth.", "Grind the 8 ounces of cooked chicken or turkey breast fine and mix it through the potato with the 2 ounces of grated parmesan, the 2 egg yolks, the 1 teaspoon of salt and a very little nutmeg. If you are cooking the breast for this rather than using a roast leftover, take it to 165°F first.", "Turn the mixture out on a floured board with as much of the 1½ cups of flour as it takes to make a paste, and roll that into little sticks as thick as your small finger.", "Cut the sticks into pieces about half an inch long.", "Drop them into the 6 cups of boiling broth. Five or six minutes is all the cooking they need. Serve them in the broth. Gentile calls it an excellent soup, and worth making when there is roast breast to hand."], gentile, { cal: 560, protein: 35, carbs: 76, fat: 13 }),
  h("vh-gt-zucchine", "Zucchine fritte", "Italian", ["era-1910s", "book-gentile", "international", "italian", "vegetarian"], "veg", "skillet", 90, "Small squashes cut in strips, salted an hour or two, floured damp and fried. Gentile is clear that you do not dry them.", [I("small zucchini", 1.5, "lb", "Produce"), I("flour", 0.5, "cup", "Pantry"), I("olive oil", 0.75, "cup", "Pantry"), I("salt", 1, "tsp", "Herbs & Spices")], ["Choose the squashes that are long and thin. Wash them and cut them into little strips less than half an inch thick.", "Take away the softer part of the interior and salt them moderately.", "Leave them aside an hour or two, then drain them — but do not dry them. The damp is what makes it cling.", "Put them in the ½ cup of flour and rub them gently in a sieve so that only a thin coat stays on. Stir in the 1½ pounds of small zucchini.", "Straight after that, into a pan where the oil is already hot. Do not touch them at first or they break; once they have hardened a little, stir them, and take them out as they begin to brown."], gentile, { cal: 445, protein: 4, carbs: 17, fat: 42 }),
  h("vh-gt-panata", "Panata", "Italian", ["era-1910s", "book-gentile", "international", "italian", "soup", "budget", "vegetarian"], "eggs", "soup", 20, "Stale bread, egg, cheese, nutmeg, stirred into warm broth. Gentile's bread soup.", [I("stale bread crumbs", 1.5, "cups", "Bakery"), I("eggs", 2, "", "Dairy & Eggs"), I("parmesan", 0.5, "cup", "Dairy & Eggs"), I("beef or chicken broth", 6, "cups", "Pantry"), I("nutmeg", 1, "pinch", "Herbs & Spices"), I("salt", 0.5, "tsp", "Herbs & Spices")], ["Beat the 2 eggs with the 1½ cups of stale bread crumbs, the ½ cup of grated parmesan, the pinch of nutmeg and the ½ teaspoon of salt until you have a thick paste.", "Warm the 6 cups of beef or chicken broth until it is hot but not boiling.", "Stir the paste into the broth a spoonful at a time so it disperses instead of setting in one lump.", "Set it over low heat and stir gently 8–10 minutes, until the soup thickens. Do not let it boil hard or the egg will scramble into threads.", "Ladle into bowls, and add leftover vegetables if you have them, as Gentile allows."], gentile, { cal: 690, protein: 67, carbs: 30, fat: 33 }),
];
