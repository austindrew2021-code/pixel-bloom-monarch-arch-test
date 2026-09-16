/**
 * Carrier Run — fly the approach, then put it down on the deck.
 *
 * The plane crosses ten sectors. Each sector has three lanes, and each lane
 * holds a bubble, clear air, or a bomb. Pick a lane, collect what is in it, and
 * fly on — or break off and bank what you have. Reach the deck and the landing
 * pays on top.
 *
 * It looks like an arcade game and plays like one, but it is a chain of odds,
 * not a test of reflexes. That is deliberate: a game where a quick player
 * scored more than a slow one would be worth more than every other game in the
 * arcade, and the leaderboard only works because none of them is.
 *
 * The whole airspace is fixed from the seed when the run opens. The client is
 * told what was in the lane it chose and nothing about the others until the run
 * is over.
 */

import type { SeedStream } from "./rng.ts";
import { TARGET_EV, type GameResult } from "./types.ts";

export const SECTORS = 10;
export const LANES = 3;

export type CellKind = "bubble" | "clear" | "bomb";

export type CarrierLayout = {
  /** `grid[sector][lane]` — what is waiting in each lane. */
  grid: CellKind[][];
  /** Bubble value per sector, in raw units. Deeper sectors are worth more. */
  values: number[];
};

export type CarrierDetail = {
  grid: CellKind[][];
  values: number[];
  path: number[];
  landed: boolean;
  crashed: boolean;
  collected: number;
  points: number;
};

/**
 * Bombs per sector. The approach tightens as the deck gets closer, so pressing
 * on is a real decision rather than a formality.
 */
export function bombsIn(sector: number): number {
  return sector < 4 ? 0 : sector < 8 ? 1 : 1;
}

/** Chance of picking a clear lane in a sector. */
export function safeChance(sector: number): number {
  return (LANES - bombsIn(sector)) / LANES;
}

/** Chance of surviving from the start through `sectors` of them. */
export function survivalChance(sectors: number): number {
  let chance = 1;
  for (let sector = 0; sector < sectors; sector += 1) chance *= safeChance(sector);
  return chance;
}

/**
 * The multiplier a run has earned: one over the chance of getting this far, so
 * pressing on is never a mistake and breaking off is never leaving value on the
 * table. The same rule Mines and Tower run on.
 */
export function multiplierAfter(sectors: number): number {
  const chance = survivalChance(sectors);
  return chance > 0 ? 1 / chance : 0;
}

export function pointsFor(sectors: number, landed: boolean): number {
  if (sectors < 1) return 0;
  const base = TARGET_EV * multiplierAfter(sectors);
  // Landing on the deck is the whole point of the approach, so completing all
  // ten sectors pays a premium over breaking off at the ninth.
  return Math.max(1, Math.round(landed ? base * LANDING_BONUS : base));
}

/** Premium for reaching the deck rather than breaking off. */
export const LANDING_BONUS = 1.5;

/**
 * Expected points for a pilot who commits to breaking off after `sectors`.
 *
 * Flat across every stopping point except the deck, which is deliberately worth
 * more — the one place in the arcade where a choice is better than another, and
 * it is the same choice for everyone, so it tilts nobody's leaderboard.
 */
export function expectedPoints(sectors: number, landed = false): number {
  return survivalChance(sectors) * pointsFor(sectors, landed);
}

export function isValidLane(lane: number): boolean {
  return Number.isInteger(lane) && lane >= 0 && lane < LANES;
}

/** Bubble value for a sector, in raw units. */
function bubbleValue(sector: number): number {
  return 1 + sector * 0.35;
}

/**
 * Lay out the airspace. Bombs are placed by shuffle so a sector never gets two
 * in one lane, and the entropy a run needs stays fixed.
 */
export function layout(stream: SeedStream): CarrierLayout {
  const grid: CellKind[][] = [];
  const values: number[] = [];

  for (let sector = 0; sector < SECTORS; sector += 1) {
    const lanes: CellKind[] = new Array(LANES).fill("clear");
    const order = Array.from({ length: LANES }, (_, i) => i);
    const bombs = bombsIn(sector);
    for (let i = 0; i < bombs; i += 1) {
      const j = i + stream.nextInt(LANES - i);
      [order[i], order[j]] = [order[j]!, order[i]!];
      lanes[order[i]!] = "bomb";
    }
    // Every remaining lane gets a bubble or clear air, so a safe pick still
    // has something to find.
    for (let lane = 0; lane < LANES; lane += 1) {
      if (lanes[lane] === "clear" && stream.nextChance(0.55)) lanes[lane] = "bubble";
    }
    grid.push(lanes);
    values.push(bubbleValue(sector));
  }

  return { grid, values };
}

export function cellAt(layout: CarrierLayout, sector: number, lane: number): CellKind {
  return layout.grid[sector]?.[lane] ?? "clear";
}

/** Raw bubble value collected along a path. */
export function collectedValue(layout: CarrierLayout, path: readonly number[]): number {
  let total = 0;
  path.forEach((lane, sector) => {
    if (cellAt(layout, sector, lane) === "bubble") total += layout.values[sector] ?? 0;
  });
  return total;
}

export function settle(
  layout: CarrierLayout,
  path: readonly number[],
  banked: boolean,
): GameResult {
  const crashed = !banked;
  const landed = banked && path.length >= SECTORS;
  const points = banked ? pointsFor(path.length, landed) : 0;
  const detail: CarrierDetail = {
    grid: layout.grid,
    values: layout.values,
    path: [...path],
    landed,
    crashed,
    collected: collectedValue(layout, path),
    points,
  };
  return { points, detail: { ...detail } };
}

/** Bombs and bubbles per sector, plus slack. */
export const BYTE_BUDGET = SECTORS * (LANES + 2) * 4 + 256;
