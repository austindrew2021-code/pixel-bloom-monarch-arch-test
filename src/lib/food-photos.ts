import { FOOD_PHOTO_FILES } from "./generated/food-photo-files.ts";
import type { Recipe } from "./types";

/**
 * The photograph of a dish.
 *
 * Resolution order, most specific first:
 *
 *  1. `public/food/{id}.jpg` — a photograph of THIS dish. The list of what
 *     exists is generated from the directory (`npm run photos`), because the
 *     hand-typed map this replaced had drifted badly: 655 files were on disk,
 *     250 were wired up, and 234 dishes had a photograph of themselves that
 *     the app never showed.
 *  2. A `photo` the catalog set explicitly — a shared shot for a dish with no
 *     picture of its own.
 *  3. The plate's stock photo, so a card is never empty.
 *
 * Never a generated image. A picture of the wrong dish is worse than a plate
 * glyph: it tells the cook something untrue about what they are making.
 */

const PLATE_PHOTO: Record<string, string> = {
  roast: "/food/roast.jpg",
  pasta: "/food/pasta.jpg",
  bowl: "/food/bowl.jpg",
  fish: "/food/whitefish.jpg",
  soup: "/food/soup.jpg",
  taco: "/food/taco.jpg",
  green: "/food/green.jpg",
  skillet: "/food/skillet.jpg",
  curry: "/food/curry.jpg",
  toast: "/food/toast.jpg",
  dessert: "/food/pie.jpg",
};

/** True when this dish has a photograph of its own, not a stand-in. */
export function hasOwnPhoto(recipe: Pick<Recipe, "id"> & { photo?: string }): boolean {
  return Boolean(FOOD_PHOTO_FILES[recipe.id] || recipe.photo);
}

export function photoFor(recipe: Pick<Recipe, "id" | "name" | "plate" | "tags"> & { photo?: string }): string {
  const own = FOOD_PHOTO_FILES[recipe.id];
  if (own) return `/food/${own}`;
  if (recipe.photo) return recipe.photo;
  return PLATE_PHOTO[recipe.plate] ?? "/food/bowl.jpg";
}

/**
 * What a card should actually show.
 *
 * This is the rule the UI follows, kept here so a test can hold it: a dish is
 * illustrated by a photograph of itself, or by the drawn plate — never by a
 * photograph of some other dish. `photoFor` will happily hand back the stock
 * plate photo, and that is how skillet cornbread came to be illustrated with a
 * slice of avocado toast: both are plated as "toast", so the fallback looked
 * like an answer. A cook reads a photo as a picture of what they are making.
 */
export function photoOrPlate(
  recipe: Pick<Recipe, "id" | "name" | "plate" | "tags"> & { photo?: string },
): { kind: "photo"; src: string } | { kind: "plate" } {
  return hasOwnPhoto(recipe) ? { kind: "photo", src: photoFor(recipe) } : { kind: "plate" };
}

/**
 * A dish name alone is not enough to find a picture of it.
 *
 * Searching the title is how a Chow Chow dog ended up illustrating Mrs.
 * Fisher's chow-chow, an iceberg the iceberg wedge, and Nicolas Maduro the
 * maduros. The cuisine and the two or three foods the dish is actually made of
 * disambiguate all three, so the search phrase carries them.
 */
export function photoSearchPhrase(
  recipe: Pick<Recipe, "name" | "cuisine" | "ingredients">,
): string {
  const foods = recipe.ingredients
    .slice(0, 3)
    .map((i) => i.name.toLowerCase().replace(/\b(fresh|dried|ground|chopped|large|small)\b/g, "").trim())
    .filter(Boolean);
  return [recipe.cuisine, recipe.name, "cooked dish", ...foods, "food photograph"]
    .filter(Boolean)
    .join(" ");
}

/** The photo files a dish still needs, and enough about it to find the right one. */
export function dishesWithoutPhotos<
  T extends Pick<Recipe, "id" | "name" | "plate" | "description" | "cuisine" | "ingredients"> & { photo?: string },
>(recipes: readonly T[]): {
  id: string;
  name: string;
  plate: string;
  wants: string;
  search: string;
  description: string;
}[] {
  return recipes
    .filter((r) => !hasOwnPhoto(r))
    .map((r) => ({
      id: r.id,
      name: r.name,
      plate: r.plate,
      wants: `public/food/${r.id}.jpg`,
      search: photoSearchPhrase(r),
      description: r.description,
    }));
}
