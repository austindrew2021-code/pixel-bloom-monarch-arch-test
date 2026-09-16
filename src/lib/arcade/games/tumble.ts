/**
 * Tumble — a 6×5 grid where eight or more of a symbol pay anywhere, winners
 * clear out, survivors fall, and fresh symbols drop in to try again.
 *
 * An original game in the "scatter pays with cascading tumbles and multiplier
 * orbs" genre. The pay table, symbol set, orb values and theme are its own.
 *
 * Unlike the other games here its expected value has no clean closed form —
 * cascades chain into each other and orbs multiply the whole round — so
 * `PAY_SCALE` is tuned against a large simulated sample and pinned by a test
 * that re-measures it. If the symbol set or pay table changes, that test fails
 * until the scale is re-tuned, which is the point: this game must not drift
 * away from paying the same as the others.
 */

import type { SeedStream } from "./rng.ts";
import { type GameResult } from "./types.ts";

export const COLUMNS = 6;
export const ROWS = 5;
export const CELLS = COLUMNS * ROWS;

/** Fewest matching symbols anywhere on the grid that pay. */
export const MIN_CLUSTER = 8;

/** Cap on chained cascades, so a round always terminates inside its budget. */
export const MAX_CASCADES = 12;

/**
 * Symbol pay weights. Every symbol appears equally often; they differ only in
 * what they pay, so the grid stays readable while the top symbols still feel
 * like a result worth seeing.
 */
export const SYMBOL_VALUES: readonly number[] = [1, 1, 1, 1.5, 1.5, 2, 4, 10];
export const SYMBOL_COUNT = SYMBOL_VALUES.length;

/** Cluster size tiers, paid against the symbol's value. */
export function clusterUnits(size: number): number {
  if (size >= 12) return 20;
  if (size >= 10) return 5;
  if (size >= MIN_CLUSTER) return 2;
  return 0;
}

/** Chance that a multiplier orb lands during one cascade step. */
export const ORB_CHANCE = 0.18;

export const ORB_VALUES: readonly number[] = [2, 3, 5, 10, 25, 50, 100];
export const ORB_WEIGHTS: readonly number[] = [40, 25, 16, 10, 5, 3, 1];

/**
 * Paid on every round. Scatter-pays games lose most rounds by nature — roughly
 * four in five grids never reach a cluster — so without a floor the game would
 * feel dead even while paying the same as the others on average.
 */
export const PARTICIPATION_POINTS = 15;

/**
 * Tuned so participation plus mean win lands on TARGET_EV. Measured across a
 * large sample rather than derived, and pinned by `games.test.ts`.
 */
export const PAY_SCALE = 13.7;

export type TumbleStep = {
  /** Grid before this step resolved, column-major: index = col * ROWS + row. */
  grid: number[];
  /** Cells cleared by this step. */
  cleared: number[];
  /** Raw pay units won by this step. */
  units: number;
  /** Orb value dropped during this step, if any. */
  orb: number | null;
};

export type TumbleDetail = {
  /**
   * The grid as first dealt. Always present, including on the roughly four
   * rounds in five that never reach a cluster — without it a losing round has
   * no steps to draw and the board renders empty, which reads as a bug.
   */
  initialGrid: number[];
  steps: TumbleStep[];
  units: number;
  orbTotal: number;
  participationPoints: number;
  winPoints: number;
  points: number;
};

function fillGrid(stream: SeedStream, grid: number[]): void {
  for (let i = 0; i < grid.length; i += 1) {
    if (grid[i] === -1) grid[i] = stream.nextInt(SYMBOL_COUNT);
  }
}

/** Cells belonging to any symbol that reached the cluster minimum. */
function winningCells(grid: readonly number[]): { cells: number[]; units: number } {
  const positions = new Map<number, number[]>();
  for (let i = 0; i < grid.length; i += 1) {
    const symbol = grid[i]!;
    const list = positions.get(symbol);
    if (list) list.push(i);
    else positions.set(symbol, [i]);
  }
  const cells: number[] = [];
  let units = 0;
  for (const [symbol, list] of positions) {
    const tier = clusterUnits(list.length);
    if (tier === 0) continue;
    units += tier * (SYMBOL_VALUES[symbol] ?? 1);
    cells.push(...list);
  }
  return { cells: cells.sort((a, b) => a - b), units };
}

/**
 * Drop surviving symbols down their own column and mark the gaps for refill.
 * Column-major indexing makes this a per-column compaction rather than a
 * whole-grid shuffle.
 */
function collapse(grid: number[], cleared: readonly number[]): void {
  const gone = new Set(cleared);
  for (let col = 0; col < COLUMNS; col += 1) {
    const base = col * ROWS;
    const kept: number[] = [];
    for (let row = ROWS - 1; row >= 0; row -= 1) {
      const index = base + row;
      if (!gone.has(index)) kept.push(grid[index]!);
    }
    for (let row = ROWS - 1; row >= 0; row -= 1) {
      const fromBottom = ROWS - 1 - row;
      grid[base + row] = fromBottom < kept.length ? kept[fromBottom]! : -1;
    }
  }
}

export function play(stream: SeedStream): GameResult {
  const grid = new Array<number>(CELLS).fill(-1);
  fillGrid(stream, grid);
  const initialGrid = [...grid];

  const steps: TumbleStep[] = [];
  let units = 0;
  let orbTotal = 0;

  for (let cascade = 0; cascade < MAX_CASCADES; cascade += 1) {
    const { cells, units: stepUnits } = winningCells(grid);
    if (cells.length === 0) break;

    // An orb can only land on a step that actually paid, so orbs amplify a run
    // rather than appearing out of nowhere.
    let orb: number | null = null;
    if (stream.nextChance(ORB_CHANCE)) {
      orb = ORB_VALUES[stream.nextWeighted(ORB_WEIGHTS)]!;
      orbTotal += orb;
    }

    steps.push({ grid: [...grid], cleared: cells, units: stepUnits, orb });
    units += stepUnits;

    collapse(grid, cells);
    fillGrid(stream, grid);
  }

  // Orbs collected across the round multiply the whole round's pay, which is
  // what makes a long cascade with a late orb the memorable outcome.
  const multiplier = orbTotal > 0 ? orbTotal : 1;
  const winPoints = Math.round(units * multiplier * PAY_SCALE);
  const points = PARTICIPATION_POINTS + winPoints;

  const detail: TumbleDetail = {
    initialGrid,
    steps,
    units,
    orbTotal,
    participationPoints: PARTICIPATION_POINTS,
    winPoints,
    points,
  };
  return { points, detail: { ...detail } };
}

/**
 * Budget: the initial fill, then per cascade a full refill plus the orb rolls,
 * with slack for rejection resampling in `nextInt`.
 */
export const BYTE_BUDGET = CELLS * 4 + MAX_CASCADES * (CELLS * 4 + 16) + 256;
