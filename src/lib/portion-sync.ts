import { scaleQty } from "./cuisine.ts";
import type { Aisle, Ingredient, Nutrition, Recipe } from "./types";

export type PortionSync = {
  /** Headline scale for tonight's cooked portion, e.g. 1.3 = cook/eat 30% more. */
  mult: number;
  /** Same recipe, same ingredients — just re-quantified for tonight. */
  ingredients: Ingredient[];
  /** Nutrition for the scaled portion, derived from the scaled macros. */
  nutrition: Nutrition;
  /** Plain-language instruction naming what actually changed. */
  note: string;
};

// Ignore swings under ~8% — not worth telling anyone to fuss over a handful of almonds.
const PORTION_DEADBAND = 0.08;
// Overall swing stays inside a sane range: nobody should be told to eat 2x dinner.
const PORTION_CAP = { min: 0.7, max: 1.4 };
// Meat & seafood is what was actually bought for the week. It mostly only trims
// down (fine — becomes tomorrow's lunch) and gets very little headroom to grow,
// so a big-burn day never implies "go buy more chicken."
const PROTEIN_BAND = { min: 0.75, max: 1.15 };
// Produce is cheap, usually already a bit oversupplied, and the natural place to
// bulk a plate out — it absorbs most of the swing in either direction.
const PRODUCE_BAND = { min: 0.6, max: 1.6 };
const OTHER_BAND = { min: 0.8, max: 1.25 };

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function multForAisle(aisle: Aisle, produceMult: number, proteinMult: number, otherMult: number): number {
  if (aisle === "Meat & Seafood") return proteinMult;
  if (aisle === "Produce") return produceMult;
  return otherMult;
}

function joinNames(names: string[]): string {
  const uniq = [...new Set(names)];
  if (uniq.length === 0) return "";
  if (uniq.length <= 2) return uniq.join(" and ");
  return `${uniq.slice(0, -1).join(", ")}, and ${uniq[uniq.length - 1]}`;
}

/**
 * Scales tonight's already-planned dinner to fit today's actual training instead
 * of swapping to a different recipe — for people who already bought groceries
 * for the week and don't want the dish itself to change, just how much of it.
 * Returns null when there's nothing worth adjusting (no recipe nutrition to
 * scale from, no remaining budget, or the swing is inside the deadband).
 */
export function portionSyncFor(recipe: Recipe, remainingCal: number): PortionSync | null {
  if (!(recipe.nutrition.cal > 0) || !(remainingCal > 0)) return null;
  const mult = clamp(remainingCal / recipe.nutrition.cal, PORTION_CAP.min, PORTION_CAP.max);
  if (Math.abs(mult - 1) < PORTION_DEADBAND) return null;

  const swing = mult - 1;
  const produceMult = clamp(1 + swing * 1.6, PRODUCE_BAND.min, PRODUCE_BAND.max);
  const proteinMult = clamp(1 + swing * 0.5, PROTEIN_BAND.min, PROTEIN_BAND.max);
  const otherMult = clamp(mult, OTHER_BAND.min, OTHER_BAND.max);

  const ingredients = recipe.ingredients.map((ing) => ({
    ...ing,
    qty: scaleQty(ing.qty, multForAisle(ing.aisle, produceMult, proteinMult, otherMult) * 100, 100),
  }));

  // Each macro scales by the category it actually comes from — protein barely
  // moves, carbs move with the produce/starch that's doing the bulking — and
  // calories are derived from those, not guessed separately, so the numbers
  // stay internally consistent (Atwater: 4 kcal/g protein & carb, 9 kcal/g fat).
  const protein = Math.round(recipe.nutrition.protein * proteinMult);
  const carbs = Math.round(recipe.nutrition.carbs * produceMult);
  const fat = Math.round(recipe.nutrition.fat * otherMult);
  const nutrition: Nutrition = { protein, carbs, fat, cal: Math.round(protein * 4 + carbs * 4 + fat * 9) };

  const produceNames = joinNames(recipe.ingredients.filter((i) => i.aisle === "Produce").map((i) => i.name));
  const proteinNames = joinNames(recipe.ingredients.filter((i) => i.aisle === "Meat & Seafood").map((i) => i.name));
  const pct = Math.round(mult * 100);
  const note =
    mult > 1
      ? produceNames
        ? `Burned more than planned — cook it at ${pct}% tonight: extra ${produceNames}, same ${proteinNames || "everything else"}.`
        : `Burned more than planned — cook it at ${pct}% tonight.`
      : `Lighter day than planned — ${pct}% tonight covers it. Save the rest for tomorrow instead of buying more.`;

  return { mult, ingredients, nutrition, note };
}
