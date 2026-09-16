/**
 * Ascent — a rising multiplier that busts at a hidden point.
 *
 * The player commits to a target before the round, rather than hitting a button
 * mid-flight. That is a fairness decision, not a simplification: a live
 * cash-out would be decided by network latency, so the player on the worst
 * connection would lose rounds they had clearly won, and nothing about that
 * would be verifiable after the fact. Committing up front makes the whole round
 * derivable from the seed and identical for everyone.
 *
 * The bust point follows P(bust >= t) = 1/t, so the win pays exactly its own
 * improbability and the expected value is flat across every target a player can
 * choose. Reaching for 50x is not a worse bet than 1.2x — just a rarer one.
 */

import type { SeedStream } from "./rng.ts";
import { TARGET_EV, type GameResult } from "./types.ts";

export const MIN_TARGET = 1.2;
export const MAX_TARGET = 50;

/** Paid whatever happens, so a bust still moves the player's season total. */
export const PARTICIPATION_POINTS = 15;

/** Multiplied by the target on a win. Sums with participation to TARGET_EV. */
export const WIN_BASE = TARGET_EV - PARTICIPATION_POINTS;

export type AscentDetail = {
  target: number;
  bust: number;
  cleared: boolean;
  participationPoints: number;
  winPoints: number;
};

/** Targets are held to two decimals so the payout probability is exact. */
export function normalizeTarget(target: number): number {
  return Math.round(target * 100) / 100;
}

export function isValidTarget(target: number): boolean {
  if (!Number.isFinite(target)) return false;
  const t = normalizeTarget(target);
  return t >= MIN_TARGET && t <= MAX_TARGET && Math.round(t * 100) === t * 100;
}

/**
 * Derive the bust multiplier.
 *
 * `floor(100 / (1 - u)) / 100` gives P(bust >= t) = 1/t exactly for any t on a
 * two-decimal grid, which is what makes the payout table fair by construction
 * rather than by tuning.
 */
export function bustPoint(stream: SeedStream): number {
  const u = stream.nextFloat();
  return Math.max(1, Math.floor(100 / (1 - u)) / 100);
}

/** Probability of reaching a given target. */
export function clearChance(target: number): number {
  return 1 / normalizeTarget(target);
}

/** Closed-form expected points — flat across every target by design. */
export function expectedPoints(target: number): number {
  return PARTICIPATION_POINTS + WIN_BASE * normalizeTarget(target) * clearChance(target);
}

export function play(stream: SeedStream, target: number): GameResult {
  if (!isValidTarget(target)) {
    throw new Error(`target must be ${MIN_TARGET}–${MAX_TARGET} with at most 2 decimals`);
  }
  const t = normalizeTarget(target);
  const bust = bustPoint(stream);
  const cleared = bust >= t;
  const winPoints = cleared ? Math.round(WIN_BASE * t) : 0;

  const detail: AscentDetail = {
    target: t,
    bust,
    cleared,
    participationPoints: PARTICIPATION_POINTS,
    winPoints,
  };
  return { points: PARTICIPATION_POINTS + winPoints, detail: { ...detail } };
}

/** One 4-byte float, plus slack. */
export const BYTE_BUDGET = 32;
