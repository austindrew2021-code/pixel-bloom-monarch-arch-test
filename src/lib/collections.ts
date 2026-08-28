import {
  isBreakfast,
  isDairyFree,
  isDessert,
  isGlutenFree,
  isHighProtein,
  isKeto,
  isSauceLike,
  isSugarFree,
  isVegan,
  isVegetarian,
} from "./diet";
import type { Recipe } from "./types";

export type Collection = {
  id: string;
  label: string;
  hint: string;
  match: (recipe: Recipe) => boolean;
};

function has(recipe: Recipe, ...needles: string[]): boolean {
  const tags = (recipe.tags ?? []).map((t) => t.toLowerCase());
  const cuisine = (recipe.cuisine ?? "").toLowerCase();
  const name = recipe.name.toLowerCase();
  return needles.some((n) => tags.includes(n) || cuisine === n || name.includes(n));
}

export const COLLECTIONS: Collection[] = [
  {
    id: "vegetarian",
    label: "Vegetarian",
    hint: "No meat or fish",
    match: (r) => isVegetarian(r),
  },
  {
    id: "vegan",
    label: "Vegan",
    hint: "No animal products",
    match: (r) => isVegan(r),
  },
  {
    id: "gluten-free",
    label: "Gluten-free",
    hint: "No wheat, still dinner",
    match: (r) => isGlutenFree(r),
  },
  {
    id: "dairy-free",
    label: "Dairy-free",
    hint: "No milk, butter, cheese",
    match: (r) => isDairyFree(r),
  },
  {
    id: "sugar-free",
    label: "Sugar-free",
    hint: "No added sugar",
    match: (r) => isSugarFree(r),
  },
  {
    id: "plant-based",
    label: "Plant-based",
    hint: "Vegan plates that satisfy",
    match: (r) => isVegan(r) || has(r, "plant-based", "vegan"),
  },
  {
    id: "instant-pot",
    label: "Instant Pot",
    hint: "Pressure-cooker weeknights",
    match: (r) => has(r, "instant-pot", "pressure-cooker"),
  },
  {
    id: "slow-cooker",
    label: "Slow cooker",
    hint: "Set it, walk away",
    match: (r) => has(r, "slow-cooker", "crockpot"),
  },
  {
    id: "sheet-pan",
    label: "Sheet pan",
    hint: "One tray, hot oven",
    match: (r) => has(r, "sheet-pan"),
  },
  {
    id: "air-fryer",
    label: "Air fryer",
    hint: "Crisp without a vat",
    match: (r) => has(r, "air-fryer"),
  },
  {
    id: "one-pot",
    label: "One pot",
    hint: "One pan, less washing",
    match: (r) => has(r, "one-pot"),
  },
  {
    id: "grill",
    label: "Grill & BBQ",
    hint: "Ribs, elote, smoked",
    match: (r) => has(r, "grill", "bbq", "barbecue"),
  },
  {
    id: "baking",
    label: "Baking",
    hint: "Bread, cookies, cobbler",
    match: (r) => has(r, "baking") && !has(r, "cheesecake"),
  },
  {
    id: "cookies",
    label: "Cookies & candy",
    hint: "Chips, fudge, shortbread",
    match: (r) => has(r, "cookies") || /\b(cookie|fudge|shortbread|biscotti)\b/.test(r.name.toLowerCase()),
  },
  {
    id: "breakfast",
    label: "Breakfast",
    hint: "Oats to omelettes",
    match: (r) => isBreakfast(r),
  },
  {
    id: "salads",
    label: "Salads",
    hint: "Cobb to three-bean",
    match: (r) => has(r, "salad") || r.plate === "green",
  },
  {
    id: "desserts",
    label: "Desserts",
    hint: "Cake, pudding, cobbler",
    match: (r) => isDessert(r),
  },
  {
    id: "sauces",
    label: "Sauces",
    hint: "Gravy, rubs, dressing",
    match: (r) => isSauceLike(r),
  },
  {
    id: "fish",
    label: "Fish & seafood",
    hint: "Salmon, shrimp, trout",
    match: (r) => r.protein === "fish" || r.protein === "seafood" || has(r, "pescatarian"),
  },
  {
    id: "southern",
    label: "Southern",
    hint: "Burgoo, pot likker, pie",
    match: (r) => has(r, "southern") || (r.cuisine ?? "").includes("Southern"),
  },
  {
    id: "japanese",
    label: "Japanese",
    hint: "Miso, donburi, katsu",
    match: (r) => has(r, "japanese") || (r.cuisine ?? "") === "Japanese",
  },
  {
    id: "international",
    label: "International",
    hint: "Tables from everywhere",
    match: (r) => has(r, "international", "world") || (r.tags ?? []).includes("world"),
  },
  {
    id: "hometown",
    label: "Hometown",
    hint: "Church basement classics",
    match: (r) => has(r, "hometown", "community", "old-school"),
  },
  {
    id: "holiday",
    label: "Holiday",
    hint: "Christmas table, cocoa, ham",
    match: (r) => has(r, "holiday", "christmas"),
  },
  {
    id: "wild-game",
    label: "Wild game",
    hint: "Venison, duck, trout",
    match: (r) => has(r, "wild-game", "game"),
  },
  {
    id: "cheesecake",
    label: "Cheesecake",
    hint: "New York to Basque",
    match: (r) => has(r, "cheesecake") || r.name.toLowerCase().includes("cheesecake"),
  },
  {
    id: "pumpkin",
    label: "Pumpkin",
    hint: "Soup, bread, seeds",
    match: (r) => has(r, "pumpkin") || r.name.toLowerCase().includes("pumpkin"),
  },
  {
    id: "apple",
    label: "Apple",
    hint: "Orchard pies and chops",
    match: (r) => has(r, "apple") || /\bapple/.test(r.name.toLowerCase()),
  },
  {
    id: "camping",
    label: "Camping",
    hint: "Foil packs, dutch oven",
    match: (r) => has(r, "camping"),
  },
  {
    id: "kid-friendly",
    label: "Kid-friendly",
    hint: "Nuggets, noodles, muffins",
    match: (r) => has(r, "kid-friendly"),
  },
  {
    id: "meal-prep",
    label: "Meal prep",
    hint: "Boxes for the week",
    match: (r) => has(r, "meal-prep", "batch"),
  },
  {
    id: "vintage",
    label: "Vintage kitchen",
    hint: "From the old books",
    match: (r) => has(r, "vintage"),
  },
  {
    id: "colonial",
    label: "1790s–1830s",
    hint: "Simmons, Randolph, Leslie",
    match: (r) => has(r, "era-1790s", "era-1820s", "era-1830s"),
  },
  {
    id: "gilded",
    label: "1880s–1890s",
    hint: "White House, Mrs. Fisher",
    match: (r) => has(r, "era-1880s", "era-1890s"),
  },
  {
    id: "1900s",
    label: "1900s",
    hint: "Foreign dishes, salads, fish",
    match: (r) => has(r, "era-1900s"),
  },
  {
    id: "1910s",
    label: "1910s",
    hint: "Farmer, Gentile, wartime",
    match: (r) => has(r, "era-1910s"),
  },
  {
    id: "1920s",
    label: "1920s",
    hint: "Luncheon, Dutch kitchen",
    match: (r) => has(r, "era-1920s"),
  },
  {
    id: "1930s",
    label: "1930s",
    hint: "Southern Cook Book, 1935",
    match: (r) => has(r, "era-1930s"),
  },
  {
    id: "1940s",
    label: "1940s",
    hint: "USDA wartime leaflets",
    match: (r) => has(r, "era-1940s"),
  },
  {
    id: "wartime",
    label: "Wartime kitchen",
    hint: "1918 & 1940s government",
    match: (r) => has(r, "wartime"),
  },
  {
    id: "book-farmer",
    label: "Fannie Farmer",
    hint: "Boston Cooking-School, 1918",
    match: (r) => has(r, "book-farmer"),
  },
  {
    id: "book-white-house",
    label: "White House Cook Book",
    hint: "Gillette & Ziemann, 1887",
    match: (r) => has(r, "book-white-house"),
  },
  {
    id: "book-gentile",
    label: "Italian Cook Book",
    hint: "Maria Gentile, 1919",
    match: (r) => has(r, "book-gentile"),
  },
  {
    id: "book-365-foreign",
    label: "365 Foreign Dishes",
    hint: "A dish a day, 1908",
    match: (r) => has(r, "book-365-foreign"),
  },
  {
    id: "book-pa-dutch",
    label: "Pennsylvania Dutch",
    hint: "Church-supper classics",
    match: (r) => has(r, "book-pa-dutch"),
  },
  {
    id: "book-picayune",
    label: "Picayune Creole",
    hint: "New Orleans, 1910",
    match: (r) => has(r, "book-picayune"),
  },
  {
    id: "book-mrs-fisher",
    label: "Abby Fisher, 1881",
    hint: "Old Southern cooking",
    match: (r) => has(r, "book-mrs-fisher"),
  },
  {
    id: "book-southern-1935",
    label: "Southern Cook Book 1935",
    hint: "Lustig, Sondheim, Rensel",
    match: (r) => has(r, "book-southern-1935"),
  },
  {
    id: "book-kephart",
    label: "Camp & troop",
    hint: "Kephart and Boy Scouts",
    match: (r) => has(r, "book-kephart", "book-scout-camp", "camping"),
  },
  {
    id: "book-community",
    label: "Community cookbooks",
    hint: "Ladies' Aid, Suffrage",
    match: (r) => has(r, "book-ladies-aid", "book-suffrage", "community"),
  },
  {
    id: "book-hill-salads",
    label: "Hill's salads, 1909",
    hint: "Sandwiches and chafing dishes",
    match: (r) => has(r, "book-hill-salads"),
  },
  {
    id: "book-east-asia-vintage",
    label: "Chinese & Japanese, 1914–17",
    hint: "Bosse, Watanna, Chan",
    match: (r) => has(r, "book-chinese-japanese", "book-chan-chinese"),
  },
  {
    id: "book-olive-green",
    label: "How to Cook Fish",
    hint: "Olive Green, 1908",
    match: (r) => has(r, "book-olive-green"),
  },
  {
    id: "book-jewish-1918",
    label: "Jewish Cook Book, 1918",
    hint: "Florence Greenbaum",
    match: (r) => has(r, "book-jewish-1918"),
  },
  {
    id: "book-early-veg",
    label: "Early vegetarian",
    hint: "Fulton, Dwight, Wheldon",
    match: (r) => has(r, "book-fulton-veg", "book-golden-age", "book-no-animal"),
  },
  {
    id: "book-365-desserts",
    label: "365 Desserts",
    hint: "A sweet a day, 1900",
    match: (r) => has(r, "book-365-desserts"),
  },
  {
    id: "book-virginia",
    label: "Virginia Housewife",
    hint: "Mary Randolph, 1824",
    match: (r) => has(r, "book-virginia"),
  },
  {
    id: "keto",
    label: "Keto & low-carb",
    hint: "Under 12g carbs",
    match: (r) => isKeto(r),
  },
  {
    id: "high-protein",
    label: "High protein",
    hint: "32g+ a plate",
    match: (r) => isHighProtein(r),
  },
  {
    id: "soups",
    label: "Soups & stews",
    hint: "Bowls, broths, chili",
    match: (r) => r.plate === "soup" || has(r, "soup", "stew"),
  },
  {
    id: "sandwiches",
    label: "Sandwiches",
    hint: "BLT to muffuletta",
    match: (r) => has(r, "sandwich") || r.plate === "toast",
  },
  {
    id: "weeknight",
    label: "Weeknight",
    hint: "On the table in 30",
    match: (r) => r.minutes <= 30 && !isDessert(r) && !isSauceLike(r),
  },
  {
    id: "budget",
    label: "Budget",
    hint: "Pantry, cheap, filling",
    match: (r) => has(r, "budget"),
  },
  {
    id: "date-night",
    label: "Date night",
    hint: "A little extra",
    match: (r) => has(r, "date-night"),
  },
  {
    id: "mexican",
    label: "Mexican",
    hint: "Tacos, pozole, salsas",
    match: (r) => has(r, "mexican") || (r.cuisine ?? "") === "Mexican",
  },
  {
    id: "italian",
    label: "Italian",
    hint: "Pasta, polenta, pizza",
    match: (r) => has(r, "italian") || (r.cuisine ?? "") === "Italian",
  },
  {
    id: "indian",
    label: "Indian",
    hint: "Dal, tikka, chana",
    match: (r) => has(r, "indian") || (r.cuisine ?? "") === "Indian",
  },
  {
    id: "chinese",
    label: "Chinese",
    hint: "Wontons, mapo, noodles",
    match: (r) => has(r, "chinese") || (r.cuisine ?? "") === "Chinese",
  },
  {
    id: "thai",
    label: "Thai",
    hint: "Curry, larb, tom yum",
    match: (r) => has(r, "thai") || (r.cuisine ?? "") === "Thai",
  },
  {
    id: "korean",
    label: "Korean",
    hint: "Banchan, stew, grill",
    match: (r) => has(r, "korean") || (r.cuisine ?? "") === "Korean",
  },
  {
    id: "mediterranean",
    label: "Mediterranean",
    hint: "Olive oil, lemon, herbs",
    match: (r) =>
      has(r, "mediterranean", "greek") ||
      ["Mediterranean", "Greek", "Spanish"].includes(r.cuisine ?? ""),
  },
  {
    id: "caribbean",
    label: "Caribbean",
    hint: "Jerk, plantain, rice",
    match: (r) => has(r, "caribbean") || (r.cuisine ?? "") === "Caribbean",
  },
  {
    id: "african",
    label: "African",
    hint: "Jollof, wat, couscous",
    match: (r) => has(r, "african") || (r.cuisine ?? "").includes("African"),
  },
  {
    id: "middle-eastern",
    label: "Middle Eastern",
    hint: "Hummus, shawarma, rice",
    match: (r) => has(r, "middle-eastern", "levant") || (r.cuisine ?? "") === "Middle Eastern",
  },
  {
    id: "french",
    label: "French",
    hint: "Onion soup to steak",
    match: (r) => has(r, "french") || (r.cuisine ?? "") === "French",
  },
];

export const COLLECTION_GROUPS: { id: string; labelKey: string; ids: string[] }[] = [
  { id: "diet", labelKey: "dietGroup", ids: ["vegetarian", "vegan", "gluten-free", "dairy-free", "sugar-free", "keto", "plant-based", "high-protein"] },
  { id: "method", labelKey: "methodGroup", ids: ["instant-pot", "slow-cooker", "sheet-pan", "air-fryer", "one-pot", "grill", "baking"] },
  { id: "course", labelKey: "courseGroup", ids: ["breakfast", "salads", "soups", "sandwiches", "fish", "desserts", "cookies", "sauces"] },
  { id: "cuisine", labelKey: "cuisineGroup", ids: ["mexican", "italian", "indian", "chinese", "thai", "korean", "japanese", "mediterranean", "caribbean", "african", "middle-eastern", "french", "southern"] },
  { id: "era", labelKey: "eraGroup", ids: ["vintage", "colonial", "gilded", "1900s", "1910s", "1920s", "1930s", "1940s", "wartime"] },
  { id: "books", labelKey: "bookGroup", ids: ["book-farmer", "book-white-house", "book-gentile", "book-365-foreign", "book-pa-dutch", "book-picayune", "book-mrs-fisher", "book-southern-1935", "book-virginia", "book-kephart", "book-community", "book-hill-salads", "book-east-asia-vintage", "book-olive-green", "book-jewish-1918", "book-early-veg", "book-365-desserts"] },
  { id: "table", labelKey: "tableGroup", ids: ["hometown", "holiday", "international"] },
  { id: "theme", labelKey: "themeGroup", ids: ["weeknight", "budget", "date-night", "pumpkin", "apple", "cheesecake", "wild-game", "camping", "kid-friendly", "meal-prep"] },
];

export function recipesInCollection(collectionId: string, pool: Recipe[]): Recipe[] {
  const col = COLLECTIONS.find((c) => c.id === collectionId);
  if (!col) return pool;
  return pool.filter(col.match);
}

export function coverRecipe(collectionId: string, pool: Recipe[]): Recipe | undefined {
  return recipesInCollection(collectionId, pool)[0];
}

export function collectionById(id: string): Collection | undefined {
  return COLLECTIONS.find((c) => c.id === id);
}
