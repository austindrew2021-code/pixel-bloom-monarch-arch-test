import { recipeAllergens } from "./shield";
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

function blob(recipe: Recipe): string {
  return `${recipe.name} ${(recipe.tags ?? []).join(" ")} ${recipe.ingredients.map((i) => i.name).join(" ")}`.toLowerCase();
}

const SUGAR =
  /\b(brown sugar|powdered sugar|confectioners|icing sugar|granulated sugar|caster sugar|white sugar|cane sugar|coconut sugar|maple syrup|molasses|corn syrup|agave|sweetened condensed|chocolate chip|semi-sweet|milk chocolate|caramel|fudge|marshmallow|honey)\b|\bsugar\b/i;
const EGG = /\b(eggs?|egg white|egg yolk|mayonnaise)\b/i;
const HONEY_GEL = /\b(honey|gelatin)\b/i;

export function isVegetarian(recipe: Recipe): boolean {
  const tags = recipe.tags ?? [];
  if (["chicken", "beef", "pork", "fish", "seafood", "turkey"].includes(recipe.protein)) return false;
  if (tags.includes("vegan") || tags.includes("vegetarian")) return true;
  if (!["veg", "eggs"].includes(recipe.protein)) return false;
  const text = blob(recipe);
  return !/\b(chicken|turkey|duck|beef|pork|ham|bacon|sausage|lamb|veal|venison|anchovy|fish sauce|oyster sauce|gelatin|shrimp|salmon|tuna|cod|moose|elk|bison)\b/i.test(
    text,
  );
}

export function isVegan(recipe: Recipe): boolean {
  const tags = recipe.tags ?? [];
  if (tags.includes("vegan")) return recipe.protein === "veg";
  if (recipe.protein !== "veg") return false;
  if (!isVegetarian(recipe)) return false;
  if (recipeAllergens(recipe).includes("dairy")) return false;
  const text = blob(recipe);
  if (EGG.test(text) || HONEY_GEL.test(text)) return false;
  if (/\b(butter|milk|cream|cheese|yogurt|yoghurt|ghee|whey|mayonnaise)\b/i.test(text)) return false;
  return true;
}

export function isGlutenFree(recipe: Recipe): boolean {
  if ((recipe.tags ?? []).includes("gluten-free")) return true;
  if ((recipe.tags ?? []).includes("gluten")) return false;
  return !recipeAllergens(recipe).includes("gluten");
}

export function isDairyFree(recipe: Recipe): boolean {
  if ((recipe.tags ?? []).includes("dairy-free")) return true;
  return !recipeAllergens(recipe).includes("dairy");
}

export function isSugarFree(recipe: Recipe): boolean {
  if ((recipe.tags ?? []).includes("sugar-free")) return true;
  return !SUGAR.test(blob(recipe));
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

export function decorateDietTags(recipe: Recipe): Recipe {
  const extra = dietFlags(recipe);
  if (extra.length === 0) return recipe;
  return { ...recipe, tags: Array.from(new Set([...(recipe.tags ?? []), ...extra])) };
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
