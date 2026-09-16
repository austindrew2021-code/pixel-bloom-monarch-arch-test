/**
 * Blackjack against a dealer.
 *
 * Like video poker, what a hand is worth depends on how it is played, so the
 * payouts are calibrated against basic strategy — the standard chart, stated on
 * the game. Play it and a hand is worth the arcade's shared value; play worse
 * and it is worth less. There is no line of play that beats parity, which is
 * what keeps the leaderboard about luck rather than about who memorised a
 * chart.
 *
 * The shoe is fixed from the seed when the round opens and dealt from the top,
 * so the round is reproducible and the client never sees a card before it is
 * turned.
 */

import type { SeedStream } from "../games/rng.ts";
import { TARGET_EV } from "../games/types.ts";
import { deal, rankOf } from "./deck.ts";

/** Cards dealt into a round's shoe. Enough for a hand with splits and doubles. */
export const SHOE_SIZE = 24;

export type RuleSet = {
  id: string;
  name: string;
  /** Dealer draws on soft 17 rather than standing. */
  hitsSoft17: boolean;
  /** What a natural pays, as a multiple. */
  blackjackPays: number;
  /** Doubling allowed only on these totals; empty means any. */
  doubleOn: number[];
  /** Splitting pairs allowed. */
  allowSplit: boolean;
};

export const RULE_SETS: readonly RuleSet[] = [
  { id: "classic", name: "Classic", hitsSoft17: false, blackjackPays: 1.5, doubleOn: [], allowSplit: true },
  { id: "vegas", name: "Vegas Strip", hitsSoft17: true, blackjackPays: 1.5, doubleOn: [], allowSplit: true },
  { id: "downtown", name: "Downtown", hitsSoft17: true, blackjackPays: 1.5, doubleOn: [9, 10, 11], allowSplit: true },
  { id: "european", name: "European", hitsSoft17: false, blackjackPays: 1.5, doubleOn: [9, 10, 11], allowSplit: true },
  { id: "atlantic", name: "Atlantic", hitsSoft17: false, blackjackPays: 1.5, doubleOn: [10, 11], allowSplit: true },
  { id: "short-pay", name: "Short Pay", hitsSoft17: true, blackjackPays: 1.2, doubleOn: [], allowSplit: true },
  { id: "no-split", name: "Single Hand", hitsSoft17: false, blackjackPays: 1.5, doubleOn: [], allowSplit: false },
  { id: "double-down", name: "Double Down", hitsSoft17: false, blackjackPays: 1.5, doubleOn: [], allowSplit: true },
];

/** Blackjack value of a card: face cards ten, ace eleven before adjustment. */
export function cardValue(card: number): number {
  const rank = rankOf(card);
  if (rank >= 8 && rank <= 11) return 10; // ten, jack, queen, king
  if (rank === 12) return 11; // ace
  return rank + 2;
}

export function isAce(card: number): boolean {
  return rankOf(card) === 12;
}

export type HandValue = { total: number; soft: boolean; busted: boolean };

/**
 * Total a hand, demoting aces from eleven to one as needed. `soft` means an ace
 * is still counted high, which is what the dealer's soft-17 rule turns on.
 */
export function handValue(cards: readonly number[]): HandValue {
  let total = 0;
  let aces = 0;
  for (const card of cards) {
    total += cardValue(card);
    if (isAce(card)) aces += 1;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return { total, soft: aces > 0, busted: total > 21 };
}

export function isBlackjack(cards: readonly number[]): boolean {
  return cards.length === 2 && handValue(cards).total === 21;
}

export type Action = "hit" | "stand" | "double" | "split";

/** Actions legal right now, given the rules and what has been done. */
export function legalActions(
  rules: RuleSet,
  cards: readonly number[],
  alreadySplit: boolean,
): Action[] {
  const value = handValue(cards);
  if (value.busted || value.total === 21) return [];
  const actions: Action[] = ["hit", "stand"];
  if (cards.length === 2) {
    const canDouble = rules.doubleOn.length === 0 || rules.doubleOn.includes(value.total);
    if (canDouble) actions.push("double");
    if (
      rules.allowSplit &&
      !alreadySplit &&
      cardValue(cards[0]!) === cardValue(cards[1]!)
    ) {
      actions.push("split");
    }
  }
  return actions;
}

/**
 * Basic strategy.
 *
 * The published chart, trimmed to the actions this game offers. It is what the
 * payouts are calibrated against and what the game shows as a hint, so a player
 * following the on-screen suggestion is playing the strategy the maths assumes.
 */
export function basicStrategy(
  rules: RuleSet,
  cards: readonly number[],
  dealerUp: number,
  alreadySplit: boolean,
): Action {
  const legal = legalActions(rules, cards, alreadySplit);
  if (legal.length === 0) return "stand";
  const value = handValue(cards);
  const up = cardValue(dealerUp);
  const can = (action: Action) => legal.includes(action);

  // Pairs.
  if (can("split")) {
    const pair = cardValue(cards[0]!);
    if (pair === 11 || pair === 8) return "split";
    if (pair === 10 || pair === 5) {
      // Never split tens or fives; fall through to the hard totals below.
    } else if (pair === 9) {
      if (up !== 7 && up !== 10 && up !== 11) return "split";
    } else if (pair === 7 || pair === 3 || pair === 2) {
      if (up <= 7) return "split";
    } else if (pair === 6) {
      if (up <= 6) return "split";
    } else if (pair === 4) {
      if (up === 5 || up === 6) return "split";
    }
  }

  // Soft totals.
  if (value.soft) {
    if (value.total >= 19) return "stand";
    if (value.total === 18) {
      if (up >= 9) return "hit";
      if (up >= 3 && up <= 6 && can("double")) return "double";
      return "stand";
    }
    if (value.total === 17 && up >= 3 && up <= 6 && can("double")) return "double";
    if (value.total >= 15 && up >= 4 && up <= 6 && can("double")) return "double";
    if (value.total >= 13 && up >= 5 && up <= 6 && can("double")) return "double";
    return "hit";
  }

  // Hard totals.
  if (value.total >= 17) return "stand";
  if (value.total >= 13 && up <= 6) return "stand";
  if (value.total === 12) return up >= 4 && up <= 6 ? "stand" : "hit";
  if (value.total === 11) return can("double") ? "double" : "hit";
  if (value.total === 10) return up <= 9 && can("double") ? "double" : "hit";
  if (value.total === 9) return up >= 3 && up <= 6 && can("double") ? "double" : "hit";
  return "hit";
}

/** Play the dealer's hand out. */
export function playDealer(rules: RuleSet, cards: number[], shoe: number[], next: number): number {
  let cursor = next;
  for (;;) {
    const value = handValue(cards);
    if (value.busted) break;
    if (value.total > 17) break;
    if (value.total === 17 && !(value.soft && rules.hitsSoft17)) break;
    if (value.total < 17 || (value.total === 17 && value.soft && rules.hitsSoft17)) {
      const card = shoe[cursor];
      if (card === undefined) break;
      cards.push(card);
      cursor += 1;
      continue;
    }
    break;
  }
  return cursor;
}

export type HandOutcome = "win" | "lose" | "push" | "blackjack";

/** Settle one player hand against the dealer. */
export function outcomeOf(
  player: readonly number[],
  dealer: readonly number[],
  playerBlackjack: boolean,
): HandOutcome {
  const p = handValue(player);
  const d = handValue(dealer);
  if (p.busted) return "lose";
  if (playerBlackjack && !isBlackjack(dealer)) return "blackjack";
  if (playerBlackjack && isBlackjack(dealer)) return "push";
  if (isBlackjack(dealer)) return "lose";
  if (d.busted) return "win";
  if (p.total > d.total) return "win";
  if (p.total < d.total) return "lose";
  return "push";
}

/** Raw return of a hand, as a multiple of the stake. */
export function handReturn(rules: RuleSet, outcome: HandOutcome, stake: number): number {
  switch (outcome) {
    case "blackjack":
      return stake * (1 + rules.blackjackPays);
    case "win":
      return stake * 2;
    case "push":
      return stake;
    default:
      return 0;
  }
}

export function dealShoe(stream: SeedStream): number[] {
  return deal(stream, SHOE_SIZE);
}

/**
 * Points per unit of raw return, so basic strategy lands on the shared value.
 * Measured by `scripts/calibrate-cards.mjs` and re-checked in the tests.
 */
export const RULE_SCALES: Readonly<Record<string, number>> = {
  classic: 101.6065,
  vegas: 101.05,
  downtown: 101.5038,
  european: 99.8682,
  atlantic: 101.3853,
  "short-pay": 102.2777,
  "no-split": 100.4872,
  "double-down": 99.1785,
};

export function scaleFor(ruleId: string): number {
  return RULE_SCALES[ruleId] ?? 1;
}

export const TARGET = TARGET_EV;
export const BYTE_BUDGET = SHOE_SIZE * 4 + 256;
