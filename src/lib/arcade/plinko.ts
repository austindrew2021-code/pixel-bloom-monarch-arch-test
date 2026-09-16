/**
 * The Cascade board: a 16-row peg pyramid with 17 landing slots.
 *
 * A ball takes one left/right decision per row, so a path is 16 bits and the
 * slot it lands in is simply the number of rights. That makes slot outcomes
 * binomial — the centre is overwhelmingly likely (C(16,8)/65536 ≈ 19.6%) and
 * the outer slots are 1-in-65,536 — which is why the points table pays the
 * edges so heavily and the centre so little.
 *
 * Points, not money. Nothing here converts to currency at any ratio; the season
 * ladder pays fixed published prizes to finishing positions, and the score is
 * only an ordering device.
 */

import { bytesToPath, deriveBytes } from "./fair.ts";

export const BOARD_ROWS = 16;
export const SLOT_COUNT = BOARD_ROWS + 1;

/**
 * Points per landing slot, indexed by slot 0..16. Symmetric, so neither edge is
 * favoured, and tuned so the expected value of a drop is just under 100 points
 * (see `plinko.test.ts`, which pins the exact figure against the binomial
 * distribution). Round-number averages keep the daily and monthly totals in the
 * ranges the prize ladder was sized against.
 */
export const SLOT_POINTS: readonly number[] = [
  10000, 4100, 1000, 500, 300, 150, 100, 50, 30, 50, 100, 150, 300, 500, 1000, 4100, 10000,
];

export type Drop = {
  /** Left/right decisions as '0'/'1', one character per row. */
  path: string;
  /** 0..BOARD_ROWS — the number of rights taken. */
  slot: number;
  points: number;
};

/** Binomial coefficient C(n, k), exact for the board sizes used here. */
export function binomial(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let result = 1;
  for (let i = 0; i < Math.min(k, n - k); i += 1) {
    result = (result * (n - i)) / (i + 1);
  }
  return Math.round(result);
}

/** Resolve a path string into its landing slot and points. */
export function resolvePath(path: string, rows: number = BOARD_ROWS): Drop {
  if (path.length !== rows) {
    throw new Error(`path must be ${rows} characters, got ${path.length}`);
  }
  let slot = 0;
  for (const step of path) {
    if (step !== "0" && step !== "1") {
      throw new Error(`path may only contain '0' and '1', found '${step}'`);
    }
    if (step === "1") slot += 1;
  }
  const points = SLOT_POINTS[slot];
  if (points === undefined) {
    throw new Error(`no points defined for slot ${slot}`);
  }
  return { path, slot, points };
}

/**
 * Play one drop. Pure derivation — given the same seeds and nonce this always
 * returns the same result, which is exactly what makes the season reveal
 * checkable.
 */
export async function playDrop(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  rows: number = BOARD_ROWS,
): Promise<Drop> {
  const bytes = await deriveBytes(serverSeed, clientSeed, nonce, rows);
  return resolvePath(bytesToPath(bytes), rows);
}

/**
 * Re-derive a recorded drop and confirm it matches what the server stored.
 * This is what the public verify page runs, in the player's own browser,
 * against the seed revealed at season close.
 */
export async function verifyDrop(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  recorded: { path: string; slot: number; points: number },
  rows: number = BOARD_ROWS,
): Promise<boolean> {
  const replayed = await playDrop(serverSeed, clientSeed, nonce, rows);
  return (
    replayed.path === recorded.path &&
    replayed.slot === recorded.slot &&
    replayed.points === recorded.points
  );
}

/** Exact expected points per drop, from the binomial distribution. */
export function expectedPointsPerDrop(rows: number = BOARD_ROWS): number {
  const total = 2 ** rows;
  let sum = 0;
  for (let slot = 0; slot <= rows; slot += 1) {
    sum += binomial(rows, slot) * (SLOT_POINTS[slot] ?? 0);
  }
  return sum / total;
}

/** Probability of landing in each slot, for the odds table shown in the UI. */
export function slotOdds(rows: number = BOARD_ROWS): number[] {
  const total = 2 ** rows;
  return Array.from({ length: rows + 1 }, (_, slot) => binomial(rows, slot) / total);
}
