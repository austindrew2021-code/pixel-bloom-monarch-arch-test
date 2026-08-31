import type { AllergyId, Nutrition, PlannedMeal, Protein, Recipe } from "./types";

export const ALLERGIES: { id: AllergyId; label: string; hint: string }[] = [
  { id: "gluten", label: "Gluten", hint: "Wheat, pasta, bread" },
  { id: "dairy", label: "Dairy", hint: "Milk, cheese, butter" },
  { id: "nuts", label: "Nuts", hint: "Peanut to pecan" },
  { id: "shellfish", label: "Shellfish", hint: "Shrimp, crab, mussels" },
  { id: "spicy", label: "Spicy", hint: "Chili, cayenne, hot sauce" },
];

const PATTERNS: Record<AllergyId, RegExp> = {
  gluten:
    /flour|pasta|spaghetti|penne|macaroni|lasagna|noodle|ramen|udon|bread|breadcrumb|panko|tortilla|wheat|bun|bagel|naan|pita|dumpling|couscous|orzo|soy sauce|pie crust|dough|cracker|seitan|barley|rye|farro|wraps?|crouton/i,
  dairy:
    /milk|butter|cream|cheese|parmesan|mozzarella|cheddar|yogurt|yoghurt|ricotta|feta|halloumi|paneer|sour cream|mascarpone|whey|ghee|brie|ice cream/i,
  nuts: /peanut|almond|walnut|pecan|cashew|pistachio|hazelnut|macadamia|pine nut/i,
  shellfish: /shrimp|prawn|crab|lobster|clam|mussel|scallop|oyster|crawfish|crayfish/i,
  spicy:
    /chili|chile|cayenne|jalape[nñ]o|hot sauce|pepper flake|harissa|sriracha|gochujang|chipotle|scotch bonnet|habanero|berbere/i,
};

export function recipeAllergens(recipe: Recipe): AllergyId[] {
  const blob = `${recipe.name} ${recipe.tags.join(" ")} ${recipe.ingredients.map((i) => i.name).join(" ")}`;
  return ALLERGIES.map((a) => a.id).filter((id) => PATTERNS[id].test(blob));
}

export function recipeSafe(recipe: Recipe, allergies: AllergyId[]): boolean {
  if (allergies.length === 0) return true;
  const has = new Set(recipeAllergens(recipe));
  return !allergies.some((a) => has.has(a));
}

export function proteinDot(protein?: Protein): string {
  switch (protein) {
    case "chicken":
      return "bg-food-yolk";
    case "beef":
      return "bg-food-tomato";
    case "pork":
      return "bg-food-salmon";
    case "fish":
      return "bg-food-leaf";
    case "seafood":
      return "bg-food-herb";
    case "veg":
      return "bg-food-leaf";
    case "eggs":
      return "bg-food-cream";
    case "turkey":
      return "bg-food-crust";
    default:
      return "bg-muted";
  }
}

export function proteinLabel(protein?: Protein): string {
  if (!protein) return "mix";
  if (protein === "veg") return "veg";
  return protein;
}

const COST: Record<Protein, number> = {
  chicken: 14,
  beef: 20,
  pork: 13,
  fish: 18,
  seafood: 22,
  veg: 9,
  eggs: 8,
  turkey: 15,
};

export function plateCost(recipe: Recipe, household: number): number {
  const base = COST[recipe.protein] + recipe.ingredients.length * 0.45;
  const scaled = base * (household / Math.max(1, recipe.servings));
  return Math.round(scaled * 2) / 2;
}

/** What the same plate would run at a restaurant or takeout counter — roughly 2x grocery cost. */
const TAKEOUT_COST: Record<Protein, number> = {
  chicken: 30,
  beef: 42,
  pork: 28,
  fish: 38,
  seafood: 46,
  veg: 20,
  eggs: 18,
  turkey: 32,
};

export function takeoutCost(recipe: Recipe, household: number): number {
  const base = TAKEOUT_COST[recipe.protein];
  const scaled = base * (Math.max(1, household) / Math.max(1, recipe.servings));
  return Math.round(scaled * 2) / 2;
}

/** Estimated dollars saved by cooking this plate instead of ordering it in. */
export function mealSavings(recipe: Recipe, household: number): number {
  return Math.max(0, takeoutCost(recipe, household) - plateCost(recipe, household));
}

export const SNACKS: { name: string; nutrition: Nutrition }[] = [
  { name: "Eggs", nutrition: { cal: 180, protein: 12, carbs: 1, fat: 14 } },
  { name: "Greek yogurt", nutrition: { cal: 150, protein: 15, carbs: 8, fat: 4 } },
  { name: "Protein shake", nutrition: { cal: 160, protein: 25, carbs: 6, fat: 2 } },
  { name: "Cottage cheese", nutrition: { cal: 180, protein: 20, carbs: 8, fat: 5 } },
  { name: "Protein bar", nutrition: { cal: 210, protein: 20, carbs: 22, fat: 7 } },
];

export function skipTitle(skip?: PlannedMeal["skip"]): string {
  if (skip === "takeout") return "Eating out";
  if (skip === "rest") return "Kitchen closed";
  return "Open night";
}
