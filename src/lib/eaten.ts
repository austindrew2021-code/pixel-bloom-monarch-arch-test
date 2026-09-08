import type { Nutrition, Snack } from "./types.ts";

/** Plating Tonight is not eating. Fuel only counts a day's meals after an explicit log. */
export function mealsCountTowardFuel(date: string, cookedDates: readonly string[] | undefined): boolean {
  return Boolean(cookedDates?.includes(date));
}

/** 0/0 unknown macros must not look like a finished measurement. */
export function snackCountsTowardFuel(snack: { unknownMacros?: boolean }): boolean {
  return snack.unknownMacros !== true;
}

export function isSilentZeroNutrition(n: Nutrition | null | undefined): boolean {
  if (!n) return true;
  return n.cal === 0 && n.protein === 0 && n.carbs === 0 && n.fat === 0;
}

export function sumSnacksForFuel(snacks: Snack[], date: string): Nutrition {
  return snacks
    .filter((s) => s.date === date && snackCountsTowardFuel(s))
    .reduce(
      (sum, s) => ({
        cal: sum.cal + s.nutrition.cal,
        protein: sum.protein + s.nutrition.protein,
        carbs: sum.carbs + s.nutrition.carbs,
        fat: sum.fat + s.nutrition.fat,
      }),
      { cal: 0, protein: 0, carbs: 0, fat: 0 },
    );
}
