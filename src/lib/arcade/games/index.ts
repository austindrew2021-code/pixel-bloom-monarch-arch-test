/**
 * The game registry.
 *
 * Every game resolves from the same (serverSeed, clientSeed, nonce) triple, so
 * one season commitment covers all of them and `/cascade/verify` can recompute
 * any round of any game from the revealed seed.
 */

import { BOARD_ROWS, playDrop } from "../plinko.ts";
import * as ascent from "./ascent.ts";
import * as coinflip from "./coinflip.ts";
import * as dice from "./dice.ts";
import * as hilo from "./hilo.ts";
import * as keno from "./keno.ts";
import * as mines from "./mines.ts";
import { createStream } from "./rng.ts";
import * as roulette from "./roulette.ts";
import * as scratch from "./scratch.ts";
import * as tower from "./tower.ts";
import * as tumble from "./tumble.ts";
import * as wheel from "./wheel.ts";
import { type GameId, type GameMeta, type GameResult } from "./types.ts";

export const GAMES: Readonly<Record<GameId, GameMeta>> = {
  plinko: {
    id: "plinko",
    name: "Drop",
    tagline: "Sixteen rows of pegs. The edges pay 1 in 65,536.",
    byteBudget: BOARD_ROWS,
    interactive: false,
  },
  coinflip: {
    id: "coinflip",
    name: "Coin Match",
    tagline: "Two to five coins. Every one the same way pays big.",
    byteBudget: coinflip.BYTE_BUDGET,
    interactive: false,
  },
  ascent: {
    id: "ascent",
    name: "Ascent",
    tagline: "Name your multiplier. It busts when it busts.",
    byteBudget: ascent.BYTE_BUDGET,
    interactive: false,
  },
  tumble: {
    id: "tumble",
    name: "Tumble",
    tagline: "Eight of a kind pays anywhere, then falls and pays again.",
    byteBudget: tumble.BYTE_BUDGET,
    interactive: false,
  },
  dice: {
    id: "dice",
    name: "Dice",
    tagline: "Set the line. Call it under or over.",
    byteBudget: dice.BYTE_BUDGET,
    interactive: false,
  },
  wheel: {
    id: "wheel",
    name: "Wheel",
    tagline: "Twenty segments. Pick how wild you want them.",
    byteBudget: wheel.BYTE_BUDGET,
    interactive: false,
  },
  roulette: {
    id: "roulette",
    name: "Roulette",
    tagline: "Single zero, and every bet pays its true odds.",
    byteBudget: roulette.BYTE_BUDGET,
    interactive: false,
  },
  keno: {
    id: "keno",
    name: "Keno",
    tagline: "Pick from forty. Ten come out.",
    byteBudget: keno.BYTE_BUDGET,
    interactive: false,
  },
  scratch: {
    id: "scratch",
    name: "Scratch",
    tagline: "Nine cells. Three of a kind pays.",
    byteBudget: scratch.BYTE_BUDGET,
    interactive: false,
  },
  mines: {
    id: "mines",
    name: "Mines",
    tagline: "Reveal tiles. Bank before you find one.",
    byteBudget: mines.BYTE_BUDGET,
    interactive: true,
  },
  hilo: {
    id: "hilo",
    name: "Hi-Lo",
    tagline: "Higher or lower, again and again.",
    byteBudget: hilo.BYTE_BUDGET,
    interactive: true,
  },
  tower: {
    id: "tower",
    name: "Tower",
    tagline: "Eight floors. One safe tile each.",
    byteBudget: tower.BYTE_BUDGET,
    interactive: true,
  },
};

export const GAME_IDS = Object.keys(GAMES) as GameId[];

export function isGameId(value: string): value is GameId {
  return Object.prototype.hasOwnProperty.call(GAMES, value);
}

/** Per-game choices a player makes before the round resolves. */
export type PlayOptions = {
  /** Coin Match: how many coins to flip. */
  coins?: number;
  /** Ascent and Dice: the multiplier or line to aim for. */
  target?: number;
  /** Mines: how many mines to bury. */
  mineCount?: number;
  /** Dice: which side of the line to call. */
  direction?: dice.Direction;
  /** Wheel: which risk tier to spin. */
  tier?: wheel.RiskTier;
  /** Roulette: the bet. */
  bet?: roulette.Bet;
  /** Keno: the numbers chosen. */
  picks?: number[];
  /** Tower: how hard a climb. */
  difficulty?: tower.Difficulty;
};

/**
 * Resolve a single-call game.
 *
 * Mines is excluded on purpose — it opens a round instead, because its outcome
 * depends on choices the player has not made yet.
 */
export async function playGame(
  gameId: GameId,
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  options: PlayOptions = {},
): Promise<GameResult> {
  const meta = GAMES[gameId];
  if (meta.interactive) {
    throw new Error(`${gameId} is played over a round, not a single call`);
  }
  const stream = await createStream(serverSeed, clientSeed, nonce, meta.byteBudget);

  switch (gameId) {
    case "plinko": {
      // Plinko predates the shared stream and derives its own bytes; kept as-is
      // so every drop already on the ledger still replays bit for bit.
      const drop = await playDrop(serverSeed, clientSeed, nonce);
      return {
        points: drop.points,
        detail: { path: drop.path, slot: drop.slot, rows: BOARD_ROWS },
      };
    }
    case "coinflip":
      return coinflip.play(stream, options.coins ?? coinflip.MIN_COINS);
    case "ascent":
      return ascent.play(stream, options.target ?? ascent.MIN_TARGET);
    case "tumble":
      return tumble.play(stream);
    case "dice":
      return dice.play(stream, options.target ?? 50, options.direction ?? "under");
    case "wheel":
      return wheel.play(stream, options.tier ?? "medium");
    case "roulette":
      return roulette.play(stream, options.bet ?? { kind: "red", selection: 0 });
    case "keno":
      return keno.play(stream, options.picks ?? [1, 2, 3, 4]);
    case "scratch":
      return scratch.play(stream);
    default:
      throw new Error(`unknown game: ${gameId}`);
  }
}

/** Open a Mines round: derive the board that the player will reveal against. */
export async function openMinesRound(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  mineCount: number,
): Promise<mines.MinesLayout> {
  const stream = await createStream(serverSeed, clientSeed, nonce, GAMES.mines.byteBudget);
  return mines.layout(stream, mineCount);
}

/** Open a Hi-Lo round: deal every card the chain could need. */
export async function openHiLoRound(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
): Promise<hilo.HiLoLayout> {
  const stream = await createStream(serverSeed, clientSeed, nonce, GAMES.hilo.byteBudget);
  return hilo.layout(stream, hilo.MAX_CALLS);
}

/** Open a Tower round: fix every floor's safe tiles. */
export async function openTowerRound(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  difficulty: tower.Difficulty,
): Promise<tower.TowerLayout> {
  const stream = await createStream(serverSeed, clientSeed, nonce, GAMES.tower.byteBudget);
  return tower.layout(stream, difficulty);
}

export { ascent, coinflip, dice, hilo, keno, mines, roulette, scratch, tower, tumble, wheel };
export * from "./types.ts";
