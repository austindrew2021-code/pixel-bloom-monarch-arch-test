import type { GoalKind } from "./body.ts";
import { normalizeGoalKind } from "./body.ts";
import type { Recipe } from "./types.ts";

function isDinnerMain(recipe: Recipe): boolean {
  const tags = recipe.tags ?? [];
  return (
    !tags.includes("dessert") &&
    recipe.plate !== "dessert" &&
    !tags.includes("sauce") &&
    !tags.includes("dry-rub") &&
    !tags.includes("breakfast") &&
    !tags.includes("drink")
  );
}

function isHealthy(recipe: Recipe): boolean {
  if ((recipe.tags ?? []).includes("healthy") || (recipe.tags ?? []).includes("lean")) return true;
  const n = recipe.nutrition;
  return n.cal <= 480 && n.protein >= 18 && n.fat <= 22;
}

const CUT_NAME =
  /\b(fritters?|hush pupp(?:y|ies)|cornbread|funnel cakes?|beignets?|churros?|corn dogs?|loaded nachos?|mac(?:aroni)? and cheese|biscuits? and gravy|chicken[- ]fried|country[- ]fried|spoon bread|sticky buns?|dump cakes?|pound cakes?|funnel|poutine|loaded fries|cheese fries|onion rings?|tater tots?|funnel cake)\b/i;

const CUT_FRIED = /\b(deep[- ]fried|beer[- ]batter|battered|cornmeal pones?|fried in deep)\b/i;

const CUT_DESSERT =
  /\b(affogato|gelato|ice cream|sundae|panna cotta|tiramisu|pastry|cheesecake|cupcakes?|milkshake|sorbet)\b/i;

export function recipeSearchBlob(recipe: Pick<Recipe, "name" | "tags"> & { ingredients?: { name: string }[] }): string {
  return `${recipe.name} ${(recipe.tags ?? []).join(" ")} ${(recipe.ingredients ?? []).map((i) => i.name).join(" ")}`.toLowerCase();
}

/** Dishes that must never auto-plate on a Cut. Sides-as-dinners and fried batter belong here. */
export function isCutOffGoal(recipe: Recipe): boolean {
  const name = recipe.name.toLowerCase();
  if (CUT_NAME.test(name) || CUT_DESSERT.test(name)) return true;
  if ((recipe.tags ?? []).includes("dessert") || recipe.plate === "dessert") return true;
  const blob = recipeSearchBlob(recipe);
  if (CUT_FRIED.test(blob) && recipe.nutrition.protein < 30) return true;
  if (/\bfried\b/.test(name) && recipe.nutrition.cal >= 580 && recipe.nutrition.protein < 32) return true;
  if (recipe.nutrition.cal >= 720 && recipe.nutrition.protein < 28) return true;
  if (recipe.nutrition.protein < 12 && recipe.protein === "veg" && recipe.nutrition.cal >= 220) return true;
  return false;
}

export function fitsInventedGoal(
  dish: { name: string; nutrition: { cal: number; protein: number; carbs: number; fat: number } },
  goal: GoalKind | string | undefined,
): boolean {
  const kind = normalizeGoalKind(goal);
  const name = dish.name.toLowerCase();
  if (kind === "lose" || kind === "recomp") {
    if (CUT_NAME.test(name) || CUT_DESSERT.test(name)) return false;
    if (dish.nutrition.cal >= 750 && dish.nutrition.protein < 30) return false;
    if (kind === "lose" && dish.nutrition.protein < 18 && dish.nutrition.cal > 480) return false;
  }
  return true;
}

export function fitsGoal(recipe: Recipe, goal: GoalKind | string | undefined, slot: "dinner" | "any" = "dinner"): boolean {
  const kind = normalizeGoalKind(goal);
  if (slot === "dinner" && !isDinnerMain(recipe)) return false;
  if (kind === "lose") {
    if (isCutOffGoal(recipe)) return false;
    if (recipe.nutrition.protein < 18 && recipe.nutrition.cal > 450) return false;
    return true;
  }
  if (kind === "recomp") {
    if (isCutOffGoal(recipe) && recipe.nutrition.protein < 34) return false;
    return recipe.nutrition.protein >= 20 || recipe.nutrition.cal <= 540;
  }
  if (kind === "lean") {
    return recipe.nutrition.protein >= 18;
  }
  if (kind === "performance") {
    return recipe.nutrition.cal >= 360 || recipe.nutrition.carbs >= 32 || recipe.nutrition.protein >= 28;
  }
  return true;
}

export function goalRankBoost(recipe: Recipe, goal: GoalKind | string | undefined): number {
  const kind = normalizeGoalKind(goal);
  const n = recipe.nutrition;
  if (kind === "lose") {
    let s = 0;
    if (n.protein >= 32) s += 1.6;
    if (n.cal <= 520) s += 0.9;
    if (n.cal > 640) s -= 1.4;
    if (isHealthy(recipe)) s += 0.7;
    if (n.carbs >= 70 && n.protein < 28) s -= 0.8;
    if (isCutOffGoal(recipe)) s -= 8;
    return s;
  }
  if (kind === "recomp") {
    let s = 0;
    if (n.protein >= 30) s += 1.2;
    if (n.cal >= 420 && n.cal <= 620) s += 0.5;
    if (isCutOffGoal(recipe)) s -= 3;
    return s;
  }
  if (kind === "lean") {
    let s = 0;
    if (n.protein >= 28) s += 0.9;
    if (n.cal >= 500) s += 0.4;
    return s;
  }
  if (kind === "performance") {
    let s = 0;
    if (n.carbs >= 50) s += 1.1;
    if (n.cal >= 520 && n.protein >= 26) s += 0.6;
    return s;
  }
  return 0;
}

const STRICT: GoalKind[] = ["lose", "recomp", "maintain", "lean", "performance"];

/** Family table follows the strictest seat so a Cut never gets fritters. */
export function strictestGoal(kinds: Array<GoalKind | string | undefined>): GoalKind {
  let best: GoalKind = "maintain";
  let bestI = STRICT.indexOf("maintain");
  for (const raw of kinds) {
    if (!raw) continue;
    const k = normalizeGoalKind(raw);
    const i = STRICT.indexOf(k);
    if (i >= 0 && i < bestI) {
      best = k;
      bestI = i;
    }
  }
  return best;
}

export function chefGoalRules(kind: GoalKind | string | undefined): string {
  const id = normalizeGoalKind(kind);
  if (id === "lose") {
    return "GOAL is Cut. Hard bans: fritters, hush puppies, cornbread as a main, beer-battered or deep-fried plates, pastry, affogato, ice cream, sugar desserts as dinner, mac and cheese, biscuits and gravy. Plate high-protein, moderate-calorie homemade food. Hit remaining protein first. Never invent off-goal comfort food.";
  }
  if (id === "recomp") {
    return "GOAL is Recomp. Keep protein high and calories near maintenance. Skip fried batter and pastry as dinner. Prefer grilled, roasted, skillet, soup, and bowl plates with 30g+ protein.";
  }
  if (id === "lean") {
    return "GOAL is Lean gain. Slight surplus. Protein-forward plates, enough carbs to train, no junk-calorie desserts as dinner.";
  }
  if (id === "performance") {
    return "GOAL is Performance. Fuel training: keep carbs and calories up, still real homemade food, protein at every plate.";
  }
  return "GOAL is Maintain. Balanced homemade dinners. Honor remaining calories and protein.";
}
