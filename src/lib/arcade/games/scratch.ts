/**
 * Scratch — a nine-cell card, three of a kind pays.
 *
 * Every symbol pays independently, so a card can carry two winners and they
 * simply add. That additivity is not just a rule choice: it makes the card's
 * value a sum of independent binomials, which is exactly computable, so the
 * paytable can be scaled onto the arcade's shared value without a simulation.
 */

import type { SeedStream } from "./rng.ts";
import { TARGET_EV, type GameResult } from "./types.ts";

export const CELLS = 9;

/** Symbol faces, lowest value first. */
export const FACES = ["◆", "●", "▲", "✿", "★", "♛"] as const;

/** Draw weights — the high symbols are the rare ones. */
export const WEIGHTS = [26, 22, 18, 14, 11, 9];

/** Relative pay per symbol, before the shared scale. */
export const VALUES = [1, 1.6, 2.6, 4.5, 9, 22];

/** Extra multiplier for a fourth cell and beyond. */
export function countMultiplier(count: number): number {
  if (count < 3) return 0;
  if (count === 3) return 1;
  // Four, five, six of a kind climb steeply — the reason to keep scratching.
  return 4 ** (count - 3);
}

export function symbolChance(symbol: number): number {
  const total = WEIGHTS.reduce((a, b) => a + b, 0);
  return (WEIGHTS[symbol] ?? 0) / total;
}

function choose(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let result = 1;
  for (let i = 0; i < Math.min(k, n - k); i += 1) result = (result * (n - i)) / (i + 1);
  return Math.round(result);
}

/** Chance a given symbol lands on exactly `count` of the nine cells. */
export function countChance(symbol: number, count: number): number {
  const p = symbolChance(symbol);
  return choose(CELLS, count) * p ** count * (1 - p) ** (CELLS - count);
}

/** Expected pay weight of a card, summed over every symbol independently. */
export function expectedWeight(): number {
  let total = 0;
  for (let symbol = 0; symbol < FACES.length; symbol += 1) {
    for (let count = 3; count <= CELLS; count += 1) {
      total += countChance(symbol, count) * (VALUES[symbol] ?? 0) * countMultiplier(count);
    }
  }
  return total;
}

/** Points per unit of weight, putting the card on the shared value. */
export function scale(): number {
  const weight = expectedWeight();
  return weight > 0 ? TARGET_EV / weight : 0;
}

export function symbolPoints(symbol: number, count: number): number {
  const weight = (VALUES[symbol] ?? 0) * countMultiplier(count);
  if (weight <= 0) return 0;
  return Math.max(1, Math.round(weight * scale()));
}

/**
 * Rough chance a card pays anything, for the info line only.
 *
 * Symbol counts on one card are multinomial and so slightly anti-correlated —
 * cells spent on one symbol are cells the others cannot have — and this treats
 * them as independent. That makes it an approximation, which is fine for a
 * displayed percentage and is deliberately kept out of the value calculation:
 * `expectedWeight` sums each symbol's contribution separately and is exact by
 * linearity of expectation, needing no independence assumption at all.
 */
export function hitChance(): number {
  let noneChance = 1;
  for (let symbol = 0; symbol < FACES.length; symbol += 1) {
    let under = 0;
    for (let count = 0; count < 3; count += 1) under += countChance(symbol, count);
    noneChance *= under;
  }
  return 1 - noneChance;
}

export type ScratchWin = { symbol: number; count: number; points: number };

export type ScratchDetail = {
  cells: number[];
  wins: ScratchWin[];
  points: number;
};

export function play(stream: SeedStream): GameResult {
  const cells: number[] = [];
  for (let i = 0; i < CELLS; i += 1) cells.push(stream.nextWeighted(WEIGHTS));

  const counts = new Array<number>(FACES.length).fill(0);
  for (const cell of cells) counts[cell] += 1;

  const wins: ScratchWin[] = [];
  let points = 0;
  counts.forEach((count, symbol) => {
    if (count < 3) return;
    const won = symbolPoints(symbol, count);
    wins.push({ symbol, count, points: won });
    points += won;
  });

  const detail: ScratchDetail = { cells, wins, points };
  return { points, detail: { ...detail } };
}

export const BYTE_BUDGET = CELLS * 4 + 64;
