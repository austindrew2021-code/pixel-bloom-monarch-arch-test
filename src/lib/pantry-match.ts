import { RECIPES } from "./recipes";
import type { Recipe } from "./types";

export type PantryIdea = {
  title: string;
  why: string;
  have: string[];
  need: string[];
  minutes: number;
  recipeId?: string;
};

function norm(s: string): string {
  return s.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function hits(ingName: string, pantry: string[]): boolean {
  const n = norm(ingName);
  if (!n) return false;
  return pantry.some((p) => {
    if (!p) return false;
    return n.includes(p) || p.includes(n) || n.split(" ").some((w) => w.length > 3 && p.includes(w));
  });
}

/** Local catalog match so Snap still works if the kitchen model is busy. */
export function mealsFromPantry(items: string[], pool: Recipe[] = RECIPES, limit = 6): PantryIdea[] {
  const pantry = items.map(norm).filter((s) => s.length > 1);
  if (pantry.length === 0) return [];

  return pool
    .map((recipe) => {
      const have: string[] = [];
      const need: string[] = [];
      for (const ing of recipe.ingredients) {
        if (hits(ing.name, pantry)) have.push(ing.name);
        else need.push(ing.name);
      }
      const score = have.length / Math.max(1, recipe.ingredients.length);
      return { recipe, have, need, score };
    })
    .filter((row) => row.have.length >= 2 && row.score >= 0.25)
    .sort((a, b) => b.score - a.score || a.need.length - b.need.length)
    .slice(0, limit)
    .map((row) => ({
      title: row.recipe.name,
      why:
        row.need.length === 0
          ? "You already have everything."
          : `You have ${row.have.slice(0, 3).join(", ")}. Check the rest one by one.`,
      have: row.have,
      need: row.need,
      minutes: row.recipe.minutes,
      recipeId: row.recipe.id,
    }));
}
