/**
 * The contract every Cascade game meets.
 *
 * The important shared property is `TARGET_EV`. Players rank against each other
 * on one leaderboard from one shared budget of free drops, so if any game paid
 * more per drop than the others, the rational move would be to play only that
 * game and every other game would be decoration. Each game is therefore tuned
 * to the same expected points per drop, and `games.test.ts` asserts it — twice
 * over for the games whose maths is closed-form, and by large sample for the
 * one that is not.
 *
 * Variety then comes from the shape of the distribution rather than its mean:
 * Plinko is many small wins with a rare jackpot, Coin Match is a coin-flip
 * gamble, Ascent lets the player choose their own variance, Tumble is streaky,
 * and Mines is a sequence of decisions. Equal value, different feel.
 */

export const TARGET_EV = 99;

export type GameId = "plinko" | "coinflip" | "ascent" | "tumble" | "mines";

export type GameMeta = {
  id: GameId;
  name: string;
  tagline: string;
  /** Bytes the round may draw from the seed stream. */
  byteBudget: number;
  /** Multi-request games open a round and are resolved by later calls. */
  interactive: boolean;
};

/**
 * Plain JSON. Round detail crosses the server-function boundary and is stored
 * as jsonb, so it has to be provably serializable — an `unknown` here fails
 * TanStack's return-type check rather than failing at runtime.
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type GameResult = {
  points: number;
  /** Replay data, stored so the round can be re-derived and re-drawn. */
  detail: { [key: string]: JsonValue };
};
