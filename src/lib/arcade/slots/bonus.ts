/**
 * When a win earns a takeover.
 *
 * Thresholds are multiples of what an average play is worth rather than flat
 * point totals, so they mean the same thing on every title in the catalogue —
 * a low-volatility three-reel game and a 4096-ways game celebrate at the same
 * point relative to their own pace, which they would not if the bar were a
 * fixed number.
 */

export type BonusKind = "free-spins" | "big-win" | "mega-win";

/** Multiples of the shared per-play value at which each takeover fires. */
export const BIG_WIN_MULTIPLE = 8;
export const MEGA_WIN_MULTIPLE = 25;

export function bonusFor(
  points: number,
  target: number,
  featureTriggered: boolean,
): BonusKind | null {
  // Free spins always take over, whatever they end up paying: the feature
  // landing is the moment, not the total.
  if (featureTriggered) return "free-spins";
  if (points >= target * MEGA_WIN_MULTIPLE) return "mega-win";
  if (points >= target * BIG_WIN_MULTIPLE) return "big-win";
  return null;
}
