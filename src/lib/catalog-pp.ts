import { I, IN, dish } from "./catalog-kit.ts";
import type { Recipe, RecipeSource } from "./types";

const packSource: RecipeSource = {
  book: "The Pumpkin Patch Cookbook (Third Edition)",
  author: "Pumpkin Patch",
  year: 2010,
  era: "2010s",
  archiveId: "the-pumpkin-patch-cookbook-third-edition",
  credit: "The Pumpkin Patch Cookbook (Third Edition, 2010). Internet Archive the-pumpkin-patch-cookbook-third-edition. Founder-cleared free use. Exact ingredients and method as printed.",
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
    tags: Array.from(new Set(["vintage", "book-pumpkin-patch", "era-2010s", ...tags])),
    ingredients, steps, nutrition, source: packSource,
  });
}

/** IA4 exact pack — The Pumpkin Patch Cookbook (Third Edition). Founder-cleared Oct 26; claim_go=false. */
export const PP_RECIPES: Recipe[] = [
  h("pp-001", "Pumpkin Sweet Pickles", "American", ["section-book-pumpkin-patch"], "veg", "dessert", 45, "Mix sugar, cloves, vinegar, water and cinnamon pieces in a large sauce pan.", [I("Pumpkin", 5, "lb", "Produce"), I("Sugar", 2, "lb", "Pantry"), I("Cloves", 6, "", "Pantry"), I("White Vinegar", 1, "pt", "Pantry"), I("Water", 1, "pt", "Pantry"), I("pieces of cinnamon", 3, "", "Herbs & Spices")], ["Mix sugar, cloves, vinegar, water and cinnamon pieces in a large sauce pan.", "Heat until sugar dissolves.", "Drop cubes of pumpkin in syrup and cook 45-60 minutes, or until clear and glossy.", "Remove cubes and put in jars.", "Pour syrup over the pumpkin and seal."], { cal: 0, protein: 0, carbs: 0, fat: 0 }),
  h("pp-002", "Spiced Pickled Pumpkin", "American", ["section-book-pumpkin-patch"], "veg", "bowl", 45, "Place pumpkin in a kettle. Tie spices in cheesecloth.", [I("Pumpkin, cubed", 5, "lb", "Produce"), I("Whole Cloves", 1, "tsp", "Pantry"), I("Broken Cinnamon Stick", 1, "tbsp", "Herbs & Spices"), I("Vinegar", 1, "qt", "Pantry"), I("Sugar", 2, "lb", "Pantry")], ["Place pumpkin in a kettle. Tie spices in cheesecloth.", "Add to vinegar with sugar, heat to boiling and boil 5 minutes. Pour over pumpkin. Cook pumpkin in syrup until tender. Place in sterile jars, cover with vinegar syrup and seal at once."], { cal: 0, protein: 0, carbs: 0, fat: 0 }),
];
