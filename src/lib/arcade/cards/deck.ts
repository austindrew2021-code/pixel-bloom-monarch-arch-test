/**
 * Cards, and the hand ranking every poker-family game in the catalogue shares.
 *
 * A card is a single integer 0..51 — `rank * 4 + suit` — so a deck is a range,
 * a shuffle is a permutation of it, and nothing needs object allocation per
 * deal. Ranks run 0 (two) to 12 (ace).
 */

import type { SeedStream } from "../games/rng.ts";

export const RANKS = 13;
export const SUITS = 4;
export const DECK_SIZE = RANKS * SUITS;

export const RANK_LABELS = [
  "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A",
] as const;
export const SUIT_LABELS = ["♠", "♥", "♦", "♣"] as const;

export function rankOf(card: number): number {
  return Math.floor(card / SUITS);
}

export function suitOf(card: number): number {
  return card % SUITS;
}

export function cardLabel(card: number): string {
  return `${RANK_LABELS[rankOf(card)]}${SUIT_LABELS[suitOf(card)]}`;
}

/**
 * Deal `count` distinct cards with a partial Fisher–Yates shuffle over a fresh
 * deck. Partial rather than full so the entropy a deal needs is fixed and small
 * — a five-card draw costs five draws, not fifty-two.
 */
export function deal(stream: SeedStream, count: number, deckSize = DECK_SIZE): number[] {
  if (count > deckSize) throw new Error("cannot deal more cards than the deck holds");
  const deck = Array.from({ length: deckSize }, (_, i) => i);
  for (let i = 0; i < count; i += 1) {
    const j = i + stream.nextInt(deckSize - i);
    [deck[i], deck[j]] = [deck[j]!, deck[i]!];
  }
  return deck.slice(0, count);
}

/** Poker hand categories, weakest to strongest. */
export const HAND_CATEGORIES = [
  "high-card",
  "pair",
  "two-pair",
  "three-of-a-kind",
  "straight",
  "flush",
  "full-house",
  "four-of-a-kind",
  "straight-flush",
  "royal-flush",
] as const;

export type HandCategory = (typeof HAND_CATEGORIES)[number];

export type HandRank = {
  category: HandCategory;
  /** Index into HAND_CATEGORIES, for ordering. */
  level: number;
  /** The rank that defines the hand — the pair's rank, the quads' rank, etc. */
  primary: number;
  /** Secondary rank, for two pair and full houses. */
  secondary: number;
};

/**
 * Rank a five-card hand.
 *
 * Wheel straights (A-2-3-4-5) are handled explicitly: the ace is the high card
 * everywhere else, so a straight check that only looks at consecutive ranks
 * misses the one straight where it plays low.
 */
export function rankHand(cards: readonly number[]): HandRank {
  if (cards.length !== 5) throw new Error(`a hand is five cards, got ${cards.length}`);

  const rankCounts = new Array<number>(RANKS).fill(0);
  const suitCounts = new Array<number>(SUITS).fill(0);
  for (const card of cards) {
    rankCounts[rankOf(card)] += 1;
    suitCounts[suitOf(card)] += 1;
  }

  const flush = suitCounts.some((count) => count === 5);

  // Ranks present, high to low.
  const present: number[] = [];
  for (let rank = RANKS - 1; rank >= 0; rank -= 1) if (rankCounts[rank]! > 0) present.push(rank);

  let straightHigh = -1;
  if (present.length === 5) {
    if (present[0]! - present[4]! === 4) straightHigh = present[0]!;
    // A-5-4-3-2: the ace plays low and the straight is five-high.
    else if (present[0] === 12 && present[1] === 3 && present[4] === 0) straightHigh = 3;
  }

  // Group ranks by how many of them there are, strongest grouping first.
  const groups = present
    .map((rank) => ({ rank, count: rankCounts[rank]! }))
    .sort((a, b) => b.count - a.count || b.rank - a.rank);
  const primary = groups[0]?.rank ?? -1;
  const secondary = groups[1]?.rank ?? -1;
  const counts = groups.map((g) => g.count);

  const make = (category: HandCategory, p = primary, s = secondary): HandRank => ({
    category,
    level: HAND_CATEGORIES.indexOf(category),
    primary: p,
    secondary: s,
  });

  if (flush && straightHigh === 12) return make("royal-flush", straightHigh, -1);
  if (flush && straightHigh >= 0) return make("straight-flush", straightHigh, -1);
  if (counts[0] === 4) return make("four-of-a-kind");
  if (counts[0] === 3 && counts[1] === 2) return make("full-house");
  if (flush) return make("flush", present[0]!, -1);
  if (straightHigh >= 0) return make("straight", straightHigh, -1);
  if (counts[0] === 3) return make("three-of-a-kind");
  if (counts[0] === 2 && counts[1] === 2) return make("two-pair");
  if (counts[0] === 2) return make("pair");
  return make("high-card", present[0]!, -1);
}

/** Compare two hands. Positive when `a` beats `b`. */
export function compareHands(a: HandRank, b: HandRank): number {
  if (a.level !== b.level) return a.level - b.level;
  if (a.primary !== b.primary) return a.primary - b.primary;
  return a.secondary - b.secondary;
}
