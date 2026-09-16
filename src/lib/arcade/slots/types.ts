/**
 * The data a slot is made of.
 *
 * No slot in the catalogue has code of its own. A game is a mechanic (grid
 * shape, how wins are counted, feature rules) plus a theme (palette, symbol
 * glyphs, name) plus a symbol weight table — and one engine reads all of it.
 * That is how a studio ships hundreds of titles, and it is what makes adding
 * the 281st game a data change rather than a build.
 */

export type SymbolKind = "pay" | "wild" | "scatter";

export type SlotSymbol = {
  id: string;
  glyph: string;
  kind: SymbolKind;
  /** Payout units by run length. Sparse: a missing length pays nothing. */
  pays: Readonly<Record<number, number>>;
};

/** How a win is counted across the grid. */
export type PayMode =
  /** Fixed lines, each paying only its single best symbol. */
  | "lines"
  /** Every adjacent-from-the-left combination pays, all symbols at once. */
  | "ways";

export type FeatureSpec = {
  /** Scatters needed to trigger free spins. */
  trigger: number;
  /** Free spins awarded. */
  spins: number;
  /** Multiplier applied to wins during free spins. */
  multiplier: number;
};

export type Mechanic = {
  id: string;
  name: string;
  reels: number;
  rows: number;
  payMode: PayMode;
  /**
   * Payline count. For `ways` this is unused; the engine derives the ways
   * count from the grid shape.
   */
  lines: number;
  /** Shortest run that pays. */
  minRun: number;
  feature: FeatureSpec;
};

export type Theme = {
  id: string;
  name: string;
  /** Background gradient stops. */
  backdrop: readonly [string, string];
  /** Accents, low-pay to high-pay. */
  palette: readonly string[];
  /** Symbol faces, low-pay first; the last two are wild and scatter. */
  glyphs: readonly string[];
  /** Colour of win glows and particles. */
  glow: string;
};

export type SlotConfig = {
  id: string;
  name: string;
  theme: Theme;
  mechanic: Mechanic;
  symbols: readonly SlotSymbol[];
  /** Symbol weights per reel: `weights[reel][symbolIndex]`. */
  weights: readonly (readonly number[])[];
  /**
   * Points per unit of raw pay, chosen so this game's expected value matches
   * every other game in the arcade. Computed exactly — see `ev.ts`.
   */
  scale: number;
};

/** One resolved spin: the grid plus everything won on it. */
export type SpinResult = {
  /** `grid[reel][row]` as symbol indices. */
  grid: number[][];
  wins: WinLine[];
  scatters: number;
  rawPay: number;
};

export type WinLine = {
  /** Payline index for `lines`, or -1 for a ways win. */
  line: number;
  symbol: number;
  run: number;
  /** Cells that made the win, as [reel, row] pairs. */
  cells: [number, number][];
  pay: number;
  /** Ways multiplier for `ways` wins; 1 for a line win. */
  ways: number;
};

export type RoundResult = {
  base: SpinResult;
  freeSpins: SpinResult[];
  featureTriggered: boolean;
  multiplier: number;
  rawPay: number;
  points: number;
};
