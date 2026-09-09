import type { Nutrition } from "./types";

/**
 * The gym plate: pick four foods, get the grams.
 *
 * A lifter does not cook 1539 dishes. They eat a handful of foods on repeat and
 * move the grams around until the macros land — chicken and rice on Monday,
 * chicken and rice on Tuesday. A recipe library is the wrong shape for that, and
 * no amount of heritage cooking fixes it.
 *
 * So this is the other shape: choose a protein, a carb, a vegetable and a fat,
 * and the plate is solved backwards from today's remaining macros. It is the
 * same arithmetic a lifter does on a phone calculator, done once and correctly.
 *
 * Per-100 g values are standard reference figures for the food as eaten
 * (cooked, where it is cooked). They are close enough to build a day on and are
 * not a substitute for a label when one exists.
 */

export type FoodRole = "protein" | "carb" | "veg" | "fat";

export type GymFood = {
  id: string;
  name: string;
  role: FoodRole;
  /** Macros per 100 g as eaten. */
  per100: Nutrition;
  /** A normal portion, so the first suggestion is not 17 g of rice. */
  typicalG: number;
  /** Smallest sensible amount to weigh out. */
  minG: number;
  maxG: number;
  /** Diets this food is fine for. Absent means it suits everyone. */
  vegetarian?: boolean;
  vegan?: boolean;
};

const F = (
  id: string,
  name: string,
  role: FoodRole,
  per100: [number, number, number, number],
  typicalG: number,
  minG: number,
  maxG: number,
  diet: { vegetarian?: boolean; vegan?: boolean } = {},
): GymFood => ({
  id,
  name,
  role,
  per100: { cal: per100[0], protein: per100[1], carbs: per100[2], fat: per100[3] },
  typicalG,
  minG,
  maxG,
  ...diet,
});

export const GYM_FOODS: readonly GymFood[] = [
  // --- protein ---------------------------------------------------------
  F("chicken-breast", "Chicken breast", "protein", [165, 31, 0, 3.6], 200, 80, 450),
  F("lean-beef", "Lean ground beef (93/7)", "protein", [182, 26, 0, 8], 170, 80, 400),
  F("salmon", "Salmon", "protein", [208, 22, 0, 13], 170, 80, 350),
  F("white-fish", "White fish", "protein", [129, 26, 0, 2.7], 200, 80, 450),
  F("turkey-mince", "Lean ground turkey", "protein", [170, 27, 0, 7], 170, 80, 400),
  F("eggs", "Whole eggs", "protein", [143, 12.6, 0.7, 9.5], 150, 50, 350, { vegetarian: true }),
  F("egg-whites", "Egg whites", "protein", [52, 11, 0.7, 0.2], 250, 100, 600, { vegetarian: true }),
  F("greek-yogurt", "Greek yogurt (0%)", "protein", [59, 10, 3.6, 0.4], 250, 100, 600, { vegetarian: true }),
  F("cottage-cheese", "Cottage cheese (2%)", "protein", [84, 11, 4.3, 2.3], 250, 100, 600, { vegetarian: true }),
  F("whey", "Whey protein", "protein", [400, 80, 8, 5], 40, 15, 90, { vegetarian: true }),
  F("tofu", "Extra-firm tofu", "protein", [144, 17, 3, 9], 200, 80, 450, { vegetarian: true, vegan: true }),
  F("tempeh", "Tempeh", "protein", [192, 20, 8, 11], 150, 70, 350, { vegetarian: true, vegan: true }),
  F("lentils", "Lentils", "protein", [116, 9, 20, 0.4], 220, 80, 500, { vegetarian: true, vegan: true }),

  // --- carbs -----------------------------------------------------------
  F("white-rice", "White rice", "carb", [130, 2.7, 28, 0.3], 200, 60, 600, { vegetarian: true, vegan: true }),
  F("brown-rice", "Brown rice", "carb", [123, 2.7, 26, 1], 200, 60, 600, { vegetarian: true, vegan: true }),
  F("potato", "Potato", "carb", [87, 2, 20, 0.1], 250, 80, 700, { vegetarian: true, vegan: true }),
  F("sweet-potato", "Sweet potato", "carb", [90, 2, 21, 0.1], 250, 80, 700, { vegetarian: true, vegan: true }),
  F("oats", "Oats (dry)", "carb", [379, 13, 67, 6.5], 80, 30, 200, { vegetarian: true, vegan: true }),
  F("pasta", "Pasta", "carb", [158, 5.8, 31, 0.9], 200, 60, 500, { vegetarian: true, vegan: true }),
  F("bagel", "Bagel", "carb", [250, 10, 49, 1.5], 100, 40, 250, { vegetarian: true, vegan: true }),
  F("tortilla", "Flour tortilla", "carb", [306, 8, 51, 7], 80, 30, 200, { vegetarian: true, vegan: true }),

  // --- vegetables ------------------------------------------------------
  F("broccoli", "Broccoli", "veg", [35, 2.4, 7, 0.4], 200, 80, 500, { vegetarian: true, vegan: true }),
  F("green-beans", "Green beans", "veg", [35, 1.8, 8, 0.1], 200, 80, 500, { vegetarian: true, vegan: true }),
  F("spinach", "Spinach", "veg", [23, 2.9, 3.6, 0.4], 150, 60, 400, { vegetarian: true, vegan: true }),
  F("peppers", "Bell peppers", "veg", [31, 1, 6, 0.3], 200, 80, 500, { vegetarian: true, vegan: true }),
  F("asparagus", "Asparagus", "veg", [22, 2.4, 4, 0.2], 200, 80, 500, { vegetarian: true, vegan: true }),
  F("mixed-salad", "Mixed salad", "veg", [20, 1.5, 3, 0.2], 150, 60, 400, { vegetarian: true, vegan: true }),

  // --- fats ------------------------------------------------------------
  F("olive-oil", "Olive oil", "fat", [884, 0, 0, 100], 15, 5, 60, { vegetarian: true, vegan: true }),
  F("almonds", "Almonds", "fat", [579, 21, 22, 50], 30, 10, 100, { vegetarian: true, vegan: true }),
  F("peanut-butter", "Peanut butter", "fat", [588, 25, 20, 50], 32, 10, 100, { vegetarian: true, vegan: true }),
  F("avocado", "Avocado", "fat", [160, 2, 9, 15], 100, 30, 250, { vegetarian: true, vegan: true }),
  F("cheese", "Cheddar", "fat", [403, 25, 1.3, 33], 40, 15, 120, { vegetarian: true }),
];

export const GYM_FOOD_BY_ID = new Map(GYM_FOODS.map((f) => [f.id, f]));

export function foodsInRole(role: FoodRole, diet?: { vegetarian?: boolean; vegan?: boolean }): GymFood[] {
  return GYM_FOODS.filter((f) => {
    if (f.role !== role) return false;
    if (diet?.vegan) return Boolean(f.vegan);
    if (diet?.vegetarian) return Boolean(f.vegetarian || f.vegan);
    return true;
  });
}

export type PlateItem = { food: GymFood; grams: number };

export type GymPlate = {
  items: PlateItem[];
  totals: Nutrition;
  /** Target minus totals. Small numbers mean the plate landed. */
  off: Nutrition;
  /** True when every macro is within a normal rounding distance of target. */
  onTarget: boolean;
};

function scale(food: GymFood, grams: number): Nutrition {
  const k = grams / 100;
  return {
    cal: food.per100.cal * k,
    protein: food.per100.protein * k,
    carbs: food.per100.carbs * k,
    fat: food.per100.fat * k,
  };
}

/**
 * Solves the three-by-three: how many grams of protein, carb and fat source hit
 * the protein, carbohydrate and fat targets at once.
 *
 * The vegetable is fixed first — nobody scales their broccoli to hit a macro —
 * and its contribution is subtracted from the targets before solving. Gaussian
 * elimination with partial pivoting; three equations is small enough that the
 * explicit loop is clearer than any library.
 */
function solve3(matrix: number[][], rhs: number[]): number[] | null {
  const m = matrix.map((row, i) => [...row, rhs[i]!]);
  for (let col = 0; col < 3; col++) {
    let pivot = col;
    for (let row = col + 1; row < 3; row++) {
      if (Math.abs(m[row]![col]!) > Math.abs(m[pivot]![col]!)) pivot = row;
    }
    if (Math.abs(m[pivot]![col]!) < 1e-9) return null; // singular: foods too alike
    [m[col], m[pivot]] = [m[pivot]!, m[col]!];
    for (let row = 0; row < 3; row++) {
      if (row === col) continue;
      const factor = m[row]![col]! / m[col]![col]!;
      for (let k = col; k < 4; k++) m[row]![k]! -= factor * m[col]![k]!;
    }
  }
  return [m[0]![3]! / m[0]![0]!, m[1]![3]! / m[1]![1]!, m[2]![3]! / m[2]![2]!];
}

const ROUND_TO = 5;

/** Grams a cook can actually weigh: nobody measures 187 g of rice. */
function weighable(grams: number, food: GymFood): number {
  const clamped = Math.max(food.minG, Math.min(food.maxG, grams));
  return Math.round(clamped / ROUND_TO) * ROUND_TO;
}

/**
 * Builds the plate.
 *
 * Protein, carbohydrate and fat are solved together rather than one after
 * another, because the foods overlap: peanut butter carries protein, oats carry
 * fat, and solving in sequence leaves an error that has to be fudged away. The
 * result is clamped to portions a person would really eat, so `off` can be
 * non-zero — and it is reported rather than hidden.
 */
export function buildGymPlate(input: {
  target: Nutrition;
  protein: string;
  carb: string;
  veg?: string;
  fat: string;
  /** Fixed vegetable portion. */
  vegGrams?: number;
}): GymPlate | null {
  const protein = GYM_FOOD_BY_ID.get(input.protein);
  const carb = GYM_FOOD_BY_ID.get(input.carb);
  const fat = GYM_FOOD_BY_ID.get(input.fat);
  const veg = input.veg ? GYM_FOOD_BY_ID.get(input.veg) : undefined;
  if (!protein || !carb || !fat) return null;

  const vegGrams = veg ? weighable(input.vegGrams ?? veg.typicalG, veg) : 0;
  const vegMacros = veg ? scale(veg, vegGrams) : { cal: 0, protein: 0, carbs: 0, fat: 0 };

  const want = {
    protein: input.target.protein - vegMacros.protein,
    carbs: input.target.carbs - vegMacros.carbs,
    fat: input.target.fat - vegMacros.fat,
  };

  // Columns are the three foods, rows the three macros, per gram.
  const solved = solve3(
    [
      [protein.per100.protein, carb.per100.protein, fat.per100.protein],
      [protein.per100.carbs, carb.per100.carbs, fat.per100.carbs],
      [protein.per100.fat, carb.per100.fat, fat.per100.fat],
    ].map((row) => row.map((v) => v / 100)),
    [want.protein, want.carbs, want.fat],
  );
  if (!solved) return null;

  const items: PlateItem[] = [
    { food: protein, grams: weighable(solved[0]!, protein) },
    { food: carb, grams: weighable(solved[1]!, carb) },
    ...(veg ? [{ food: veg, grams: vegGrams }] : []),
    { food: fat, grams: weighable(solved[2]!, fat) },
  ];

  const totals = items.reduce<Nutrition>(
    (sum, item) => {
      const macros = scale(item.food, item.grams);
      return {
        cal: sum.cal + macros.cal,
        protein: sum.protein + macros.protein,
        carbs: sum.carbs + macros.carbs,
        fat: sum.fat + macros.fat,
      };
    },
    { cal: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const rounded: Nutrition = {
    cal: Math.round(totals.cal),
    protein: Math.round(totals.protein),
    carbs: Math.round(totals.carbs),
    fat: Math.round(totals.fat),
  };
  const off: Nutrition = {
    cal: Math.round(input.target.cal - rounded.cal),
    protein: Math.round(input.target.protein - rounded.protein),
    carbs: Math.round(input.target.carbs - rounded.carbs),
    fat: Math.round(input.target.fat - rounded.fat),
  };

  return {
    items,
    totals: rounded,
    off,
    onTarget:
      Math.abs(off.protein) <= 8 && Math.abs(off.carbs) <= 12 && Math.abs(off.fat) <= 6,
  };
}

/** A sensible starting four, honouring a vegetarian or vegan kitchen. */
export function defaultPlateFoods(diet?: { vegetarian?: boolean; vegan?: boolean }): {
  protein: string;
  carb: string;
  veg: string;
  fat: string;
} {
  const pick = (role: FoodRole, preferred: string) => {
    const options = foodsInRole(role, diet);
    return options.find((f) => f.id === preferred)?.id ?? options[0]?.id ?? preferred;
  };
  return {
    protein: pick("protein", diet?.vegan ? "tofu" : "chicken-breast"),
    carb: pick("carb", "white-rice"),
    veg: pick("veg", "broccoli"),
    fat: pick("fat", "olive-oil"),
  };
}
