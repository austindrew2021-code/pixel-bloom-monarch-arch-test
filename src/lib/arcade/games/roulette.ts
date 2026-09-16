/**
 * Roulette — a single-zero wheel, thirty-seven pockets.
 *
 * A real wheel keeps its house edge by paying a straight-up number 35 to 1 when
 * the true odds are 36 to 1. There is no house here and nothing is wagered, so
 * every bet pays exactly its own odds and all of them — the 1-in-37 number and
 * the near-even red — are worth the same.
 */

import type { SeedStream } from "./rng.ts";
import { TARGET_EV, type GameResult } from "./types.ts";

export const POCKETS = 37;

export const PARTICIPATION_POINTS = 9;
export const WIN_BASE = TARGET_EV - PARTICIPATION_POINTS;

/** Red pockets on a European wheel. */
export const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

export type BetKind =
  | "straight"
  | "red"
  | "black"
  | "odd"
  | "even"
  | "low"
  | "high"
  | "dozen"
  | "column";

export type Bet = {
  kind: BetKind;
  /** Straight: the pocket. Dozen/column: which one, 0-2. Ignored otherwise. */
  selection: number;
};

export type RouletteDetail = {
  bet: Bet;
  pocket: number;
  won: boolean;
  chance: number;
  participationPoints: number;
  winPoints: number;
};

/** Pockets a bet covers. Zero is covered by nothing but a straight bet on it. */
export function covers(bet: Bet, pocket: number): boolean {
  switch (bet.kind) {
    case "straight":
      return pocket === bet.selection;
    case "red":
      return RED.has(pocket);
    case "black":
      return pocket !== 0 && !RED.has(pocket);
    case "odd":
      return pocket !== 0 && pocket % 2 === 1;
    case "even":
      return pocket !== 0 && pocket % 2 === 0;
    case "low":
      return pocket >= 1 && pocket <= 18;
    case "high":
      return pocket >= 19 && pocket <= 36;
    case "dozen":
      return pocket >= bet.selection * 12 + 1 && pocket <= bet.selection * 12 + 12;
    case "column":
      return pocket !== 0 && (pocket - 1) % 3 === bet.selection;
    default:
      return false;
  }
}

/** How many of the thirty-seven pockets a bet covers. */
export function coverCount(bet: Bet): number {
  let count = 0;
  for (let pocket = 0; pocket < POCKETS; pocket += 1) if (covers(bet, pocket)) count += 1;
  return count;
}

export function isValidBet(bet: Bet): boolean {
  if (bet.kind === "straight") {
    return Number.isInteger(bet.selection) && bet.selection >= 0 && bet.selection < POCKETS;
  }
  if (bet.kind === "dozen" || bet.kind === "column") {
    return Number.isInteger(bet.selection) && bet.selection >= 0 && bet.selection < 3;
  }
  return (
    ["red", "black", "odd", "even", "low", "high"] as string[]
  ).includes(bet.kind);
}

export function winChance(bet: Bet): number {
  return coverCount(bet) / POCKETS;
}

/** Points a win pays — the reciprocal of its chance, so every bet is equal. */
export function winPoints(bet: Bet): number {
  const count = coverCount(bet);
  if (count <= 0) return 0;
  return Math.round((WIN_BASE * POCKETS) / count);
}

export function expectedPoints(bet: Bet): number {
  return PARTICIPATION_POINTS + winChance(bet) * winPoints(bet);
}

export function play(stream: SeedStream, bet: Bet): GameResult {
  if (!isValidBet(bet)) throw new Error("That is not a bet on this wheel.");
  const pocket = stream.nextInt(POCKETS);
  const won = covers(bet, pocket);
  const points = won ? winPoints(bet) : 0;

  const detail: RouletteDetail = {
    bet,
    pocket,
    won,
    chance: winChance(bet),
    participationPoints: PARTICIPATION_POINTS,
    winPoints: points,
  };
  return { points: PARTICIPATION_POINTS + points, detail: { ...detail } };
}

export const BYTE_BUDGET = 64;
