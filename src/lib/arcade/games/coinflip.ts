/**
 * Coin Match — flip two to five coins; every coin landing the same way pays.
 *
 * Adding a coin halves the chance of a clean sweep and raises the bonus to
 * exactly compensate, so the expected value is the same 99 points whichever
 * number a player picks. The choice is variance, never edge: two coins is a
 * near-even shot at a modest bonus, five coins is a 1-in-16 shot at a large
 * one. Nobody can pick "the good option", because there isn't one.
 */

import type { SeedStream } from "./rng.ts";
import { TARGET_EV, type GameResult } from "./types.ts";

export const MIN_COINS = 2;
export const MAX_COINS = 5;

/** Points awarded per coin regardless of outcome, so no round is a blank. */
export const POINTS_PER_COIN = 10;

/**
 * Bonus for every coin matching, by coin count.
 *
 * Chosen so `POINTS_PER_COIN * n + bonus / 2^(n-1)` lands exactly on 99 for
 * every n — the probability of a sweep with n coins is 2/2^n.
 */
export const MATCH_BONUS: Readonly<Record<number, number>> = {
  2: 158,
  3: 276,
  4: 472,
  5: 784,
};

export type CoinFlipDetail = {
  coins: number;
  /** 'H' / 'T' per coin, in flip order. */
  faces: string;
  matched: boolean;
  basePoints: number;
  bonusPoints: number;
};

export function isValidCoinCount(coins: number): boolean {
  return Number.isInteger(coins) && coins >= MIN_COINS && coins <= MAX_COINS;
}

/** Probability that all n coins land the same way. */
export function sweepChance(coins: number): number {
  return 2 / 2 ** coins;
}

/** Closed-form expected points, used by the tests to pin the tuning. */
export function expectedPoints(coins: number): number {
  return POINTS_PER_COIN * coins + (MATCH_BONUS[coins] ?? 0) * sweepChance(coins);
}

export function play(stream: SeedStream, coins: number): GameResult {
  if (!isValidCoinCount(coins)) {
    throw new Error(`coins must be ${MIN_COINS}–${MAX_COINS}, got ${coins}`);
  }
  let faces = "";
  for (let i = 0; i < coins; i += 1) {
    faces += stream.nextInt(2) === 0 ? "H" : "T";
  }
  const matched = faces === faces[0]!.repeat(coins);
  const basePoints = POINTS_PER_COIN * coins;
  const bonusPoints = matched ? (MATCH_BONUS[coins] ?? 0) : 0;

  const detail: CoinFlipDetail = { coins, faces, matched, basePoints, bonusPoints };
  return { points: basePoints + bonusPoints, detail: { ...detail } };
}

/** Byte budget: one 4-byte draw per coin, plus slack for rejection resampling. */
export const BYTE_BUDGET = MAX_COINS * 4 + 32;

export const TUNED_EV = TARGET_EV;
