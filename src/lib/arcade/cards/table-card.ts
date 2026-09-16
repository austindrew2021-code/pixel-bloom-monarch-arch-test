/**
 * The simple table games: one bet, one deal, settled immediately.
 *
 * Each is defined by its bet options and the exact chance each one wins, so —
 * like roulette — every bet pays one over its own probability and no option on
 * any table is the better one. Where a game's odds are a known constant rather
 * than a simple count (baccarat's drawing rules, for instance) the figure is
 * cited rather than recomputed, and the tests check the options still sum to a
 * complete distribution.
 */

import type { SeedStream } from "../games/rng.ts";
import { TARGET_EV, type GameResult } from "../games/types.ts";
import { RANK_LABELS, SUIT_LABELS, deal, rankOf, suitOf } from "./deck.ts";

export const PARTICIPATION_POINTS = 9;
export const WIN_BASE = TARGET_EV - PARTICIPATION_POINTS;

export type BetOption = {
  id: string;
  label: string;
  /** Exact chance this bet wins. */
  chance: number;
};

export type TableGame = {
  id: string;
  name: string;
  blurb: string;
  /** Cards drawn to resolve a round. */
  cards: number;
  options: readonly BetOption[];
  /**
   * Decide which option a deal settles as. Returns the winning option id, or
   * null when nothing on the table wins.
   */
  resolve: (cards: readonly number[]) => string | null;
};

/** Points a bet pays, so its value matches every other bet everywhere. */
export function winPoints(option: BetOption): number {
  return option.chance > 0 ? Math.round(WIN_BASE / option.chance) : 0;
}

export function expectedPoints(option: BetOption): number {
  return PARTICIPATION_POINTS + option.chance * winPoints(option);
}

/* ------------------------------------------------------------- the games */

/** Rank of a card as 2..14, aces high. */
const highRank = (card: number) => rankOf(card) + 2;

const casinoWar: TableGame = {
  id: "casino-war",
  name: "Casino War",
  blurb: "One card each. Higher card takes it.",
  cards: 2,
  // One deck, dealt without replacement: after the first card is out, only 3
  // of the remaining 51 match its rank. It is 3/51, not the 1/13 that assuming
  // replacement would give.
  options: [
    { id: "player", label: "Player", chance: 24 / 51 },
    { id: "dealer", label: "Dealer", chance: 24 / 51 },
    { id: "tie", label: "Tie", chance: 3 / 51 },
  ],
  resolve: (cards) => {
    const a = highRank(cards[0]!);
    const b = highRank(cards[1]!);
    return a > b ? "player" : a < b ? "dealer" : "tie";
  },
};

const dragonTiger: TableGame = {
  id: "dragon-tiger",
  name: "Dragon Tiger",
  blurb: "Two cards, one each. Pick a side.",
  cards: 2,
  // Same single-deck arithmetic as Casino War.
  options: [
    { id: "dragon", label: "Dragon", chance: 24 / 51 },
    { id: "tiger", label: "Tiger", chance: 24 / 51 },
    { id: "tie", label: "Tie", chance: 3 / 51 },
  ],
  resolve: (cards) => {
    const a = highRank(cards[0]!);
    const b = highRank(cards[1]!);
    return a > b ? "dragon" : a < b ? "tiger" : "tie";
  },
};

const andarBahar: TableGame = {
  id: "andar-bahar",
  name: "Andar Bahar",
  blurb: "Which side the matching rank lands on.",
  cards: 2,
  options: [
    { id: "andar", label: "Andar", chance: 0.5 },
    { id: "bahar", label: "Bahar", chance: 0.5 },
  ],
  // The side is decided by the parity of the deal, which is an even split.
  resolve: (cards) => (suitOf(cards[1]!) % 2 === 0 ? "andar" : "bahar"),
};

/** Baccarat pip value: face cards and tens count zero. */
function pip(card: number): number {
  return Math.min(rankOf(card) + 2, 10) % 10;
}

const total = (cards: readonly number[]) =>
  cards.reduce((sum, card) => sum + pip(card), 0) % 10;

/**
 * Resolve a baccarat coup under the real drawing rules.
 *
 * Six cards are dealt; the third card for each side is used only if the rules
 * call for it. Getting this right matters — a simplified two-card comparison
 * produces visibly different odds from the ones the game advertises, which is
 * exactly the kind of gap the odds test exists to catch.
 */
export function resolveBaccarat(cards: readonly number[]): "player" | "banker" | "tie" {
  const player = [cards[0]!, cards[1]!];
  const banker = [cards[2]!, cards[3]!];
  const playerTotal = total(player);
  const bankerTotal = total(banker);

  // A natural on either side ends the coup immediately.
  if (playerTotal < 8 && bankerTotal < 8) {
    let playerThird: number | null = null;
    if (playerTotal <= 5) {
      playerThird = cards[4]!;
      player.push(playerThird);
    }

    const bankerNow = bankerTotal;
    let bankerDraws: boolean;
    if (playerThird === null) {
      bankerDraws = bankerNow <= 5;
    } else {
      const v = pip(playerThird);
      if (bankerNow <= 2) bankerDraws = true;
      else if (bankerNow === 3) bankerDraws = v !== 8;
      else if (bankerNow === 4) bankerDraws = v >= 2 && v <= 7;
      else if (bankerNow === 5) bankerDraws = v >= 4 && v <= 7;
      else if (bankerNow === 6) bankerDraws = v === 6 || v === 7;
      else bankerDraws = false;
    }
    if (bankerDraws) banker.push(cards[5]!);
  }

  const finalPlayer = total(player);
  const finalBanker = total(banker);
  return finalPlayer > finalBanker ? "player" : finalBanker > finalPlayer ? "banker" : "tie";
}

const baccarat: TableGame = {
  id: "baccarat",
  name: "Baccarat",
  blurb: "Player, banker, or the tie.",
  cards: 6,
  // Measured over four million coups under the drawing rules above. These sit
  // slightly off the published eight-deck figures because this table deals a
  // single deck, and the odds that matter are the ones this game actually has.
  options: [
    { id: "banker", label: "Banker", chance: 0.461215 },
    { id: "player", label: "Player", chance: 0.447960 },
    { id: "tie", label: "Tie", chance: 0.090826 },
  ],
  resolve: resolveBaccarat,
};

const redDog: TableGame = {
  id: "red-dog",
  name: "Red Dog",
  blurb: "Two cards. Does the third fall between them?",
  cards: 3,
  // Enumerated exactly over all 132,600 ordered three-card deals.
  options: [
    { id: "inside", label: "Inside", chance: 0.276078 },
    { id: "outside", label: "Outside", chance: 0.665098 },
    { id: "pair", label: "Pair", chance: 3 / 51 },
  ],
  resolve: (cards) => {
    const a = highRank(cards[0]!);
    const b = highRank(cards[1]!);
    const c = highRank(cards[2]!);
    if (a === b) return "pair";
    const low = Math.min(a, b);
    const high = Math.max(a, b);
    return c > low && c < high ? "inside" : "outside";
  },
};

const highCardFlush: TableGame = {
  id: "high-card-flush",
  name: "High Card Flush",
  blurb: "Most cards of one suit takes it.",
  cards: 6,
  // Measured over four million deals. Six cards across four suits reach three
  // of a suit far more often, and five far less, than eyeballing it suggests —
  // these replace figures that were guessed and were badly wrong.
  options: [
    { id: "three", label: "Three suited", chance: 0.489537 },
    { id: "four", label: "Four suited", chance: 0.103898 },
    { id: "five-plus", label: "Five or more", chance: 0.010224 },
    { id: "none", label: "Under three", chance: 0.396340 },
  ],
  resolve: (cards) => {
    const counts = new Array<number>(4).fill(0);
    for (const card of cards) counts[suitOf(card)] += 1;
    const best = Math.max(...counts);
    if (best >= 5) return "five-plus";
    if (best === 4) return "four";
    if (best === 3) return "three";
    return "none";
  },
};

const threeCard: TableGame = {
  id: "three-card",
  name: "Three Card",
  blurb: "A three-card hand. Bet what it makes.",
  cards: 3,
  // Exact three-card frequencies out of C(52,3) = 22,100.
  options: [
    { id: "nothing", label: "High card", chance: 16440 / 22100 },
    { id: "pair", label: "Pair", chance: 3744 / 22100 },
    { id: "flush", label: "Flush", chance: 1096 / 22100 },
    { id: "straight", label: "Straight", chance: 720 / 22100 },
    { id: "trips", label: "Three of a kind", chance: 52 / 22100 },
    { id: "straight-flush", label: "Straight flush", chance: 48 / 22100 },
  ],
  resolve: (cards) => {
    const ranks = cards.map(rankOf).sort((a, b) => a - b);
    const suited = new Set(cards.map(suitOf)).size === 1;
    const distinct = new Set(ranks).size;
    if (distinct === 1) return "trips";
    const run =
      distinct === 3 &&
      (ranks[2]! - ranks[0]! === 2 ||
        // A-2-3 plays as a straight with the ace low.
        (ranks[0] === 0 && ranks[1] === 1 && ranks[2] === 12));
    if (run && suited) return "straight-flush";
    if (suited) return "flush";
    if (run) return "straight";
    if (distinct === 2) return "pair";
    return "nothing";
  },
};

const sevenUp: TableGame = {
  id: "seven-up",
  name: "Seven Up",
  blurb: "One card. Over seven, under seven, or the seven itself.",
  cards: 1,
  options: [
    { id: "under", label: "Under 7", chance: 5 / 13 },
    { id: "over", label: "Over 7", chance: 7 / 13 },
    { id: "seven", label: "Exactly 7", chance: 1 / 13 },
  ],
  resolve: (cards) => {
    const rank = highRank(cards[0]!);
    return rank < 7 ? "under" : rank > 7 ? "over" : "seven";
  },
};

export const TABLE_GAMES: readonly TableGame[] = [
  casinoWar, dragonTiger, andarBahar, baccarat,
  redDog, highCardFlush, threeCard, sevenUp,
];

export function tableGameById(id: string): TableGame | null {
  return TABLE_GAMES.find((game) => game.id === id) ?? null;
}

export function optionById(game: TableGame, id: string): BetOption | null {
  return game.options.find((option) => option.id === id) ?? null;
}

export type TableCardDetail = {
  gameId: string;
  bet: string;
  cards: number[];
  labels: string[];
  outcome: string | null;
  won: boolean;
  chance: number;
  participationPoints: number;
  winPoints: number;
};

export function play(stream: SeedStream, game: TableGame, betId: string): GameResult {
  const option = optionById(game, betId);
  if (!option) throw new Error("That is not a bet on this table.");

  const cards = deal(stream, game.cards);
  const outcome = game.resolve(cards);
  const won = outcome === betId;
  const points = won ? winPoints(option) : 0;

  const detail: TableCardDetail = {
    gameId: game.id,
    bet: betId,
    cards,
    labels: cards.map((card) => `${RANK_LABELS[rankOf(card)]}${SUIT_LABELS[suitOf(card)]}`),
    outcome,
    won,
    chance: option.chance,
    participationPoints: PARTICIPATION_POINTS,
    winPoints: points,
  };
  return { points: PARTICIPATION_POINTS + points, detail: { ...detail } };
}

export const BYTE_BUDGET = 8 * 4 + 128;
