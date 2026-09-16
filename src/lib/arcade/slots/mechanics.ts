/**
 * Mechanics: the seven shapes a title in the catalogue can take.
 *
 * Each pairs with all forty themes, giving 280 games. They are genuinely
 * different to play — a three-reel single-line game is a very different rhythm
 * from a 4,096-ways six-reel game — while every one stays exactly calibratable,
 * which is why the catalogue can guarantee no game is the better bet.
 */

import type { Mechanic } from "./types.ts";

export const MECHANICS: readonly Mechanic[] = [
  {
    id: "classic3",
    name: "Classic",
    reels: 3,
    rows: 1,
    payMode: "lines",
    lines: 1,
    minRun: 2,
    feature: { trigger: 2, spins: 3, multiplier: 2 },
  },
  {
    id: "triple5",
    name: "Triple",
    reels: 3,
    rows: 3,
    payMode: "lines",
    lines: 5,
    minRun: 2,
    feature: { trigger: 3, spins: 5, multiplier: 2 },
  },
  {
    id: "line10",
    name: "Ten Line",
    reels: 5,
    rows: 3,
    payMode: "lines",
    lines: 10,
    minRun: 3,
    feature: { trigger: 3, spins: 8, multiplier: 2 },
  },
  {
    id: "line20",
    name: "Twenty Line",
    reels: 5,
    rows: 3,
    payMode: "lines",
    lines: 20,
    minRun: 3,
    feature: { trigger: 3, spins: 10, multiplier: 3 },
  },
  {
    id: "line40",
    name: "Forty Line",
    reels: 5,
    rows: 4,
    payMode: "lines",
    lines: 40,
    minRun: 3,
    // Four scatters, not three: a 5x4 grid has twenty cells, so three would
    // land roughly one spin in six and the feature would stop feeling like one.
    feature: { trigger: 4, spins: 12, multiplier: 3 },
  },
  {
    id: "ways243",
    name: "243 Ways",
    reels: 5,
    rows: 3,
    payMode: "ways",
    lines: 0,
    minRun: 3,
    feature: { trigger: 3, spins: 10, multiplier: 2 },
  },
  {
    id: "ways4096",
    name: "4096 Ways",
    reels: 6,
    rows: 4,
    payMode: "ways",
    lines: 0,
    minRun: 3,
    feature: { trigger: 4, spins: 12, multiplier: 2 },
  },
];

export const MECHANIC_COUNT = MECHANICS.length;
