/**
 * Catalog-final recipes (Kitchen decision, Oct 9 2026).
 *
 * Every printed archive-book recipe and every Spoonful Kitchen recipe
 * (vh-*, ar-ff-*, ar-mf-*, ar-gt-*, so-*, fd-*, hill-*, kleber-*, ac-*, cris-*,
 * ys-*, idah-* …) carries a `source` object naming the book it was printed in.
 * Their catalog text is final: the method polisher, the list aligner and the
 * render-time step rewriter must leave name, description, rows and steps
 * exactly as the catalog has them. The app's own recipes (no `source`) keep the
 * polish.
 *
 * The marker is `source.book`, not an id prefix or a tag: `ar-fried-catfish`
 * is an Arkansas place recipe, `wg-*` are app wild-game recipes, and
 * `sl-waldorf` carries a `book-hill-salads` tag without being a printed record.
 * Southern recipes get their `source` from `withSource` in recipes.ts before
 * the polish runs.
 */
import type { Ingredient, Recipe } from "./types";
import { isCorrectedScreenFood } from "./catalog-final-corrections.ts";

export function isCatalogFinal(recipe: { source?: { book?: string } | null } | null | undefined): boolean {
  return Boolean(recipe?.source?.book);
}

/**
 * Allergen / diet screen for catalog-final recipes (Kitchen decision, Oct 9 2026).
 *
 * The card, Cook and Shop show a printed recipe exactly as cataloged: the row
 * adder (`alignListToCook`) and the polisher no longer touch it. But the diet
 * tags, the gluten-free filter and badge, and the allergy shield are worked out
 * from ingredient names, so "Melt the butter" in a method whose list never says
 * butter would newly pass dairy-free. For an allergy that is unacceptable.
 *
 * So `polishCatalog` still runs the old polish on every catalog-final recipe
 * (`screenRecipe` in cook-steps.ts), runs the row adder over the printed
 * method too, and keeps what they would have added — the rows the row adder
 * found in the steps, the cleaned name and the polished method — on
 * `dietScreen`. Nothing displays it. Every diet and allergy check
 * reads `withDietScreen(recipe)`: the printed rows PLUS those foods. The checks
 * therefore see everything they saw before the bypass, and more, so the bypass
 * can only take a pass away, never grant one.
 */
export type DietScreen = {
  /** The name the polisher would have shown, when it differs from the printed one. */
  name?: string;
  /** Rows the row adder / polisher would have listed (from the polished or the printed method) that the printed rows lack. */
  foods: Ingredient[];
  /** Polished method lines that differ from the printed ones (for step-reading checks). */
  steps: string[];
  /** The printed blurb when the card shows a shorter one (cut at a sentence end, or the plain fallback): the checks read the whole of it. */
  description?: string;
};

/**
 * What the old polish produced (`polished`, its rows, name and method) plus the
 * rows the row adder finds in the PRINTED method (`printedAligned`; the polisher
 * often rewrites a short printed method, so its own pass can miss "dress with
 * melted butter"), minus what is already printed. Empty screen -> undefined.
 */
export function dietScreenFor(
  printed: Recipe,
  polished: Recipe | null,
  printedAligned?: Recipe | null,
): DietScreen | undefined {
  const rows = new Set(printed.ingredients.map((i) => i.name.trim().toLowerCase()));
  const lines = new Set(printed.steps);
  const foods: Ingredient[] = [];
  for (const i of [...(polished?.ingredients ?? []), ...(printedAligned?.ingredients ?? [])]) {
    const key = i.name.trim().toLowerCase();
    if (rows.has(key)) continue;
    // Listed corrections only (catalog-final-corrections.ts): the printed
    // method names the food to say it is NOT used.
    if (isCorrectedScreenFood(printed.id, i.name)) continue;
    rows.add(key);
    foods.push(i);
  }
  const steps = (polished?.steps ?? []).filter((s) => !lines.has(s));
  const name = polished && polished.name !== printed.name ? polished.name : undefined;
  if (!foods.length && !steps.length && name === undefined) return undefined;
  return name === undefined ? { foods, steps } : { name, foods, steps };
}

/**
 * The recipe as the diet and allergy checks must read it: printed rows plus the
 * screened foods, printed steps plus the polished ones, and both names (pipe-
 * joined, so no pattern spans them). Never shown. Idempotent.
 */
export function withDietScreen<R extends Recipe>(recipe: R): R {
  const screen = recipe.dietScreen;
  if (!screen) return recipe;
  return {
    ...recipe,
    name: screen.name === undefined ? recipe.name : `${recipe.name} | ${screen.name}`,
    ingredients: [...recipe.ingredients, ...screen.foods],
    steps: [...(recipe.steps ?? []), ...screen.steps],
    description: screen.description === undefined ? recipe.description : `${recipe.description} | ${screen.description}`,
    dietScreen: undefined,
  };
}

/**
 * App-written repairs to a few printed-book method lines whose text carries a
 * print/OCR artifact (Line audit Oct 17). Nothing here changes a quantity, a
 * food or a time; it only fixes punctuation, a capital letter or a chopped
 * leading word that the book's own page text shows (the plant-based book's
 * page margin cut the first words of some lines; the cut words are visible
 * in the neighbouring OCR lines, e.g. "Ina" + "small bowl").
 *
 * Generic rules (every catalog-final method line):
 *  1. "(238 degrees F.)." -> "(238 degrees F)." (a closing ".)." is two stops)
 *  2. a one-letter unit abbreviation (C, T, c, t, F) before a lowercase word loses its stop
 *     ("1/2 C. rice" -> "1/2 C rice", "350 degrees F. for" -> "350 degrees F for"),
 *     so no reader or splitter takes "C." for the end of a sentence
 * Plus the per-id table below (a lowercase line start or a chopped lead word; matched
 * at the start of the line, so a repair never applies twice). A lowercase start is NOT
 * capitalized by a blanket rule: some printed methods are split mid-sentence on purpose.
 */
const BOOK_STEP_FIXES: Record<string, [string, string, boolean?][]> = {
  "trp-040": [["in a slow cooker", "In a slow cooker"], ["ingredients. simmer, covered", "ingredients. Simmer, covered", true]],
  "plnt-007": [
    ["ard water cashews soaked in", "Discard water cashews soaked in"],
    ["small bowl, place porcini", "In a small bowl, place porcini"],
    ["porcini mushrooms, cremini mushrooms, white button", "Add porcini mushrooms, cremini mushrooms, white button"],
    ["aze the pan with white wine", "Deglaze the pan with white wine"],
  ],
  "plnt-014": [["n separate shallow bowls", "In separate shallow bowls"], ["in a large fry pan", "In a large fry pan"]],
  "plnt-075": [["in a large frying pan", "In a large frying pan"]],
  "plnt-076": [["in a large bowl, whisk together", "In a large bowl, whisk together"]],
  "plnt-065": [
    ["pan over medium-high heat, heat extra-virgin olive oil", "In a medium sauté pan over medium-high heat, heat extra-virgin olive oil"],
    ["ture over beans, stir gently", "Pour vegetable mixture over beans, stir gently"],
  ],
  "plnt-091": [["speed, cream butter and confectioners", "Meanwhile, in a medium bowl and using an electric mixer on medium speed, cream butter and confectioners"]],
};

export function fixBookStep(step: string): string {
  let s = step
    .replace(/\.\)\.(?=\s|$)/g, ").")
    .replace(/(?<![^\s])([CTctF])\. (?=[a-z])/g, "$1 ");
  return s;
}

/** The recipe with its printed method lines repaired (same object when nothing changes). */
export function fixBookSteps<R extends Recipe>(recipe: R): R {
  if (!isCatalogFinal(recipe) || !recipe.steps?.length) return recipe;
  const table = BOOK_STEP_FIXES[recipe.id] ?? [];
  const steps = recipe.steps.map((line) => {
    let s = line;
    for (const [from, to, anywhere] of table) {
      if (s.startsWith(from)) s = to + s.slice(from.length);
      else if (anywhere && s.includes(from)) s = s.replace(from, to);
    }
    return fixBookStep(s);
  });
  return steps.some((s, i) => s !== recipe.steps[i]) ? { ...recipe, steps } : recipe;
}
