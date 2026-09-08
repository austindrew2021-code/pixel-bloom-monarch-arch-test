import { SAUCE_RECIPES } from "./catalog-sauces";
import type { Recipe } from "./types";

export const SAUCE_MENUS = [
  { id: "donair", label: "Donair", hint: "Mom-and-pop, Greco, Pizza Delight" },
  { id: "bbq", label: "BBQ", hint: "Kansas City to Carolina" },
  { id: "classic", label: "Classic", hint: "Hollandaise, marinara, pesto" },
  { id: "world", label: "World", hint: "Chimichurri, zhug, nuoc cham" },
  { id: "rub", label: "Dry rubs", hint: "Memphis, jerk, Montreal" },
  { id: "dip", label: "Dips", hint: "Ranch, tzatziki, aioli" },
] as const;

export type SauceMenuId = (typeof SAUCE_MENUS)[number]["id"];

export function sauceMenuOf(recipe: Recipe): SauceMenuId {
  const blob = `${recipe.name} ${recipe.tags.join(" ")} ${(recipe.aliases ?? []).join(" ")}`.toLowerCase();
  if (blob.includes("donair") || recipe.tags.includes("maritimes")) return "donair";
  if (recipe.tags.includes("dry-rub") || blob.includes("rub") || blob.includes("spice")) return "rub";
  if (/bbq|carolina|alabama|buffalo|kc |kansas|vinegar sauce|come-back/.test(blob)) return "bbq";
  if (/ranch|tzatziki|aioli|tartar|cocktail|dip/.test(blob)) return "dip";
  if (/hollandaise|b[eé]arnaise|marinara|pesto|alfredo|gravy/.test(blob)) return "classic";
  return "world";
}

export function saucesIn(id: SauceMenuId | "all", pool: Recipe[] = SAUCE_RECIPES): Recipe[] {
  if (id === "all") return pool;
  return pool.filter((r) => sauceMenuOf(r) === id);
}

export function isSauceRecipe(recipe: Recipe): boolean {
  return recipe.tags.includes("sauce") || recipe.tags.includes("dry-rub");
}
