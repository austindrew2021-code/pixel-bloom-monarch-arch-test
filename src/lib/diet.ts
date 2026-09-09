import { recipeAllergens } from "./shield.ts";
import type { Recipe } from "./types";

export type MoodFilter =
  | "all"
  | "healthy"
  | "comfort"
  | "quick"
  | "veg"
  | "dessert"
  | "breakfast";

export type DietFlag = "vegetarian" | "vegan" | "gluten-free" | "sugar-free" | "dairy-free" | "keto";

export function isDessert(recipe: Recipe): boolean {
  return (recipe.tags ?? []).includes("dessert") || recipe.plate === "dessert";
}

export function isSauceLike(recipe: Recipe): boolean {
  return (recipe.tags ?? []).includes("sauce") || (recipe.tags ?? []).includes("dry-rub");
}

export function isBreakfast(recipe: Recipe): boolean {
  return (recipe.tags ?? []).includes("breakfast");
}

/** Sides stay off dinner fill — sauces, desserts, and breakfast have their own menus. */
export function isDinnerMain(recipe: Recipe): boolean {
  return !isDessert(recipe) && !isSauceLike(recipe) && !isBreakfast(recipe) && !(recipe.tags ?? []).includes("drink");
}

export function isHealthy(recipe: Recipe): boolean {
  if ((recipe.tags ?? []).includes("healthy") || (recipe.tags ?? []).includes("lean")) return true;
  if (isDessert(recipe) && !(recipe.tags ?? []).includes("healthy")) return false;
  if (isSauceLike(recipe)) return false;
  const n = recipe.nutrition;
  return n.cal <= 480 && n.protein >= 18 && n.fat <= 22;
}

export function isComfort(recipe: Recipe): boolean {
  const tags = recipe.tags ?? [];
  if (tags.includes("comfort") || tags.includes("old-school") || tags.includes("sunday")) return true;
  return recipe.nutrition.cal >= 560;
}

/*
 * Rows are joined with a pipe, not a space, and it matters.
 *
 * Joined with a space, "grated coconut" followed by "butter" reads as coconut
 * butter, and "short-grain rice" followed by "milk" reads as rice milk — so a
 * praline made with dairy butter and a rice pudding made with dairy milk both
 * passed as vegan. The pipe stops a pattern spanning two rows, because none of
 * them match across it.
 *
 * The tags are not in here either. They are the claim being tested, and a claim
 * cannot be its own evidence — with them in, the tag "sugar-free" contains the
 * word sugar and every sugar-free dish failed its own check.
 */
function blob(recipe: Recipe): string {
  return [recipe.name, ...recipe.ingredients.map((i) => i.name)].join(" | ").toLowerCase();
}

/*
 * A dietary claim is settled by the ingredient list, never by the tag.
 *
 * Every check below used to open with `if (tags.includes("vegan")) return true`,
 * which meant a hand-written tag silently switched the ingredient test off. The
 * result was a vegan filter offering goose-fat roast potatoes, lard refried
 * beans, ghee dal and fish-sauce som tam, and a gluten-free filter offering
 * tourtière. Someone with celiac disease trusts that filter.
 *
 * The tag can still say what a dish is FOR, and it can still take a claim away
 * (`tags: ["gluten"]`). What it cannot do is grant one the ingredients deny.
 *
 * The reason the override existed is real, though: "almond flour" contains the
 * word flour, and "coconut milk" the word milk. So the honest fix is to teach
 * the patterns about those forms rather than to let a tag wave them through.
 */

/** Flours, milks and sauces that carry the trigger word but not the thing. */
function withoutLookalikes(text: string): string {
  return text
    .replace(
      /\b(almond|coconut|chickpea|rice|corn|cassava|tapioca|buckwheat|oat|gluten[- ]free|masa|potato|nut)\s+(flour|meal|bread|pasta|noodles?|tortillas?|crumbs?|wrappers?)\b/gi,
      " ",
    )
    .replace(/\bcorn(starch|meal|flour)\b/gi, " ")
    .replace(/\bgluten[- ]free\b/gi, " ")
    .replace(/\brice (noodles?|paper|vermicelli|wine)\b/gi, " ")
    .replace(/\b(tamari|coconut aminos)\b/gi, " ")
    .replace(
      /\b(coconut|almond|soy|oat|cashew|rice|hemp|nut)\s+(milk|cream|butter|yogurt|yoghurt)\b/gi,
      " ",
    )
    .replace(/\b(peanut|nut|apple|cocoa|shea|sun)\s*butter\b/gi, " ")
    .replace(/\bbutter(nut|milk squash|head)\b/gi, " ")
    .replace(/\bcream of tartar\b/gi, " ")
    .replace(/\bnutritional yeast\b/gi, " ")
    .replace(/\b(oyster|chicken of the woods|lion's mane)\s+mushrooms?\b/gi, " ")
    .replace(/\bscallop(ed|ini)?\s+(squash|potatoes)\b/gi, " ");
}

const SUGAR =
  /\b(brown sugar|powdered sugar|confectioners|icing sugar|granulated sugar|caster sugar|white sugar|cane sugar|coconut sugar|maple syrup|molasses|corn syrups?|agave|sweetened condensed|chocolate chips?|semi-sweet|milk chocolate|dark chocolate|caramels?|fudge|marshmallows?|honey|jelly|jam|preserves)\b|\bsugars?\b/i;
const EGG = /\b(eggs?|egg white|egg yolk|mayonnaise)\b/i;
const HONEY_GEL = /\b(honey|gelatin)\b/i;

/** Fish and shellfish are fine; nothing else that had a face is. */
export function isPescatarian(recipe: Recipe): boolean {
  if (["chicken", "beef", "lamb", "pork", "turkey"].includes(recipe.protein)) return false;
  const text = withoutLookalikes(blob(recipe));
  return !/\b(chicken|turkey|duck|goose|beef|pork|ham|bacon|sausage|salami|pepperoni|prosciutto|pancetta|chorizo|lard|suet|tallow|lamb|veal|venison|moose|elk|bison|scrunchions|gelatin|beef (stock|broth)|chicken (stock|broth))\b/i.test(
    text,
  );
}

export function isVegetarian(recipe: Recipe): boolean {
  const tags = recipe.tags ?? [];
  if (["chicken", "beef", "lamb", "pork", "fish", "seafood", "turkey"].includes(recipe.protein)) return false;
  if (!["veg", "eggs"].includes(recipe.protein)) return false;
  const text = withoutLookalikes(blob(recipe));
  return !/\b(chicken|turkey|duck|goose|beef|pork|ham|bacon|sausage|salami|pepperoni|prosciutto|pancetta|chorizo|lard|suet|tallow|lamb|veal|venison|anchov|fish sauce|fish stock|fish cakes?|fish balls?|dashi|bonito|oyster sauce|worcestershire|gelatin|shrimp|prawn|crab|clam|salmon|tuna|cod|moose|elk|bison|scrunchions|bone broth|beef (stock|broth)|chicken (stock|broth))\b/i.test(
    text,
  );
}

export function isVegan(recipe: Recipe): boolean {
  if (recipe.protein !== "veg") return false;
  if (!isVegetarian(recipe)) return false;
  const text = withoutLookalikes(blob(recipe));
  if (EGG.test(text) || HONEY_GEL.test(text)) return false;
  if (/\b(butter|buttermilk|milk|cream|cheese|parmesan|mozzarella|cheddar|feta|ricotta|halloumi|paneer|yogurt|yoghurt|ghee|whey|mayonnaise|custard|condensed milk|evaporated milk)\b/i.test(text))
    return false;
  return true;
}

/** The ingredient list with lookalike names neutralised, for the allergen check. */
function safeIngredients(recipe: Recipe): Recipe["ingredients"] {
  return recipe.ingredients.map((i) => ({ ...i, name: withoutLookalikes(i.name) }));
}

export function isGlutenFree(recipe: Recipe): boolean {
  if ((recipe.tags ?? []).includes("gluten")) return false;
  return !recipeAllergens({ ...recipe, ingredients: safeIngredients(recipe) }).includes("gluten");
}

export function isDairyFree(recipe: Recipe): boolean {
  return !recipeAllergens({ ...recipe, ingredients: safeIngredients(recipe) }).includes("dairy");
}

export function isSugarFree(recipe: Recipe): boolean {
  return !SUGAR.test(withoutLookalikes(blob(recipe)));
}

export function isKeto(recipe: Recipe): boolean {
  const tags = recipe.tags ?? [];
  if (tags.includes("keto") || tags.includes("low-carb")) return true;
  if (isDessert(recipe)) return false;
  const n = recipe.nutrition;
  return n.carbs <= 12 && n.fat >= 14 && n.protein >= 12;
}

export function isHighProtein(recipe: Recipe): boolean {
  if ((recipe.tags ?? []).includes("high-protein")) return true;
  return recipe.nutrition.protein >= 32;
}

export function dietFlags(recipe: Recipe): DietFlag[] {
  const flags: DietFlag[] = [];
  if (isVegetarian(recipe)) flags.push("vegetarian");
  if (isVegan(recipe)) flags.push("vegan");
  if (isGlutenFree(recipe)) flags.push("gluten-free");
  if (isSugarFree(recipe)) flags.push("sugar-free");
  if (isDairyFree(recipe)) flags.push("dairy-free");
  if (isKeto(recipe)) flags.push("keto");
  return flags;
}

/** Claims the catalog writes by hand that the ingredients have to earn. */
const CLAIMS: Record<string, (r: Recipe) => boolean> = {
  vegetarian: isVegetarian,
  vegan: isVegan,
  "plant-based": isVegan,
  "gluten-free": isGlutenFree,
  "dairy-free": isDairyFree,
  "sugar-free": isSugarFree,
  pescatarian: isPescatarian,
};

/**
 * Add the diet flags a recipe earns, and take away the ones it does not.
 *
 * Adding was all this used to do, which left every wrong hand-written claim in
 * place: `toutons` carried "vegetarian" while its list carried pork scrunchions,
 * and nothing downstream ever looked again. Since the checks now read the
 * ingredients rather than the tag, they can be run over what the catalog claims
 * and disagree with it.
 */
export function decorateDietTags(recipe: Recipe): Recipe {
  const kept = (recipe.tags ?? []).filter((tag) => {
    const earns = CLAIMS[tag];
    return !earns || earns(recipe);
  });
  const tags = Array.from(new Set([...kept, ...dietFlags(recipe)]));
  if (tags.length === (recipe.tags ?? []).length && tags.every((t, i) => t === recipe.tags[i])) return recipe;
  return { ...recipe, tags };
}

export function matchesDiet(recipe: Recipe, diet: DietFlag | "all"): boolean {
  if (diet === "all") return true;
  if (diet === "vegetarian") return isVegetarian(recipe);
  if (diet === "vegan") return isVegan(recipe);
  if (diet === "gluten-free") return isGlutenFree(recipe);
  if (diet === "sugar-free") return isSugarFree(recipe);
  if (diet === "dairy-free") return isDairyFree(recipe);
  if (diet === "keto") return isKeto(recipe);
  return true;
}

export function matchesMood(recipe: Recipe, mood: MoodFilter): boolean {
  if (mood === "all") return true;
  if (mood === "healthy") return isHealthy(recipe);
  if (mood === "comfort") return isComfort(recipe);
  if (mood === "quick") return recipe.minutes <= 30;
  if (mood === "veg") return isVegetarian(recipe);
  if (mood === "dessert") return isDessert(recipe);
  if (mood === "breakfast") return isBreakfast(recipe);
  return true;
}
