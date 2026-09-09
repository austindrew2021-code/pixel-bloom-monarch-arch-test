import { shiftWeek, weekDates } from "./week.ts";

/**
 * The week, told back to the cook.
 *
 * A recap is the cheapest retention there is: it costs nothing, it arrives when
 * the work is already done, and it is the one moment in the week a cook is glad
 * to be interrupted. It is also the only screen in the app worth screenshotting
 * for someone else, which is how a kitchen app spreads.
 *
 * Everything here is derived from what already happened. Nothing is estimated
 * upward, nothing is padded, and a bad week says so — a recap that congratulates
 * a cook for a week they know they missed is worth less than no recap at all.
 */

export type WeekRecap = {
  weekStart: string;
  /** Nights actually cooked. */
  cooked: number;
  /** Dinners that were planned, cooked or not. */
  plated: number;
  takeout: number;
  /** Dollars kept versus ordering the same plates in. */
  saved: number;
  /** Distinct proteins across the week — the anti-rut number. */
  variety: number;
  /** The longest unbroken run of nights inside the week. */
  bestRun: number;
  /** Nights cooked the week before, for the comparison line. */
  cookedLastWeek: number;
  /** The dish the cook came back to most. */
  favourite: string | null;
};

export type RecapInput = {
  weekStart: string;
  cookedDates: string[];
  /** Title and protein per cooked night, in date order. */
  nights: { date: string; title: string; protein?: string; saved: number; takeout: boolean }[];
};

/**
 * The longest unbroken run of cooked nights inside the week.
 *
 * Not the live streak: a cook who did Monday through Thursday and took the
 * weekend off has a live streak of zero by Sunday, and telling them "4 nights
 * cooked · streak 0" in the same breath reads like a scolding for a good week.
 * The run inside the week is the number that matches what they remember doing.
 */
function longestRun(dates: string[], cookedDates: string[]): number {
  const cooked = new Set(cookedDates);
  let best = 0;
  let run = 0;
  for (const date of dates) {
    run = cooked.has(date) ? run + 1 : 0;
    if (run > best) best = run;
  }
  return best;
}

export function buildRecap(input: RecapInput): WeekRecap {
  const dates = new Set(weekDates(input.weekStart));
  const lastWeek = new Set(weekDates(shiftWeek(input.weekStart, -1)));
  const mine = input.nights.filter((n) => dates.has(n.date));
  const cooked = [...dates].filter((d) => input.cookedDates.includes(d)).length;

  const counts = new Map<string, number>();
  for (const night of mine) {
    if (night.takeout || !night.title) continue;
    counts.set(night.title, (counts.get(night.title) ?? 0) + 1);
  }
  // Only call something a favourite if it actually repeated.
  let favourite: string | null = null;
  let best = 1;
  for (const [title, n] of counts) {
    if (n > best) {
      best = n;
      favourite = title;
    }
  }

  return {
    weekStart: input.weekStart,
    cooked,
    plated: mine.filter((n) => !n.takeout).length,
    takeout: mine.filter((n) => n.takeout).length,
    // Only nights that were really cooked saved anything.
    saved: Math.round(
      mine.filter((n) => !n.takeout && input.cookedDates.includes(n.date)).reduce((sum, n) => sum + n.saved, 0),
    ),
    variety: new Set(mine.filter((n) => !n.takeout && n.protein).map((n) => n.protein)).size,
    bestRun: longestRun([...dates].sort(), input.cookedDates),
    cookedLastWeek: [...lastWeek].filter((d) => input.cookedDates.includes(d)).length,
    favourite,
  };
}

/**
 * The headline. Written to be true on a bad week as well as a good one — a
 * cook who missed the week is told plainly, and invited back rather than
 * scolded.
 */
export function recapHeadline(recap: WeekRecap): string {
  if (recap.cooked === 0) return "A week off the stove";
  if (recap.cooked >= 6) return "You cooked nearly every night";
  if (recap.cooked > recap.cookedLastWeek) return `${recap.cooked} nights — up from ${recap.cookedLastWeek}`;
  if (recap.cooked === recap.cookedLastWeek) return `${recap.cooked} nights, same as last week`;
  return `${recap.cooked} night${recap.cooked === 1 ? "" : "s"} at the stove`;
}

/** The one line worth sending to somebody. Kept short enough to paste. */
export function recapShareText(recap: WeekRecap): string {
  if (recap.cooked === 0) return "A week off the stove. Next week is a fresh one. — Spoonful";
  const bits = [`${recap.cooked} nights cooked`];
  if (recap.saved > 0) bits.push(`$${recap.saved} kept out of takeout`);
  if (recap.bestRun > 1) bits.push(`${recap.bestRun} nights in a row`);
  return `${bits.join(" · ")} — Spoonful`;
}

/**
 * Whether to surface the recap at all.
 *
 * Shown from Sunday evening through Monday, once per week, and never for a week
 * with nothing in it — an empty recap for a cook who never started is a nag,
 * not a summary.
 */
export function recapDue(input: {
  weekStart: string;
  lastSeenWeek: string;
  recap: WeekRecap;
  now?: Date;
}): boolean {
  if (input.lastSeenWeek === input.weekStart) return false;
  if (input.recap.cooked === 0 && input.recap.plated === 0) return false;
  const now = input.now ?? new Date();
  const day = now.getDay();
  const sundayEvening = day === 0 && now.getHours() >= 17;
  return sundayEvening || day === 1;
}
