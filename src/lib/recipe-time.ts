import { formatMinutes } from "./format.ts";
import { printedMinutes } from "./cook-steps.ts";
import type { Recipe } from "./types";

export { printedMinutes };

/**
 * Printed-book recipes carry a catalog default of 45 minutes (1,108 of 1,539 live ones) that the
 * book never printed. That number is a made-up fact, so it is shown only when the recipe's own
 * printed text gives one total time. Non-book (app-authored) recipes are unchanged.
 *
 * "Prints its own total time" has ONE definition: `printedMinutes` in cook-steps.ts (also used by the
 * description fallback "<Name> — homemade, about N minutes."). It is imported and re-exported here, not copied.
 */
export const CATALOG_DEFAULT_MINUTES = 45;

type Timed = Pick<Recipe, "minutes"> & Partial<Pick<Recipe, "steps" | "description" | "source">>;

/** True for the recipes whose stored minutes is the made-up catalog default. */
export function hasPlaceholderMinutes(recipe: Timed): boolean {
  return Boolean(recipe.source?.book) && recipe.minutes === CATALOG_DEFAULT_MINUTES;
}

/** Minutes to show on a time chip or in cook-time text; null = show nothing. */
export function shownMinutes(recipe: Timed): number | null {
  if (!hasPlaceholderMinutes(recipe)) return recipe.minutes;
  return printedMinutes(recipe as Recipe);
}

/** "45 min" / "1h 30m", or null when the chip is hidden. */
export function timeLabel(recipe: Timed): string | null {
  const n = shownMinutes(recipe);
  return n === null ? null : formatMinutes(n);
}

/** Same as `timeLabel` for a resolved plan meal: custom meals, skips and the empty state are untouched. */
export function resolvedTimeLabel(resolved: { minutes: number; recipe?: Timed }): string | null {
  return resolved.recipe ? timeLabel(resolved.recipe) : formatMinutes(resolved.minutes);
}

/** Joins the parts that exist with " · " (a hidden chip leaves no dangling separator). */
export function dotJoin(...parts: (string | null | undefined | false)[]): string {
  return parts.filter(Boolean).join(" · ");
}
