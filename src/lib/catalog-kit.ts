import type { Recipe } from "./types";

export const I = (
  name: string,
  qty: number,
  unit: string,
  aisle: Recipe["ingredients"][number]["aisle"],
) => ({ name, qty, unit, aisle });

/** Older-book row printed with no amount ("slices of lemon"): shown without a count. */
export const IN = (
  name: string,
  qty: number,
  unit: string,
  aisle: Recipe["ingredients"][number]["aisle"],
) => ({ name, qty, unit, aisle, noCount: true as const });

export function dish(
  partial: Omit<Recipe, "nutrition" | "pack" | "servings"> & {
    nutrition?: Recipe["nutrition"];
    pack?: Recipe["pack"];
    servings?: number;
  },
): Recipe {
  return {
    pack: "free",
    servings: 4,
    nutrition: { cal: 400, protein: 20, carbs: 36, fat: 16 },
    ...partial,
  };
}
