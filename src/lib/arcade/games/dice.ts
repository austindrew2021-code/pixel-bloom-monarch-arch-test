/**
 * Dice — roll 0.00 to 99.99 and call it under or over a line you set.
 *
 * The staple provably-fair game, and the clearest demonstration of the rule the
 * arcade runs on: the win pays exactly one over its own probability, so a 2%
 * shot and a 98% shot are worth the same. The line is a variance dial and
 * nothing else.
 */

import type { SeedStream } from "./rng.ts";
import { TARGET_EV, type GameResult } from "./types.ts";

/** Rolls are hundredths, so the outcome space is exactly 10,000 values. */
export const ROLL_RANGE = 10_000;

export const MIN_TARGET = 2;
export const MAX_TARGET = 98;

/** Paid whatever the roll does, so no round is a blank. */
export const PARTICIPATION_POINTS = 9;
export const WIN_BASE = TARGET_EV - PARTICIPATION_POINTS;

export type Direction = "under" | "over";

export type DiceDetail = {
  target: number;
  direction: Direction;
  roll: number;
  won: boolean;
  chance: number;
  participationPoints: number;
  winPoints: number;
};

export function isValidTarget(target: number): boolean {
  return Number.isInteger(target) && target >= MIN_TARGET && target <= MAX_TARGET;
}

/**
 * Win probability. Under and over are exact complements — `under 40` wins on
 * rolls 0.00–39.99 and `over 40` on 40.00–99.99 — so no roll is a push and the
 * two directions always sum to one.
 */
export function winChance(target: number, direction: Direction): number {
  const under = target / 100;
  return direction === "under" ? under : 1 - under;
}

/** Points a win pays. Inversely proportional to its chance, so EV is flat. */
export function winPoints(target: number, direction: Direction): number {
  const chance = winChance(target, direction);
  if (chance <= 0) return 0;
  return Math.round(WIN_BASE / chance);
}

/** Expected points for a given call. Flat across every line by design. */
export function expectedPoints(target: number, direction: Direction): number {
  const chance = winChance(target, direction);
  return PARTICIPATION_POINTS + chance * winPoints(target, direction);
}

export function play(stream: SeedStream, target: number, direction: Direction): GameResult {
  if (!isValidTarget(target)) {
    throw new Error(`Line must be a whole number from ${MIN_TARGET} to ${MAX_TARGET}.`);
  }
  const raw = stream.nextInt(ROLL_RANGE);
  const roll = raw / 100;
  const won = direction === "under" ? raw < target * 100 : raw >= target * 100;
  const points = won ? winPoints(target, direction) : 0;

  const detail: DiceDetail = {
    target,
    direction,
    roll,
    won,
    chance: winChance(target, direction),
    participationPoints: PARTICIPATION_POINTS,
    winPoints: points,
  };
  return { points: PARTICIPATION_POINTS + points, detail: { ...detail } };
}

export const BYTE_BUDGET = 64;
