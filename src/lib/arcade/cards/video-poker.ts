/**
 * Video poker — five cards, hold what you want, draw the rest.
 *
 * A real decision game, which creates a problem the rest of the arcade does not
 * have: what a hand is worth depends on how well it is played, so a strong
 * player could out-earn every other game and the leaderboard would stop being
 * about luck. Two things resolve it.
 *
 * First, each paytable is calibrated against the same published reference
 * strategy — the one the game itself shows as a hint. Follow it and a hand is
 * worth the arcade's shared value; play worse and it is worth less. Nobody can
 * get more than parity out of it.
 *
 * Second, that reference strategy is the whole strategy. It is stated on the
 * game, so there is no hidden edge for a player who has memorised a chart.
 */

import type { SeedStream } from "../games/rng.ts";
import { TARGET_EV, type GameResult } from "../games/types.ts";
import { deal, rankHand, rankOf, suitOf, type HandCategory } from "./deck.ts";

export const HAND_SIZE = 5;

/** What each hand category pays, in raw units. Zero means it does not pay. */
export type PayTable = Readonly<Partial<Record<HandCategory, number>>>;

export type PayTableFamily = {
  id: string;
  name: string;
  /** Lowest pair rank that pays, 0 = twos. Jacks are rank 9. */
  minPayingPair: number;
  table: PayTable;
};

/**
 * The paytable families. These are what separate one video poker title from
 * another in a real cabinet — the rules and the deal are identical, and the
 * payout column is the game.
 */
export const FAMILIES: readonly PayTableFamily[] = [
  {
    id: "jacks-or-better", name: "Jacks or Better", minPayingPair: 9,
    table: { pair: 1, "two-pair": 2, "three-of-a-kind": 3, straight: 4, flush: 6, "full-house": 9, "four-of-a-kind": 25, "straight-flush": 50, "royal-flush": 800 },
  },
  {
    id: "tens-or-better", name: "Tens or Better", minPayingPair: 8,
    table: { pair: 1, "two-pair": 2, "three-of-a-kind": 3, straight: 4, flush: 6, "full-house": 8, "four-of-a-kind": 25, "straight-flush": 50, "royal-flush": 800 },
  },
  {
    id: "bonus-poker", name: "Bonus Poker", minPayingPair: 9,
    table: { pair: 1, "two-pair": 2, "three-of-a-kind": 3, straight: 4, flush: 5, "full-house": 8, "four-of-a-kind": 40, "straight-flush": 50, "royal-flush": 800 },
  },
  {
    id: "double-bonus", name: "Double Bonus", minPayingPair: 9,
    table: { pair: 1, "two-pair": 1, "three-of-a-kind": 3, straight: 5, flush: 7, "full-house": 9, "four-of-a-kind": 50, "straight-flush": 50, "royal-flush": 800 },
  },
  {
    id: "double-double", name: "Double Double Bonus", minPayingPair: 9,
    table: { pair: 1, "two-pair": 1, "three-of-a-kind": 3, straight: 4, flush: 6, "full-house": 9, "four-of-a-kind": 60, "straight-flush": 50, "royal-flush": 800 },
  },
  {
    id: "aces-and-faces", name: "Aces and Faces", minPayingPair: 9,
    table: { pair: 1, "two-pair": 2, "three-of-a-kind": 3, straight: 4, flush: 5, "full-house": 8, "four-of-a-kind": 45, "straight-flush": 50, "royal-flush": 800 },
  },
  {
    id: "all-american", name: "All American", minPayingPair: 9,
    table: { pair: 1, "two-pair": 1, "three-of-a-kind": 3, straight: 8, flush: 8, "full-house": 8, "four-of-a-kind": 40, "straight-flush": 200, "royal-flush": 800 },
  },
  {
    id: "faces-wild", name: "Royal Court", minPayingPair: 10,
    table: { pair: 2, "two-pair": 3, "three-of-a-kind": 4, straight: 5, flush: 7, "full-house": 10, "four-of-a-kind": 30, "straight-flush": 60, "royal-flush": 900 },
  },
  {
    id: "flush-attack", name: "Flush Attack", minPayingPair: 9,
    table: { pair: 1, "two-pair": 2, "three-of-a-kind": 3, straight: 4, flush: 9, "full-house": 9, "four-of-a-kind": 30, "straight-flush": 60, "royal-flush": 800 },
  },
  {
    id: "straight-shot", name: "Straight Shot", minPayingPair: 9,
    table: { pair: 1, "two-pair": 2, "three-of-a-kind": 3, straight: 9, flush: 6, "full-house": 9, "four-of-a-kind": 30, "straight-flush": 80, "royal-flush": 800 },
  },
  {
    id: "quad-hunter", name: "Quad Hunter", minPayingPair: 10,
    table: { pair: 1, "two-pair": 2, "three-of-a-kind": 3, straight: 4, flush: 5, "full-house": 7, "four-of-a-kind": 90, "straight-flush": 100, "royal-flush": 800 },
  },
  {
    id: "royal-run", name: "Royal Run", minPayingPair: 9,
    table: { pair: 1, "two-pair": 2, "three-of-a-kind": 3, straight: 4, flush: 5, "full-house": 8, "four-of-a-kind": 25, "straight-flush": 50, "royal-flush": 1600 },
  },
];

/** Raw pay of a final hand under a family's table. */
export function handPay(family: PayTableFamily, cards: readonly number[]): number {
  const rank = rankHand(cards);
  if (rank.category === "pair" && rank.primary < family.minPayingPair) return 0;
  return family.table[rank.category] ?? 0;
}

/* --------------------------------------------------------------- strategy */

/** Which of the five dealt cards the reference strategy keeps. */
export type Hold = boolean[];

function counts(cards: readonly number[]) {
  const byRank = new Array<number>(13).fill(0);
  const bySuit = new Array<number>(4).fill(0);
  for (const card of cards) {
    byRank[rankOf(card)] += 1;
    bySuit[suitOf(card)] += 1;
  }
  return { byRank, bySuit };
}

function holdWhere(cards: readonly number[], test: (card: number) => boolean): Hold {
  return cards.map(test);
}

/**
 * The reference strategy, in priority order.
 *
 * Simple enough to print on the game and follow by eye, which is the point: the
 * calibration assumes this strategy, so it has to be a strategy a player can
 * actually use. It is close to optimal but not identical — a perfect chart is
 * far longer, and the small difference is worth less than the honesty of
 * publishing the exact rule the payout is tuned against.
 */
export function referenceHold(family: PayTableFamily, cards: readonly number[]): Hold {
  const rank = rankHand(cards);
  const { byRank, bySuit } = counts(cards);

  // Anything already paying big stands.
  if (
    rank.category === "royal-flush" ||
    rank.category === "straight-flush" ||
    rank.category === "four-of-a-kind" ||
    rank.category === "full-house" ||
    rank.category === "flush" ||
    rank.category === "straight"
  ) {
    return cards.map(() => true);
  }

  if (rank.category === "three-of-a-kind" || rank.category === "two-pair") {
    return holdWhere(cards, (card) => byRank[rankOf(card)]! >= 2);
  }

  // Four to a flush.
  const flushSuit = bySuit.findIndex((count) => count === 4);
  if (flushSuit >= 0) return holdWhere(cards, (card) => suitOf(card) === flushSuit);

  if (rank.category === "pair" && rank.primary >= family.minPayingPair) {
    return holdWhere(cards, (card) => rankOf(card) === rank.primary);
  }

  // Four to an outside straight.
  const present = [...new Set(cards.map(rankOf))].sort((a, b) => a - b);
  for (let start = 0; start + 3 < present.length + 1; start += 1) {
    const window = present.slice(start, start + 4);
    if (window.length === 4 && window[3]! - window[0]! === 3) {
      const keep = new Set(window);
      return holdWhere(cards, (card) => keep.has(rankOf(card)));
    }
  }

  // A low pair beats holding high cards.
  if (rank.category === "pair") {
    return holdWhere(cards, (card) => rankOf(card) === rank.primary);
  }

  // Otherwise keep the high cards and redraw the rest.
  const highCards = cards.filter((card) => rankOf(card) >= family.minPayingPair);
  if (highCards.length > 0) {
    return holdWhere(cards, (card) => rankOf(card) >= family.minPayingPair);
  }

  // Nothing worth keeping.
  return cards.map(() => false);
}

/* ------------------------------------------------------------------- play */

export type VideoPokerDetail = {
  dealt: number[];
  held: boolean[];
  final: number[];
  category: HandCategory;
  rawPay: number;
  points: number;
  suggested: boolean[];
};

/** Draw replacements for every card not held. */
export function drawReplacements(
  stream: SeedStream,
  dealt: readonly number[],
  held: readonly boolean[],
): number[] {
  const used = new Set(dealt);
  const final = [...dealt];
  for (let i = 0; i < final.length; i += 1) {
    if (held[i]) continue;
    // Draw from the cards still in the deck, so a replacement never duplicates
    // one already on the table.
    let card: number;
    do {
      card = stream.nextInt(52);
    } while (used.has(card));
    used.add(card);
    final[i] = card;
  }
  return final;
}

export function dealHand(stream: SeedStream): number[] {
  return deal(stream, HAND_SIZE);
}

export function settle(
  family: PayTableFamily,
  scale: number,
  dealt: readonly number[],
  held: readonly boolean[],
  final: readonly number[],
): GameResult {
  const rawPay = handPay(family, final);
  const points = rawPay > 0 ? Math.max(1, Math.round(rawPay * scale)) : 0;
  const detail: VideoPokerDetail = {
    dealt: [...dealt],
    held: [...held],
    final: [...final],
    category: rankHand(final).category,
    rawPay,
    points,
    suggested: referenceHold(family, dealt),
  };
  return { points, detail: { ...detail } };
}

/**
 * Points per raw unit for a family, so reference play lands on the shared value.
 *
 * Measured, not derived: the value depends on the strategy, and a closed form
 * would have to enumerate 2.6 million deals against every hold pattern. The
 * figures are computed once by `scripts/calibrate-cards.mjs` and re-checked by
 * `video-poker.test.ts`.
 */
export const FAMILY_SCALES: Readonly<Record<string, number>> = {
  "jacks-or-better": 103.2514,
  "tens-or-better": 99.2506,
  "bonus-poker": 99.5675,
  "double-bonus": 106.7414,
  "double-double": 105.3276,
  "aces-and-faces": 100.3116,
  "all-american": 102.3891,
  "faces-wild": 73.0331,
  "flush-attack": 96.51,
  "straight-shot": 92.123,
  "quad-hunter": 92.5645,
  "royal-run": 105.2911,
};

export function scaleFor(familyId: string): number {
  return FAMILY_SCALES[familyId] ?? 1;
}

/** Play a full hand using the reference strategy — used for calibration. */
export function playReference(stream: SeedStream, family: PayTableFamily): GameResult {
  const dealt = dealHand(stream);
  const held = referenceHold(family, dealt);
  const final = drawReplacements(stream, dealt, held);
  return settle(family, scaleFor(family.id), dealt, held, final);
}

export const BYTE_BUDGET = 5 * 4 + 5 * 8 * 4 + 256;

export const TARGET = TARGET_EV;
