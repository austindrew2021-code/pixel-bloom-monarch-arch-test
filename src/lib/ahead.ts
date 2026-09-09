import { isSauceLike } from "./diet.ts";
import type { Recipe } from "./types";

/**
 * How long before you want to eat this you have to start it.
 *
 * `minutes` is hands-on time, which is the right thing to filter on — nobody
 * wants overnight oats excluded from a 15-minute search because of six hours
 * of sitting in the fridge. But it is the wrong thing to plan tonight's dinner
 * on: 52 dishes carry a step that waits far longer than their stated time,
 * and the worst of them says 40 minutes over a salt cod that needs twelve
 * hours of soaking first.
 *
 * So the wait is read out of the method and shown beside the time rather than
 * folded into it.
 */

/** Words that mean "and now leave it", with the hours they usually mean. */
const WAITS: [RegExp, number][] = [
  [/\bovernight\b/i, 8],
  [/\b(\d+)\s*(?:to\s*\d+\s*)?days?\b/i, 24],
  [/\b(\d+)\s*(?:to\s*\d+\s*)?hours?\b/i, 1],
];

/** True when the step is a wait, not work — soaking, chilling, rising, curing. */
const UNATTENDED =
  /\b(soak|chill|refrigerate|marinate|rest|rise|proof|prove|cure|brine|set|freeze|steep|ferment|sit|stand|cool completely|overnight)\b/i;

/**
 * Hours to start ahead, or 0 when the dish can be cooked start to finish.
 * Only unattended waits count: an hour of simmering is cooking, not waiting.
 */
export function startAheadHours(recipe: Pick<Recipe, "steps" | "minutes">): number {
  let longest = 0;
  for (const step of recipe.steps) {
    if (!UNATTENDED.test(step)) continue;
    for (const [pattern, unitHours] of WAITS) {
      const match = pattern.exec(step);
      if (!match) continue;
      const hours = match[1] ? Number(match[1]) * unitHours : unitHours;
      if (Number.isFinite(hours)) longest = Math.max(longest, hours);
      break;
    }
  }
  // A wait already covered by the stated time is not something to warn about.
  return longest * 60 > recipe.minutes ? longest : 0;
}

/** "Start 8h ahead", or null when there is nothing to say. */
export function startAheadLabel(recipe: Recipe): string | null {
  // A rub or a sauce is a component. Its own method takes minutes; the
  // overnight rest belongs to the meat it goes on, not to the jar of spices.
  if (isSauceLike(recipe)) return null;
  const hours = startAheadHours(recipe);
  if (!hours) return null;
  if (hours >= 24) return `Start ${Math.round(hours / 24)} day${hours >= 48 ? "s" : ""} ahead`;
  if (hours >= 8) return "Start the night before";
  return `Start ${hours}h ahead`;
}
