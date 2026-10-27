import { I, IN, dish } from "./catalog-kit.ts";
import type { Recipe, RecipeSource } from "./types";

const packSource: RecipeSource = {
  book: "Betty Crocker's New Christmas Cookbook",
  author: "Betty Crocker",
  year: 1993,
  era: "1990s",
  archiveId: "betty-crockers-new-christmas-cookbook",
  credit: "Betty Crocker's New Christmas Cookbook (©1993). Internet Archive betty-crockers-new-christmas-cookbook. Founder-cleared free use. Exact ingredients and method as printed.",
};

function h(
  id: string,
  name: string,
  cuisine: string,
  tags: string[],
  protein: Recipe["protein"],
  plate: Recipe["plate"],
  minutes: number,
  description: string,
  ingredients: Recipe["ingredients"],
  steps: string[],
  nutrition: Recipe["nutrition"],
): Recipe {
  return dish({
    id, name, cuisine, description, minutes, protein, plate,
    tags: Array.from(new Set(["vintage", "book-betty-crocker-christmas", "era-1990s", ...tags])),
    ingredients, steps, nutrition, source: packSource,
  });
}

/** IA4 exact pack — Betty Crocker's New Christmas Cookbook. Founder-cleared Oct 26; claim_go=false. */
export const BCX_RECIPES: Recipe[] = [
  h("bcx-001", "Divine Caramel Sauce", "American", ["section-book-betty-crocker-christmas"], "veg", "roast", 45, "Heat all ingredients except vanilla to boiling in heavy Dutch oven over medium heat, stirring constantly.", [I("sugar", 2, "cups", "Pantry"), I("light corn syrup", 1, "cups", "Pantry"), I("(1½ sticks) margarine or butter", 0.75, "cups", "Dairy & Eggs"), I("whipping (heavy) cream", 2, "cups", "Dairy & Eggs"), IN("Pinch of salt", 1, "", "Herbs & Spices"), I("vanilla", 1, "tsp", "Herbs & Spices")], ["Heat all ingredients except vanilla to boiling in heavy Dutch oven over medium heat, stirring constantly.", "Reduce heat slightly.", "Boil 30 minutes, stirring frequently, until sugar is dissolved and mixture is caramel colored.", "Stir in vanilla.", "Serve hot or warm.", "Store in refrigerator up to 2 months."], { cal: 0, protein: 0, carbs: 0, fat: 0 }),
  h("bcx-002", "Lemon Curd", "American", ["section-book-betty-crocker-christmas"], "eggs", "bowl", 45, "Mix sugar, lemon peel and lemon juice in heavy nonaluminum 1½-quart saucepan.", [I("sugar", 1, "cups", "Pantry"), I("finely grated lemon peel", 2, "tsp", "Produce"), I("lemon juice (about 5 large lemons)", 1, "cups", "Produce"), I("firm margarine or butter, cut up", 3, "tbsp", "Dairy & Eggs"), I("eggs, slightly beaten", 3, "", "Dairy & Eggs")], ["Mix sugar, lemon peel and lemon juice in heavy nonaluminum 1½-quart saucepan.", "Stir in margarine and eggs.", "Cook over medium heat about 8 minutes, stirring constantly, until mixture thickens and coats back of spoon (do not boil).", "Immediately pour into one 1-pint container or two 1-cup containers.", "Store covered in refrigerator up to 2 months."], { cal: 0, protein: 0, carbs: 0, fat: 0 }),
  h("bcx-003", "Coffee Liqueur", "American", ["section-book-betty-crocker-christmas"], "veg", "bowl", 45, "Mix all ingredients in 2-quart jar.", [I("vodka", 3, "cups", "Pantry"), I("water", 2, "cups", "Pantry"), I("granulated sugar", 2, "cups", "Pantry"), I("packed brown sugar", 2, "cups", "Pantry"), I("freeze-dried instant coffee (dry)", 0.666667, "cups", "Pantry"), I("vanilla bean or 1 teaspoon vanilla", 1, "", "Herbs & Spices")], ["Mix all ingredients in 2-quart jar.", "Cover tightly and let stand at room temperature 2 weeks.", "Remove vanilla bean.", "Pour liqueur into bottles and cork tightly."], { cal: 0, protein: 0, carbs: 0, fat: 0 }),
];
