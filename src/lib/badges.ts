import { isDairyFree, isGlutenFree, isSugarFree, isVegan, isVegetarian } from "./diet.ts";
import { recipeAllergens } from "./shield.ts";
import type { Recipe } from "./types";

/**
 * Nov 2 (item 1): the only diet and allergen labels a recipe card shows.
 * Positive passes only, spelled out, read from the same checks as the diet
 * filters and the allergy shield, so a badge can never sit next to a
 * "contains" result.
 */
export type PassBadge =
  | "Vegetarian"
  | "Vegan"
  | "Gluten-free"
  | "Dairy-free"
  | "No added sugar"
  | "Nut-free"
  | "Shellfish-free"
  | "Mild"
  | "Egg-free"
  | "Soy-free"
  | "Sesame-free"
  | "Fish-free";

export function passBadges(recipe: Recipe): PassBadge[] {
  const has = new Set(recipeAllergens(recipe));
  const out: PassBadge[] = [];
  if (isVegetarian(recipe)) out.push("Vegetarian");
  if (isVegan(recipe)) out.push("Vegan");
  if (isGlutenFree(recipe) && !has.has("gluten")) out.push("Gluten-free");
  if (isDairyFree(recipe) && !has.has("dairy")) out.push("Dairy-free");
  if (isSugarFree(recipe)) out.push("No added sugar");
  if (!has.has("nuts")) out.push("Nut-free");
  if (!has.has("shellfish")) out.push("Shellfish-free");
  if (!has.has("spicy")) out.push("Mild");
  if (!has.has("egg")) out.push("Egg-free");
  if (!has.has("soy")) out.push("Soy-free");
  if (!has.has("sesame")) out.push("Sesame-free");
  if (!has.has("fish")) out.push("Fish-free");
  return out;
}
