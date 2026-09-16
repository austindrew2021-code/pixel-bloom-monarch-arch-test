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
import * as mines from "./mines.ts";
import { createStream } from "./rng.ts";
import * as tumble from "./tumble.ts";
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
  mines: {
    id: "mines",
    name: "Mines",
    tagline: "Reveal tiles. Bank before you find one.",
    byteBudget: mines.BYTE_BUDGET,
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
  /** Ascent: the multiplier to aim for. */
  target?: number;
  /** Mines: how many mines to bury. */
  mineCount?: number;
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

export { ascent, coinflip, mines, tumble };
export * from "./types.ts";
