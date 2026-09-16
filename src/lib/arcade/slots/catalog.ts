/**
 * The catalogue: every theme crossed with every mechanic, each one calibrated.
 *
 * 40 themes × 7 mechanics = 280 titles, built from data rather than written out.
 * Each is given a volatility tier that changes how its wins are shaped — how
 * often they land and how large they are — and then `calibrate` computes the
 * exact scale that puts its mean back on the arcade's shared value.
 *
 * That combination is the whole design: 280 games that feel different to play
 * and are worth precisely the same to a player chasing the leaderboard. Nobody
 * has to hunt for the game that pays best, because there isn't one.
 */

import { calibrate } from "./ev.ts";
import { MECHANICS } from "./mechanics.ts";
import { THEMES } from "./themes.ts";
import type { Mechanic, SlotConfig, SlotSymbol, Theme } from "./types.ts";

/**
 * Volatility tiers, low to extreme.
 *
 * `highWeight` thins out the top symbols, `ladder` steepens what a longer run
 * multiplies by, and `wildWeight` sets how often wilds rescue a run. A high tier
 * pays rarely and hugely; a low tier pays often and small. Calibration then
 * equalises the mean across all of them.
 */
const VOLATILITY = [
  { id: "low", name: "Low", highWeight: 1.0, ladder: 3.0, wildWeight: 4.0 },
  { id: "mid", name: "Medium", highWeight: 0.8, ladder: 3.6, wildWeight: 3.2 },
  { id: "high", name: "High", highWeight: 0.62, ladder: 4.4, wildWeight: 2.6 },
  { id: "wild", name: "Very high", highWeight: 0.48, ladder: 5.4, wildWeight: 2.0 },
  { id: "extreme", name: "Extreme", highWeight: 0.36, ladder: 6.6, wildWeight: 1.6 },
] as const;

export type Volatility = (typeof VOLATILITY)[number];

/** Base value of each paying symbol, lowest to highest. */
const SYMBOL_BASE = [2, 3, 5, 9, 16, 45];

/** Base weight of each paying symbol before the volatility tier thins the top. */
const SYMBOL_WEIGHT = [24, 20, 16, 12, 8, 5];

const SCATTER_WEIGHT = 5.5;

function buildSymbols(theme: Theme, mechanic: Mechanic, tier: Volatility): SlotSymbol[] {
  const { minRun, reels } = mechanic;
  const symbols: SlotSymbol[] = SYMBOL_BASE.map((base, index) => {
    const pays: Record<number, number> = {};
    // A run pays its base value, then multiplies by the tier's ladder for each
    // reel beyond the minimum.
    for (let run = minRun; run <= reels; run += 1) {
      pays[run] = Math.round(base * tier.ladder ** (run - minRun) * 10) / 10;
    }
    return {
      id: `${theme.id}-${index}`,
      glyph: theme.glyphs[index] ?? "◆",
      kind: "pay",
      pays,
    };
  });

  symbols.push({
    id: `${theme.id}-wild`,
    glyph: theme.glyphs[6] ?? "✦",
    kind: "wild",
    pays: {},
  });
  symbols.push({
    id: `${theme.id}-scatter`,
    glyph: theme.glyphs[7] ?? "★",
    kind: "scatter",
    pays: {},
  });
  return symbols;
}

/**
 * Weights per reel.
 *
 * Later reels carry slightly fewer high symbols, which is what makes a long run
 * feel like it is fighting for the last reel rather than arriving by accident.
 */
function buildWeights(mechanic: Mechanic, tier: Volatility): number[][] {
  const weights: number[][] = [];
  for (let reel = 0; reel < mechanic.reels; reel += 1) {
    const taper = 1 - reel * 0.06;
    const row = SYMBOL_WEIGHT.map((weight, index) => {
      // Only the top half is thinned; the low symbols keep the reels busy.
      const highness = index / (SYMBOL_WEIGHT.length - 1);
      const factor = 1 - highness * (1 - tier.highWeight);
      return Math.max(0.5, weight * factor * (index >= 3 ? taper : 1));
    });
    // Wilds are absent from the first reel, the usual rule: it keeps a run from
    // starting on nothing and makes the wild feel like a save, not a gift.
    row.push(reel === 0 ? 0 : tier.wildWeight);
    row.push(SCATTER_WEIGHT);
    weights.push(row);
  }
  return weights;
}

export type CatalogEntry = SlotConfig & {
  themeId: string;
  mechanicId: string;
  volatility: Volatility;
};

function buildEntry(theme: Theme, themeIndex: number, mechanic: Mechanic, mechanicIndex: number): CatalogEntry {
  // Spread tiers across the grid so no theme or mechanic is all one volatility.
  const tier = VOLATILITY[(themeIndex * 3 + mechanicIndex * 2) % VOLATILITY.length]!;
  const base: SlotConfig = {
    id: `${theme.id}-${mechanic.id}`,
    name: `${theme.name} ${mechanic.name}`,
    theme,
    mechanic,
    symbols: buildSymbols(theme, mechanic, tier),
    weights: buildWeights(mechanic, tier),
    scale: 1,
  };
  return {
    ...base,
    scale: calibrate(base),
    themeId: theme.id,
    mechanicId: mechanic.id,
    volatility: tier,
  };
}

let cache: CatalogEntry[] | null = null;

/**
 * The full catalogue. Built once and memoised — calibration is cheap, but every
 * request would otherwise recompute 280 games' worth of it.
 */
export function catalog(): CatalogEntry[] {
  if (cache) return cache;
  const entries: CatalogEntry[] = [];
  THEMES.forEach((theme, themeIndex) => {
    MECHANICS.forEach((mechanic, mechanicIndex) => {
      entries.push(buildEntry(theme, themeIndex, mechanic, mechanicIndex));
    });
  });
  cache = entries;
  return entries;
}

export function slotById(id: string): CatalogEntry | null {
  return catalog().find((entry) => entry.id === id) ?? null;
}

export function catalogSize(): number {
  return catalog().length;
}

/** Lightweight rows for the lobby — no reel weights or paytables. */
export type LobbyEntry = {
  id: string;
  name: string;
  /** Gradient angle for the card, varied per mechanic. */
  angle: number;
  themeId: string;
  mechanicId: string;
  mechanicName: string;
  volatility: string;
  reels: number;
  rows: number;
  ways: number;
  backdrop: readonly [string, string];
  glow: string;
  glyph: string;
  palette: readonly string[];
};

export function lobby(): LobbyEntry[] {
  const mechanicOrder = new Map(MECHANICS.map((m, index) => [m.id, index]));
  return catalog().map((entry) => ({
    id: entry.id,
    name: entry.name,
    angle: 120 + (mechanicOrder.get(entry.mechanicId) ?? 0) * 24,
    themeId: entry.themeId,
    mechanicId: entry.mechanicId,
    mechanicName: entry.mechanic.name,
    volatility: entry.volatility.name,
    reels: entry.mechanic.reels,
    rows: entry.mechanic.rows,
    ways: entry.mechanic.payMode === "ways"
      ? entry.mechanic.rows ** entry.mechanic.reels
      : entry.mechanic.lines,
    backdrop: entry.theme.backdrop,
    glow: entry.theme.glow,
    // Cover art rotates through the theme's own faces by mechanic, so the seven
    // titles sharing a theme look like seven games on a shelf rather than one
    // game listed seven times.
    glyph: coverGlyph(entry.theme, mechanicOrder.get(entry.mechanicId) ?? 0),
    palette: entry.theme.palette,
  }));
}

/** Pick a distinct face per mechanic, favouring the theme's motif symbols. */
function coverGlyph(theme: Theme, mechanicIndex: number): string {
  // Faces 3..7 are the motif and special symbols; 0..2 are the plain low-pays,
  // which make poor cover art.
  const candidates = theme.glyphs.slice(3);
  return candidates[mechanicIndex % candidates.length] ?? theme.glyphs[5] ?? "★";
}
