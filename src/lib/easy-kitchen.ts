import type { CustomMeal, Ingredient } from "./types";

/** Ordinary leftover dinner — the week-1 log chip, not a catalog recipe. */
export const LEFTOVER_PASTA: CustomMeal = {
  id: "leftover-pasta",
  name: "Leftover pasta",
  minutes: 15,
  notes: "Heat and eat.",
  ingredients: [
    { name: "pasta", qty: 12, unit: "oz", aisle: "Pantry" },
    { name: "tomato sauce", qty: 1, unit: "jar", aisle: "Pantry" },
    { name: "milk", qty: 1, unit: "cup", aisle: "Dairy & Eggs" },
  ],
};

export function parseIngredientLines(text: string): Ingredient[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [namePart, rest] = line.split(",").map((s) => s.trim());
      const name = namePart || "item";
      if (!rest) return { name, qty: 1, unit: "", aisle: "Other" as const };
      const bits = rest.split(/\s+/);
      const qty = Number(bits[0]);
      if (Number.isFinite(qty)) {
        return { name, qty, unit: bits.slice(1).join(" "), aisle: "Other" as const };
      }
      return { name, qty: 1, unit: rest, aisle: "Other" as const };
    });
}

export function ingredientLines(ingredients: Ingredient[]): string {
  return ingredients
    .map((i) => (i.unit ? `${i.name}, ${i.qty} ${i.unit}`.trim() : i.qty !== 1 ? `${i.name}, ${i.qty}` : i.name))
    .join("\n");
}
