/**
 * Tower — eight floors, one safe tile per row to find.
 *
 * The same fair-multiplier rule as Mines in a different shape: each floor's
 * multiplier is one over the chance of picking a safe tile, so climbing never
 * becomes a worse bet and stopping never becomes a mistake. Three difficulties
 * change how steep the climb is, not what it is worth.
 */

import type { SeedStream } from "./rng.ts";
import { TARGET_EV, type GameResult } from "./types.ts";

export const FLOORS = 8;

export type Difficulty = "easy" | "medium" | "hard";

/** Tiles per row and how many of them are safe. */
export const DIFFICULTIES: Readonly<Record<Difficulty, { tiles: number; safe: number }>> = {
  easy: { tiles: 3, safe: 2 },
  medium: { tiles: 3, safe: 1 },
  hard: { tiles: 4, safe: 1 },
};

export const LEVELS = Object.keys(DIFFICULTIES) as Difficulty[];

export type TowerLayout = {
  difficulty: Difficulty;
  /** Safe tile indices for each floor. */
  safeTiles: number[][];
};

export type TowerDetail = {
  difficulty: Difficulty;
  picks: number[];
  safeTiles: number[][];
  banked: boolean;
  multiplier: number;
  points: number;
};

export function isValidDifficulty(value: string): value is Difficulty {
  return Object.prototype.hasOwnProperty.call(DIFFICULTIES, value);
}

/** Chance of surviving one floor. */
export function floorChance(difficulty: Difficulty): number {
  const { tiles, safe } = DIFFICULTIES[difficulty];
  return safe / tiles;
}

export function survivalChance(difficulty: Difficulty, floors: number): number {
  return floorChance(difficulty) ** floors;
}

export function multiplierAfter(difficulty: Difficulty, floors: number): number {
  return 1 / survivalChance(difficulty, floors);
}

export function pointsFor(difficulty: Difficulty, floors: number): number {
  if (floors < 1) return 0;
  return Math.max(1, Math.round(TARGET_EV * multiplierAfter(difficulty, floors)));
}

/** Expected points for a climb that stops at `floors`. Flat by construction. */
export function expectedPoints(difficulty: Difficulty, floors: number): number {
  return survivalChance(difficulty, floors) * pointsFor(difficulty, floors);
}

/**
 * Fix every floor's safe tiles when the round opens. The client is told only
 * whether the tile it picked was safe, never the layout, until the round ends.
 */
export function layout(stream: SeedStream, difficulty: Difficulty): TowerLayout {
  if (!isValidDifficulty(difficulty)) {
    throw new Error(`Difficulty must be one of ${LEVELS.join(", ")}.`);
  }
  const { tiles, safe } = DIFFICULTIES[difficulty];
  const safeTiles: number[][] = [];
  for (let floor = 0; floor < FLOORS; floor += 1) {
    const row = Array.from({ length: tiles }, (_, i) => i);
    for (let i = 0; i < safe; i += 1) {
      const j = i + stream.nextInt(tiles - i);
      [row[i], row[j]] = [row[j]!, row[i]!];
    }
    safeTiles.push(row.slice(0, safe).sort((a, b) => a - b));
  }
  return { difficulty, safeTiles };
}

export function isSafe(layout: TowerLayout, floor: number, tile: number): boolean {
  return layout.safeTiles[floor]?.includes(tile) ?? false;
}

export function isValidTile(difficulty: Difficulty, tile: number): boolean {
  const { tiles } = DIFFICULTIES[difficulty];
  return Number.isInteger(tile) && tile >= 0 && tile < tiles;
}

export function settle(
  layout: TowerLayout,
  picks: readonly number[],
  banked: boolean,
): GameResult {
  const points = banked ? pointsFor(layout.difficulty, picks.length) : 0;
  const detail: TowerDetail = {
    difficulty: layout.difficulty,
    picks: [...picks],
    safeTiles: layout.safeTiles,
    banked,
    multiplier: picks.length > 0 ? multiplierAfter(layout.difficulty, picks.length) : 1,
    points,
  };
  return { points, detail: { ...detail } };
}

export const BYTE_BUDGET = FLOORS * 4 * 4 + 128;
