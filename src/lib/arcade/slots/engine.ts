/**
 * The slot engine: one spin, evaluated.
 *
 * **Cells are drawn independently.** A real cabinet spins a physical strip, so
 * the rows within a reel are correlated; here every visible cell is its own
 * draw from that reel's weights. This is a deliberate simplification, not an
 * oversight: it makes a game's expected value computable in closed form (see
 * `ev.ts`), which is what lets 280 games be calibrated to pay exactly the same
 * without simulating any of them. A player verifying a spin re-derives the same
 * cells from the seed either way.
 */

import type { SeedStream } from "../games/rng.ts";
import type { RoundResult, SlotConfig, SpinResult, WinLine } from "./types.ts";

/** Payline shapes, as a row index per reel. Truncated to the game's reel count. */
const LINE_PATTERNS: readonly (readonly number[])[] = [
  [1, 1, 1, 1, 1, 1], [0, 0, 0, 0, 0, 0], [2, 2, 2, 2, 2, 2], [3, 3, 3, 3, 3, 3],
  [0, 1, 2, 1, 0, 1], [2, 1, 0, 1, 2, 1], [1, 0, 1, 2, 1, 0], [1, 2, 1, 0, 1, 2],
  [0, 0, 1, 2, 2, 1], [2, 2, 1, 0, 0, 1], [0, 1, 1, 1, 0, 0], [2, 1, 1, 1, 2, 2],
  [1, 0, 0, 0, 1, 1], [1, 2, 2, 2, 1, 1], [0, 1, 0, 1, 0, 1], [2, 1, 2, 1, 2, 1],
  [1, 1, 0, 1, 1, 0], [1, 1, 2, 1, 1, 2], [0, 2, 0, 2, 0, 2], [2, 0, 2, 0, 2, 0],
  [3, 2, 1, 0, 1, 2], [0, 1, 2, 3, 2, 1], [3, 3, 2, 1, 1, 2], [0, 0, 1, 2, 2, 3],
  [1, 2, 3, 2, 1, 0], [2, 3, 2, 3, 2, 3], [3, 0, 3, 0, 3, 0], [0, 3, 0, 3, 0, 3],
  [2, 2, 3, 3, 2, 2], [1, 1, 3, 3, 1, 1], [3, 1, 3, 1, 3, 1], [0, 2, 2, 2, 0, 0],
  [1, 3, 1, 3, 1, 3], [2, 0, 0, 0, 2, 2], [3, 2, 3, 2, 3, 2], [0, 1, 1, 0, 0, 1],
  [1, 2, 2, 1, 1, 2], [2, 3, 3, 2, 2, 3], [3, 1, 1, 3, 3, 1], [0, 3, 3, 0, 0, 3],
];

/** The paylines a game actually uses, clamped to its grid. */
export function paylinesFor(reels: number, rows: number, count: number): number[][] {
  const usable = LINE_PATTERNS.filter((pattern) =>
    pattern.slice(0, reels).every((row) => row < rows),
  );
  const lines: number[][] = [];
  for (let i = 0; i < count; i += 1) {
    const pattern = usable[i % usable.length]!;
    lines.push(pattern.slice(0, reels));
  }
  return lines;
}

/** Total ways on a grid: rows to the power of reels. */
export function waysCount(reels: number, rows: number): number {
  return rows ** reels;
}

export function isWild(config: SlotConfig, symbol: number): boolean {
  return config.symbols[symbol]?.kind === "wild";
}

export function isScatter(config: SlotConfig, symbol: number): boolean {
  return config.symbols[symbol]?.kind === "scatter";
}

/** Whether `cell` counts toward a run of `symbol` — itself, or a wild. */
function matches(config: SlotConfig, cell: number, symbol: number): boolean {
  return cell === symbol || isWild(config, cell);
}

/** Draw one grid. `grid[reel][row]`. */
export function spinGrid(stream: SeedStream, config: SlotConfig): number[][] {
  const { reels, rows } = config.mechanic;
  const grid: number[][] = [];
  for (let reel = 0; reel < reels; reel += 1) {
    const weights = config.weights[reel]!;
    const column: number[] = [];
    for (let row = 0; row < rows; row += 1) column.push(stream.nextWeighted(weights));
    grid.push(column);
  }
  return grid;
}

/** Count scatters anywhere on the grid. */
export function countScatters(config: SlotConfig, grid: readonly number[][]): number {
  let count = 0;
  for (const column of grid) {
    for (const cell of column) if (isScatter(config, cell)) count += 1;
  }
  return count;
}

/**
 * Evaluate one payline.
 *
 * The run is tracked as one of three states — every reel so far wild, locked to
 * a single symbol, or dead — which is all a left-to-right run can ever be. An
 * all-wild run pays the highest-value symbol, the usual rule.
 */
function evaluateLine(
  config: SlotConfig,
  grid: readonly number[][],
  pattern: readonly number[],
  lineIndex: number,
): WinLine | null {
  const { minRun } = config.mechanic;
  const cells: [number, number][] = [];
  let locked = -1; // -1 while every reel so far has been wild
  let run = 0;

  for (let reel = 0; reel < pattern.length; reel += 1) {
    const row = pattern[reel]!;
    const cell = grid[reel]![row]!;
    if (isScatter(config, cell)) break;

    if (isWild(config, cell)) {
      // Keeps both an all-wild run and a locked run alive.
    } else if (locked === -1) {
      locked = cell;
    } else if (cell !== locked) {
      break;
    }
    cells.push([reel, row]);
    run += 1;
  }

  if (run < minRun) return null;

  // An all-wild run represents whichever paying symbol is worth most.
  let symbol = locked;
  if (symbol === -1) {
    let best = -1;
    let bestPay = -1;
    config.symbols.forEach((definition, index) => {
      if (definition.kind !== "pay") return;
      const pay = definition.pays[run] ?? 0;
      if (pay > bestPay) {
        bestPay = pay;
        best = index;
      }
    });
    symbol = best;
  }
  if (symbol < 0) return null;

  const pay = config.symbols[symbol]?.pays[run] ?? 0;
  if (pay <= 0) return null;
  return { line: lineIndex, symbol, run, cells: cells.slice(0, run), pay, ways: 1 };
}

/**
 * Evaluate ways wins.
 *
 * Every symbol pays independently — the defining difference from lines — so a
 * grid can produce several wins at once and they simply add.
 */
function evaluateWays(config: SlotConfig, grid: readonly number[][]): WinLine[] {
  const { reels, minRun } = config.mechanic;
  const wins: WinLine[] = [];

  config.symbols.forEach((definition, symbol) => {
    if (definition.kind !== "pay") return;
    let ways = 1;
    let run = 0;
    const cells: [number, number][] = [];

    for (let reel = 0; reel < reels; reel += 1) {
      const hits: [number, number][] = [];
      grid[reel]!.forEach((cell, row) => {
        if (matches(config, cell, symbol)) hits.push([reel, row]);
      });
      if (hits.length === 0) break;
      ways *= hits.length;
      cells.push(...hits);
      run += 1;
    }

    if (run < minRun) return;
    const pay = definition.pays[run] ?? 0;
    if (pay <= 0) return;
    wins.push({ line: -1, symbol, run, cells, pay: pay * ways, ways });
  });

  return wins;
}

export function evaluate(config: SlotConfig, grid: number[][]): SpinResult {
  const { payMode, reels, rows, lines } = config.mechanic;
  const wins =
    payMode === "ways"
      ? evaluateWays(config, grid)
      : paylinesFor(reels, rows, lines)
          .map((pattern, index) => evaluateLine(config, grid, pattern, index))
          .filter((win): win is WinLine => win !== null);

  return {
    grid,
    wins,
    scatters: countScatters(config, grid),
    rawPay: wins.reduce((sum, win) => sum + win.pay, 0),
  };
}

export function spin(stream: SeedStream, config: SlotConfig): SpinResult {
  return evaluate(config, spinGrid(stream, config));
}

/**
 * Play a full round: the base spin, plus free spins when scatters trigger them.
 *
 * Free spins are resolved here rather than handed back as a promise to the
 * player, because the expected-value calculation counts them — a round that
 * awarded them without paying them out would quietly underpay the game.
 * Retriggers are not awarded; `ev.ts` assumes the same.
 */
export function playRound(stream: SeedStream, config: SlotConfig): RoundResult {
  const { feature } = config.mechanic;
  const base = spin(stream, config);
  const featureTriggered = base.scatters >= feature.trigger;

  const freeSpins: SpinResult[] = [];
  if (featureTriggered) {
    for (let i = 0; i < feature.spins; i += 1) freeSpins.push(spin(stream, config));
  }

  const freePay = freeSpins.reduce((sum, result) => sum + result.rawPay, 0);
  const rawPay = base.rawPay + freePay * feature.multiplier;

  return {
    base,
    freeSpins,
    featureTriggered,
    multiplier: feature.multiplier,
    rawPay,
    points: pointsFor(rawPay, config.scale),
  };
}

/**
 * Convert raw pay into points, never losing a win to rounding.
 *
 * A high-ways game spans an enormous range — its smallest win is a single
 * three-of-a-kind on one way, its mean is dominated by wins worth thousands of
 * times that — so its calibrated scale is tiny and plain rounding sent about one
 * winning spin in six to zero. The grid lit up the winning cells and the screen
 * said "No win", which is the kind of thing that makes a game look rigged.
 *
 * Any spin that actually won pays at least one point. That lifts the affected
 * games' expected value by under a fifth of a percent — only the highest-ways
 * mechanics are touched at all — and `slots.test.ts` holds that drift to a
 * bound so it cannot grow unnoticed.
 */
export function pointsFor(rawPay: number, scale: number): number {
  if (rawPay <= 0) return 0;
  return Math.max(1, Math.round(rawPay * scale));
}

/** Bytes a round may need: every cell of the base spin and every free spin. */
export function byteBudget(config: SlotConfig): number {
  const { reels, rows, feature } = config.mechanic;
  const cells = reels * rows;
  return (1 + feature.spins) * cells * 4 + 512;
}
