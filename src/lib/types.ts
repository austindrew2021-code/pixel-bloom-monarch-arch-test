import type { FitnessSourceId } from "./devices";

export type Aisle =
  | "Produce"
  | "Meat & Seafood"
  | "Dairy & Eggs"
  | "Pantry"
  | "Bakery"
  | "Frozen"
  | "Herbs & Spices"
  | "Other";

export type Protein =
  | "chicken"
  | "beef"
  | "pork"
  | "fish"
  | "seafood"
  | "veg"
  | "eggs"
  | "turkey";

export type PlateKind =
  | "roast"
  | "pasta"
  | "bowl"
  | "fish"
  | "soup"
  | "taco"
  | "green"
  | "skillet"
  | "curry"
  | "toast"
  | "dessert";

export type PackId = "free" | "weeknight" | "protein" | "batch";

export type AddonId =
  | "weeknight"
  | "protein"
  | "batch"
  | "bundle"
  | "nutrition"
  | "ai-chef"
  | "midnight"
  | "chef-plus"
  | "family"
  | "kitchen-table"
  | "plates-15"
  | "plates-40"
  | "body-sync";

export type PrefId = "vegetarian" | "pescatarian" | "vegan" | "gluten-free" | "sugar-free" | "quick" | "budget";

export type AllergyId = "gluten" | "dairy" | "nuts" | "shellfish" | "spicy";

export type MealSlotKind = "breakfast" | "lunch" | "dinner";

export type Ingredient = {
  name: string;
  qty: number;
  unit: string;
  aisle: Aisle;
};

export type Nutrition = {
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type RecipeSource = {
  book: string;
  author?: string;
  year?: number;
  credit: string;
  era: string;
  archiveId?: string;
};

export type Recipe = {
  id: string;
  name: string;
  description: string;
  minutes: number;
  servings: number;
  protein: Protein;
  plate: PlateKind;
  pack: PackId;
  tags: string[];
  cuisine?: string;
  aliases?: string[];
  ingredients: Ingredient[];
  steps: string[];
  nutrition: Nutrition;
  photo?: string;
  source?: RecipeSource;
};

export type CustomMeal = {
  id: string;
  name: string;
  minutes: number;
  notes: string;
  ingredients: Ingredient[];
  nutrition?: Nutrition;
  steps?: string[];
  cuisine?: string;
};

export type PlannedMeal = {
  id: string;
  date: string;
  slot: MealSlotKind;
  recipeId?: string;
  custom?: CustomMeal;
  skip?: "takeout" | "rest";
  /** Next Gen auto-plated dinners can be swapped when training changes. */
  auto?: boolean;
};

export type PantryItem = {
  id: string;
  name: string;
};

export type ExtraGroceryItem = {
  id: string;
  name: string;
  aisle: Aisle;
  weekStart: string;
};

export type Addon = {
  id: AddonId;
  name: string;
  tagline: string;
  description: string;
  price: number;
  includes?: PackId[];
  period?: "month" | "once";
};

export type Visibility = "private" | "followers" | "public";

export type WorkoutKind = "lift" | "run" | "walk" | "ride" | "class" | "other";

export type Workout = {
  id: string;
  date: string;
  kind: WorkoutKind;
  minutes: number;
  kcal?: number;
  volumeKg?: number;
  distanceKm?: number;
  source?: FitnessSourceId;
};

export type MacroGoal = {
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type Snack = {
  id: string;
  date: string;
  name: string;
  nutrition: Nutrition;
};

export const CUISINES = [
  "Old school",
  "Newfoundland",
  "Nova Scotia",
  "New Brunswick",
  "Prince Edward Island",
  "Greek",
  "Italian",
  "Mexican",
  "Indian",
  "East Asian",
  "Middle Eastern",
  "French",
  "Caribbean",
  "American",
  "Southern",
  "Japanese",
  "Holiday",
  "Plant-based",
  "British",
  "Spanish",
  "Homestyle",
] as const;

export type Cuisine = (typeof CUISINES)[number];
