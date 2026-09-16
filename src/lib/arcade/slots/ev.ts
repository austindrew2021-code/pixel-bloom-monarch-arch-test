/**
 * Exact expected value for a slot config — no simulation.
 *
 * This is what makes a catalogue of 280 games possible while keeping the rule
 * that every game in the arcade pays the same. Measuring each game by sampling
 * would need millions of spins and would still be wrong by several percent,
 * because a slot's mean is dominated by rare feature hits. Computing it in
 * closed form is exact, takes microseconds, and means a mistuned game is caught
 * by a test rather than discovered by a player grinding the best one.
 *
 * It models exactly what `engine.ts` does — independent cells, wilds that
 * substitute, an all-wild line paying the best symbol, scatters that break runs
 * and trigger free spins, and no retriggers. The two must agree; `slots.test.ts`
 * checks the closed form against a large sample to prove they do.
 */

import { TARGET_EV } from "../games/types.ts";
import { waysCount } from "./engine.ts";
import type { SlotConfig } from "./types.ts";

type Probabilities = {
  /** `wild[reel]` — chance a single cell on that reel is wild. */
  wild: number[];
  /** `scatter[reel]`. */
  scatter: number[];
  /** `pay[reel][symbol]` — zero for wild and scatter entries. */
  pay: number[][];
};

function probabilities(config: SlotConfig): Probabilities {
  const wild: number[] = [];
  const scatter: number[] = [];
  const pay: number[][] = [];

  config.weights.forEach((reelWeights) => {
    const total = reelWeights.reduce((a, b) => a + b, 0);
    const perSymbol = reelWeights.map((w) => w / total);
    let w = 0;
    let s = 0;
    const p = perSymbol.map((probability, index) => {
      const kind = config.symbols[index]?.kind;
      if (kind === "wild") {
        w += probability;
        return 0;
      }
      if (kind === "scatter") {
        s += probability;
        return 0;
      }
      return probability;
    });
    wild.push(w);
    scatter.push(s);
    pay.push(p);
  });

  return { wild, scatter, pay };
}

function payOf(config: SlotConfig, symbol: number, run: number): number {
  if (run < config.mechanic.minRun) return 0;
  return config.symbols[symbol]?.pays[run] ?? 0;
}

/** Best payout any paying symbol offers at this run length — the all-wild case. */
function bestPay(config: SlotConfig, run: number): number {
  if (run < config.mechanic.minRun) return 0;
  let best = 0;
  config.symbols.forEach((definition, index) => {
    if (definition.kind !== "pay") return;
    best = Math.max(best, payOf(config, index, run));
  });
  return best;
}

/**
 * Expected pay of one payline.
 *
 * Walks the same three states a run can occupy — every reel so far wild, locked
 * to one symbol, or broken — carrying the probability of each and banking the
 * payout at the reel where the run ends.
 */
export function expectedLinePay(config: SlotConfig): number {
  const { reels } = config.mechanic;
  const { wild, scatter, pay } = probabilities(config);
  const symbolCount = config.symbols.length;

  let allWild = 1;
  let locked = new Array<number>(symbolCount).fill(0);
  let expected = 0;

  for (let reel = 0; reel < reels; reel += 1) {
    // A run of wilds only breaks on a scatter; anything else either extends it
    // or locks it to a symbol.
    expected += allWild * scatter[reel]! * bestPay(config, reel);
    for (let symbol = 0; symbol < symbolCount; symbol += 1) {
      const continues = wild[reel]! + pay[reel]![symbol]!;
      expected += locked[symbol]! * (1 - continues) * payOf(config, symbol, reel);
    }

    const nextAllWild = allWild * wild[reel]!;
    const nextLocked = new Array<number>(symbolCount).fill(0);
    for (let symbol = 0; symbol < symbolCount; symbol += 1) {
      nextLocked[symbol] =
        locked[symbol]! * (wild[reel]! + pay[reel]![symbol]!) + allWild * pay[reel]![symbol]!;
    }
    allWild = nextAllWild;
    locked = nextLocked;
  }

  // Runs that reached the last reel.
  expected += allWild * bestPay(config, reels);
  for (let symbol = 0; symbol < symbolCount; symbol += 1) {
    expected += locked[symbol]! * payOf(config, symbol, reels);
  }
  return expected;
}

/**
 * Expected pay of a ways game.
 *
 * Reels are independent, so the expected number of ways over a run is the
 * product of each reel's expected matching-cell count — the zero-match case
 * contributes nothing to the product, which is exactly the run-breaking rule.
 */
export function expectedWaysPay(config: SlotConfig): number {
  const { reels, rows, minRun } = config.mechanic;
  const { wild, pay } = probabilities(config);
  let expected = 0;

  config.symbols.forEach((definition, symbol) => {
    if (definition.kind !== "pay") return;
    const match = (reel: number) => wild[reel]! + pay[reel]![symbol]!;

    let waysProduct = 1;
    for (let run = 1; run <= reels; run += 1) {
      waysProduct *= rows * match(run - 1);
      if (run < minRun) continue;
      if (run < reels) {
        // The run stops here only if the next reel has no matching cell at all.
        const noMatch = (1 - match(run)) ** rows;
        expected += payOf(config, symbol, run) * waysProduct * noMatch;
      } else {
        expected += payOf(config, symbol, run) * waysProduct;
      }
    }
  });

  return expected;
}

/** Distribution of scatter counts across the whole grid. */
export function scatterDistribution(config: SlotConfig): number[] {
  const { reels, rows } = config.mechanic;
  const { scatter } = probabilities(config);
  let distribution = [1];

  for (let reel = 0; reel < reels; reel += 1) {
    for (let row = 0; row < rows; row += 1) {
      const next = new Array<number>(distribution.length + 1).fill(0);
      for (let count = 0; count < distribution.length; count += 1) {
        next[count]! += distribution[count]! * (1 - scatter[reel]!);
        next[count + 1]! += distribution[count]! * scatter[reel]!;
      }
      distribution = next;
    }
  }
  return distribution;
}

/** Chance a spin triggers free spins. */
export function triggerChance(config: SlotConfig): number {
  const distribution = scatterDistribution(config);
  let chance = 0;
  for (let count = config.mechanic.feature.trigger; count < distribution.length; count += 1) {
    chance += distribution[count]!;
  }
  return chance;
}

/** Expected raw pay of a single spin, before the feature. */
export function expectedSpinPay(config: SlotConfig): number {
  return config.mechanic.payMode === "ways"
    ? expectedWaysPay(config)
    : expectedLinePay(config) * config.mechanic.lines;
}

/**
 * Expected raw pay of a full round, feature included.
 *
 * Free spins are ordinary spins at a multiplier, and do not retrigger — the
 * same rule `playRound` implements.
 */
export function expectedRoundPay(config: SlotConfig): number {
  const { feature } = config.mechanic;
  const perSpin = expectedSpinPay(config);
  return perSpin * (1 + triggerChance(config) * feature.spins * feature.multiplier);
}

/**
 * The points-per-unit scale that puts this game on the arcade's shared value.
 *
 * A game whose raw pay cannot be computed — no paying combination at all — gets
 * a scale of zero rather than an Infinity that would silently pay a jackpot on
 * every spin.
 */
export function calibrate(config: SlotConfig): number {
  const raw = expectedRoundPay({ ...config, scale: 1 });
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  return TARGET_EV / raw;
}

/** Nominal return-to-player, for the game's info panel. */
export function theoreticalRtp(config: SlotConfig): number {
  return expectedRoundPay(config) * config.scale;
}

/** Ways advertised by a game, for its info panel. */
export function advertisedWays(config: SlotConfig): number {
  const { payMode, reels, rows, lines } = config.mechanic;
  return payMode === "ways" ? waysCount(reels, rows) : lines;
}
