import type { Recipe } from "./types";

const I = (
  name: string,
  qty: number,
  unit: string,
  aisle: Recipe["ingredients"][number]["aisle"],
) => ({ name, qty, unit, aisle });

function morning(
  partial: Omit<Recipe, "nutrition" | "pack" | "servings" | "plate" | "protein"> & {
    nutrition?: Recipe["nutrition"];
    plate?: Recipe["plate"];
    servings?: number;
    protein?: Recipe["protein"];
  },
): Recipe {
  const { nutrition, plate, servings, protein, ...rest } = partial;
  return {
    pack: "free",
    servings: servings ?? 2,
    plate: plate ?? "toast",
    protein: protein ?? "eggs",
    nutrition: nutrition ?? { cal: 380, protein: 18, carbs: 42, fat: 14 },
    ...rest,
  };
}

export const BREAKFAST_RECIPES: Recipe[] = [
  morning({
    id: "overnight-oats",
    name: "Overnight oats",
    description: "Stir it before bed. Berries and honey in the morning. No stove.",
    minutes: 8,
    cuisine: "Homestyle",
    photo: "/food/oats.jpg",
    tags: ["breakfast", "healthy", "quick", "vegetarian"],
    aliases: ["oats", "overnight oatmeal", "bircher"],
    protein: "veg",
    ingredients: [
      I("rolled oats", 1, "cup", "Pantry"),
      I("milk", 1, "cup", "Dairy & Eggs"),
      I("greek yogurt", 0.5, "cup", "Dairy & Eggs"),
      I("chia seeds", 1, "tbsp", "Pantry"),
      I("berries", 1, "cup", "Produce"),
      I("honey", 1, "tbsp", "Pantry"),
    ],
    steps: [
      "Stir oats, milk, yogurt, chia, and a pinch of salt in a jar.",
      "Chill overnight.",
      "Top with berries and honey.",
    ],
    nutrition: { cal: 340, protein: 16, carbs: 52, fat: 8 },
  }),
  morning({
    id: "blueberry-pancakes",
    name: "Blueberry pancakes",
    description: "Thick batter, wild berries, butter that actually melts. Weekend morning.",
    minutes: 25,
    cuisine: "Homestyle",
    photo: "/food/pancakes.jpg",
    tags: ["breakfast", "comfort", "vegetarian"],
    aliases: ["pancakes", "flapjacks", "hotcakes"],
    ingredients: [
      I("flour", 1.5, "cups", "Pantry"),
      I("milk", 1.25, "cups", "Dairy & Eggs"),
      I("egg", 1, "", "Dairy & Eggs"),
      I("butter", 3, "tbsp", "Dairy & Eggs"),
      I("blueberries", 1, "cup", "Produce"),
      I("maple syrup", 0.25, "cup", "Pantry"),
    ],
    steps: [
      "Whisk flour, a spoon of sugar, baking powder, and salt.",
      "Stir in milk, egg, and melted butter. Fold berries.",
      "Cook on a buttered pan until bubbles set. Flip once. Syrup at the table.",
    ],
    nutrition: { cal: 420, protein: 12, carbs: 62, fat: 14 },
  }),
  morning({
    id: "avocado-toast-egg",
    name: "Avocado toast with jammy egg",
    description: "Ripe avocado, chili, lemon, a 7-minute egg. The weekday that still feels like a cafe.",
    minutes: 12,
    cuisine: "Homestyle",
    photo: "/food/avocado.jpg",
    tags: ["breakfast", "healthy", "quick", "vegetarian"],
    aliases: ["avo toast", "avocado toast"],
    ingredients: [
      I("sourdough", 2, "slices", "Bakery"),
      I("avocado", 1, "", "Produce"),
      I("eggs", 2, "", "Dairy & Eggs"),
      I("lemon", 0.5, "", "Produce"),
      I("chili flakes", 0.5, "tsp", "Herbs & Spices"),
      I("olive oil", 1, "tbsp", "Pantry"),
    ],
    steps: [
      "Boil eggs 7 minutes. Ice bath. Peel.",
      "Toast the bread. Smash avocado with lemon, salt, and oil.",
      "Spread. Egg on top. Chili flakes.",
    ],
    nutrition: { cal: 390, protein: 16, carbs: 28, fat: 24 },
  }),
  morning({
    id: "veggie-omelette",
    name: "Veggie omelette",
    description: "Three eggs, whatever is in the crisper, a handful of cheese. Ten minutes.",
    minutes: 10,
    cuisine: "French",
    photo: "/food/omelette.jpg",
    tags: ["breakfast", "quick", "healthy", "vegetarian"],
    aliases: ["omelet", "omelette"],
    ingredients: [
      I("eggs", 3, "", "Dairy & Eggs"),
      I("spinach", 1, "handful", "Produce"),
      I("tomato", 1, "", "Produce"),
      I("cheddar", 0.33, "cup", "Dairy & Eggs"),
      I("butter", 1, "tbsp", "Dairy & Eggs"),
    ],
    steps: [
      "Beat eggs with salt. Melt butter in a pan.",
      "Pour eggs. Scatter spinach, tomato, cheese when the edges set.",
      "Fold. Slide onto a plate.",
    ],
    nutrition: { cal: 360, protein: 24, carbs: 6, fat: 26 },
  }),
  morning({
    id: "breakfast-burrito",
    name: "Breakfast burrito",
    description: "Scramble, black beans, salsa, a warm tortilla you can eat in the car.",
    minutes: 18,
    cuisine: "Mexican",
    photo: "/food/burrito.jpg",
    tags: ["breakfast", "quick"],
    aliases: ["egg burrito", "morning burrito"],
    protein: "eggs",
    ingredients: [
      I("tortillas", 2, "", "Bakery"),
      I("eggs", 4, "", "Dairy & Eggs"),
      I("black beans", 1, "cup", "Pantry"),
      I("cheddar", 0.5, "cup", "Dairy & Eggs"),
      I("salsa", 0.5, "cup", "Pantry"),
      I("spinach", 1, "handful", "Produce"),
    ],
    steps: [
      "Warm beans. Scramble eggs softly.",
      "Heat tortillas. Fill with eggs, beans, cheese, salsa, spinach.",
      "Roll tight. Optional: toast the seam in a dry pan.",
    ],
    servings: 2,
    nutrition: { cal: 480, protein: 28, carbs: 44, fat: 20 },
  }),
  morning({
    id: "salmon-bagel",
    name: "Smoked salmon bagel",
    description: "Toasted bagel, cream cheese, smoked salmon, capers, red onion. No pan.",
    minutes: 8,
    cuisine: "American",
    photo: "/food/bagel.jpg",
    tags: ["breakfast", "quick", "healthy"],
    aliases: ["lox bagel", "salmon bagel"],
    protein: "fish",
    ingredients: [
      I("bagels", 2, "", "Bakery"),
      I("cream cheese", 4, "tbsp", "Dairy & Eggs"),
      I("smoked salmon", 4, "oz", "Meat & Seafood"),
      I("red onion", 0.25, "", "Produce"),
      I("capers", 1, "tbsp", "Pantry"),
      I("lemon", 0.5, "", "Produce"),
    ],
    steps: [
      "Toast bagels.",
      "Spread cream cheese. Layer salmon, onion, capers.",
      "Lemon over the top.",
    ],
    nutrition: { cal: 430, protein: 24, carbs: 42, fat: 18 },
  }),
  morning({
    id: "steel-cut-porridge",
    name: "Steel-cut porridge",
    description: "Toasted oats, milk, a pinch of salt. Brown sugar and cream if you want Sunday.",
    minutes: 30,
    cuisine: "Homestyle",
    photo: "/food/oats.jpg",
    tags: ["breakfast", "healthy", "comfort", "vegetarian"],
    aliases: ["oatmeal", "porridge", "steel cut oats"],
    protein: "veg",
    ingredients: [
      I("steel-cut oats", 1, "cup", "Pantry"),
      I("water", 3, "cups", "Other"),
      I("milk", 1, "cup", "Dairy & Eggs"),
      I("brown sugar", 2, "tbsp", "Pantry"),
      I("butter", 1, "tbsp", "Dairy & Eggs"),
    ],
    steps: [
      "Toast oats in butter 2 minutes.",
      "Add water and a pinch of salt. Simmer 20 minutes, stirring.",
      "Finish with milk and brown sugar.",
    ],
    nutrition: { cal: 310, protein: 10, carbs: 48, fat: 8 },
  }),
];
