/**
 * Mines — reveal tiles on a 5×5 grid, stop before you hit one.
 *
 * The only game here played over several requests, and the only one where the
 * player makes decisions inside a round. The grid is fixed the moment the round
 * opens — derived from the seed like every other game — but the server answers
 * one tile at a time and never hands the layout to the client until the round
 * is over. That ordering is what stops the board being read out of a network
 * response.
 *
 * The multiplier after k safe reveals is exactly 1/P(surviving k reveals), so
 * banking is worth the same expected 99 points after one reveal as after
 * twenty, and pushing further is never a mistake or a trap. There is no
 * optimal stopping point to discover — only how much variance you want.
 */

import type { SeedStream } from "./rng.ts";
import { TARGET_EV, type GameResult } from "./types.ts";

export const GRID_SIZE = 25;

/** Selectable mine counts. More mines means a steeper multiplier curve. */
export const MINE_CHOICES = [1, 3, 5, 10] as const;

export type MinesLayout = { mines: number[]; mineCount: number };

export type MinesDetail = {
  mineCount: number;
  revealed: number[];
  mines: number[];
  banked: boolean;
  multiplier: number;
  points: number;
};

export function isValidMineCount(mineCount: number): boolean {
  return (MINE_CHOICES as readonly number[]).includes(mineCount);
}

/**
 * Place mines with a partial Fisher–Yates shuffle.
 *
 * Shuffling rather than re-rolling positions guarantees distinct tiles without
 * a retry loop whose length would depend on the draws — which would make the
 * byte budget unpredictable and the round harder to re-derive.
 */
export function layout(stream: SeedStream, mineCount: number): MinesLayout {
  if (!isValidMineCount(mineCount)) {
    throw new Error(`mineCount must be one of ${MINE_CHOICES.join(", ")}`);
  }
  const tiles = Array.from({ length: GRID_SIZE }, (_, i) => i);
  for (let i = 0; i < mineCount; i += 1) {
    const j = i + stream.nextInt(GRID_SIZE - i);
    [tiles[i], tiles[j]] = [tiles[j]!, tiles[i]!];
  }
  return { mines: tiles.slice(0, mineCount).sort((a, b) => a - b), mineCount };
}

/** Probability of surviving `picks` reveals with `mineCount` mines down. */
export function survivalChance(mineCount: number, picks: number): number {
  const safe = GRID_SIZE - mineCount;
  if (picks < 0 || picks > safe) return 0;
  let chance = 1;
  for (let i = 0; i < picks; i += 1) {
    chance *= (safe - i) / (GRID_SIZE - i);
  }
  return chance;
}

/**
 * The multiplier earned after `picks` safe reveals: the reciprocal of the
 * chance of getting that far, so the payout always matches the risk taken.
 */
export function multiplierAfter(mineCount: number, picks: number): number {
  const chance = survivalChance(mineCount, picks);
  if (chance <= 0) throw new Error("no safe tiles remain");
  return 1 / chance;
}

/** Points for banking after `picks` safe reveals. At least one is required. */
export function pointsFor(mineCount: number, picks: number): number {
  if (picks < 1) return 0;
  return Math.round(TARGET_EV * multiplierAfter(mineCount, picks));
}

/** Expected points for a player who commits to banking after `picks`. */
export function expectedPoints(mineCount: number, picks: number): number {
  return survivalChance(mineCount, picks) * pointsFor(mineCount, picks);
}

export function isMine(layout: MinesLayout, tile: number): boolean {
  return layout.mines.includes(tile);
}

export function isValidTile(tile: number): boolean {
  return Number.isInteger(tile) && tile >= 0 && tile < GRID_SIZE;
}

/** Resolve a finished round into its ledger entry. */
export function settle(
  layout: MinesLayout,
  revealed: readonly number[],
  banked: boolean,
): GameResult {
  const points = banked ? pointsFor(layout.mineCount, revealed.length) : 0;
  const detail: MinesDetail = {
    mineCount: layout.mineCount,
    revealed: [...revealed],
    mines: [...layout.mines],
    banked,
    multiplier: revealed.length > 0 ? multiplierAfter(layout.mineCount, revealed.length) : 1,
    points,
  };
  return { points, detail: { ...detail } };
}

/** Byte budget: one draw per mine placed, plus slack for resampling. */
export const BYTE_BUDGET = Math.max(...MINE_CHOICES) * 4 + 64;
