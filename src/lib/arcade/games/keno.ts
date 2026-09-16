/**
 * Keno — pick your numbers from forty, ten are drawn.
 *
 * How many you pick is the variance dial: one number hits a quarter of the time
 * for a small return, ten numbers almost never hit five but pay enormously when
 * they do. The value is identical either way, because each pick count gets its
 * own scale computed from the exact hypergeometric odds of matching.
 */

import type { SeedStream } from "./rng.ts";
import { TARGET_EV, type GameResult } from "./types.ts";

export const POOL = 40;
export const DRAWN = 10;
export const MAX_PICKS = 10;

/**
 * Matches needed to pay, by how many numbers were picked. Picking more numbers
 * demands proportionally more of them, which is what makes a big pick rare
 * rather than merely slower.
 */
export const THRESHOLDS: Readonly<Record<number, number>> = {
  1: 1, 2: 2, 3: 2, 4: 3, 5: 3, 6: 4, 7: 4, 8: 5, 9: 5, 10: 6,
};

export function isValidPickCount(picks: number): boolean {
  return Number.isInteger(picks) && picks >= 1 && picks <= MAX_PICKS;
}

/** Binomial coefficient, exact for this pool size. */
export function choose(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let result = 1;
  for (let i = 0; i < Math.min(k, n - k); i += 1) {
    result = (result * (n - i)) / (i + 1);
  }
  return Math.round(result);
}

/**
 * Hypergeometric: the chance that exactly `matches` of your `picks` are among
 * the ten drawn from forty.
 */
export function matchChance(picks: number, matches: number): number {
  if (matches < 0 || matches > picks || matches > DRAWN) return 0;
  return (
    (choose(picks, matches) * choose(POOL - picks, DRAWN - matches)) / choose(POOL, DRAWN)
  );
}

/** Relative payout weight before the pick count's scale is applied. */
export function payWeight(picks: number, matches: number): number {
  const threshold = THRESHOLDS[picks] ?? picks;
  if (matches < threshold) return 0;
  // Each match beyond the threshold is worth several times the last, which is
  // what makes a full card the moment the game is played for.
  return 4 ** (matches - threshold);
}

/** Points per unit of weight for a pick count, so every count pays the same. */
export function pickScale(picks: number): number {
  let weighted = 0;
  for (let matches = 0; matches <= picks; matches += 1) {
    weighted += matchChance(picks, matches) * payWeight(picks, matches);
  }
  return weighted > 0 ? TARGET_EV / weighted : 0;
}

export function matchPoints(picks: number, matches: number): number {
  const weight = payWeight(picks, matches);
  if (weight <= 0) return 0;
  return Math.max(1, Math.round(weight * pickScale(picks)));
}

/** Exact expected points for a pick count. */
export function expectedPoints(picks: number): number {
  let total = 0;
  for (let matches = 0; matches <= picks; matches += 1) {
    total += matchChance(picks, matches) * matchPoints(picks, matches);
  }
  return total;
}

/** Chance a card pays anything. */
export function hitChance(picks: number): number {
  const threshold = THRESHOLDS[picks] ?? picks;
  let chance = 0;
  for (let matches = threshold; matches <= picks; matches += 1) {
    chance += matchChance(picks, matches);
  }
  return chance;
}

export type KenoDetail = {
  picks: number[];
  drawn: number[];
  matched: number[];
  points: number;
};

/**
 * Draw ten distinct numbers with a partial Fisher–Yates shuffle, so the draw
 * never needs a retry loop and its entropy use stays fixed.
 */
export function drawNumbers(stream: SeedStream): number[] {
  const pool = Array.from({ length: POOL }, (_, i) => i + 1);
  for (let i = 0; i < DRAWN; i += 1) {
    const j = i + stream.nextInt(POOL - i);
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  return pool.slice(0, DRAWN).sort((a, b) => a - b);
}

export function play(stream: SeedStream, picks: readonly number[]): GameResult {
  const unique = [...new Set(picks)];
  if (unique.length !== picks.length) throw new Error("Pick each number once.");
  if (!isValidPickCount(unique.length)) {
    throw new Error(`Pick between 1 and ${MAX_PICKS} numbers.`);
  }
  for (const pick of unique) {
    if (!Number.isInteger(pick) || pick < 1 || pick > POOL) {
      throw new Error(`Numbers run from 1 to ${POOL}.`);
    }
  }

  const drawn = drawNumbers(stream);
  const drawnSet = new Set(drawn);
  const matched = unique.filter((pick) => drawnSet.has(pick)).sort((a, b) => a - b);
  const points = matchPoints(unique.length, matched.length);

  const detail: KenoDetail = {
    picks: [...unique].sort((a, b) => a - b),
    drawn,
    matched,
    points,
  };
  return { points, detail: { ...detail } };
}

/** One draw per number taken, plus slack for rejection resampling. */
export const BYTE_BUDGET = DRAWN * 4 + 128;
