/**
 * Hi-Lo — call the next card higher or lower, keep going, bank when you like.
 *
 * Cards are drawn with replacement, so every call depends only on the card
 * showing and the multiplier is exactly one over the chance you just took. That
 * makes banking worth the same after one correct call as after twenty: the
 * chain is a variance dial, not a puzzle with a right answer.
 *
 * Ties count for both calls, which is what stops an ace or a king being a free
 * round — they are the safest calls precisely because they pay the least.
 */

import type { SeedStream } from "./rng.ts";
import { TARGET_EV, type GameResult } from "./types.ts";

/** Ranks 1..13, ace low through king. */
export const RANKS = 13;

export const SUITS = ["♠", "♥", "♦", "♣"] as const;

export type Call = "higher" | "lower";

export type Card = { rank: number; suit: number };

export type HiLoLayout = { cards: Card[] };

export type HiLoDetail = {
  cards: Card[];
  calls: Call[];
  banked: boolean;
  multiplier: number;
  points: number;
};

export function isValidCall(call: string): call is Call {
  return call === "higher" || call === "lower";
}

/**
 * Chance a call succeeds against the card showing. Ties count as a win for
 * both directions, so the two chances sum to more than one — the cost of that
 * generosity is priced straight into the multiplier.
 */
export function callChance(rank: number, call: Call): number {
  if (call === "higher") return (RANKS - rank + 1) / RANKS;
  return rank / RANKS;
}

export function succeeds(showing: number, next: number, call: Call): boolean {
  return call === "higher" ? next >= showing : next <= showing;
}

/** The multiplier a chain has earned — the reciprocal of the risk taken. */
export function chainMultiplier(cards: readonly Card[], calls: readonly Call[]): number {
  let multiplier = 1;
  for (let i = 0; i < calls.length; i += 1) {
    const showing = cards[i]?.rank;
    if (showing === undefined) break;
    multiplier /= callChance(showing, calls[i]!);
  }
  return multiplier;
}

export function pointsFor(cards: readonly Card[], calls: readonly Call[]): number {
  if (calls.length === 0) return 0;
  return Math.max(1, Math.round(TARGET_EV * chainMultiplier(cards, calls)));
}

/** Expected points for a player who commits to banking after `calls` calls. */
export function expectedPoints(cards: readonly Card[], calls: readonly Call[]): number {
  let survival = 1;
  for (let i = 0; i < calls.length; i += 1) {
    const showing = cards[i]?.rank;
    if (showing === undefined) break;
    survival *= callChance(showing, calls[i]!);
  }
  return survival * pointsFor(cards, calls);
}

export function drawCard(stream: SeedStream): Card {
  return { rank: stream.nextInt(RANKS) + 1, suit: stream.nextInt(SUITS.length) };
}

/**
 * Deal the whole chain up front.
 *
 * Every card the round could ever need is fixed when it opens, exactly like the
 * Mines board, so the outcome is derivable from the seed and cannot depend on
 * when the player clicks. The client is shown one card at a time.
 */
export function layout(stream: SeedStream, length: number): HiLoLayout {
  const cards: Card[] = [];
  for (let i = 0; i <= length; i += 1) cards.push(drawCard(stream));
  return { cards };
}

/** Longest chain a round allows, which bounds its entropy budget. */
export const MAX_CALLS = 15;

export function settle(
  layout: HiLoLayout,
  calls: readonly Call[],
  banked: boolean,
): GameResult {
  const points = banked ? pointsFor(layout.cards, calls) : 0;
  const detail: HiLoDetail = {
    cards: layout.cards.slice(0, calls.length + 1),
    calls: [...calls],
    banked,
    multiplier: chainMultiplier(layout.cards, calls),
    points,
  };
  return { points, detail: { ...detail } };
}

export const BYTE_BUDGET = (MAX_CALLS + 2) * 8 + 128;
