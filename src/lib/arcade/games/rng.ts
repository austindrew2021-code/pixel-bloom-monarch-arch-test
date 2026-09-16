/**
 * The shared random stream every game draws from.
 *
 * One fairness chain, many games: bytes come from the same
 * HMAC(serverSeed, clientSeed:nonce:cursor) derivation the board already used,
 * so adding a game adds nothing new for a player to trust. Given the revealed
 * season seed, any round of any game can be recomputed exactly.
 *
 * The stream is created with a fixed byte budget and is deliberately strict
 * about running out: a game that silently wrapped around or fell back to
 * Math.random would produce outcomes nobody could verify.
 */

import { deriveBytes } from "../fair.ts";

export class SeedStream {
  private cursor = 0;
  private readonly bytes: readonly number[];

  // Written out rather than declared as a constructor parameter property:
  // those emit runtime code, which Node's type-stripping test runner rejects.
  constructor(bytes: readonly number[]) {
    this.bytes = bytes;
  }

  /** Bytes drawn so far. Useful for asserting a game stays inside its budget. */
  get used(): number {
    return this.cursor;
  }

  get remaining(): number {
    return this.bytes.length - this.cursor;
  }

  nextByte(): number {
    const byte = this.bytes[this.cursor];
    if (byte === undefined) {
      throw new Error(
        `seed stream exhausted after ${this.cursor} bytes — raise the game's byte budget`,
      );
    }
    this.cursor += 1;
    return byte;
  }

  /** A 32-bit unsigned integer, big-endian over four bytes. */
  nextUint32(): number {
    return (
      this.nextByte() * 0x1000000 +
      this.nextByte() * 0x10000 +
      this.nextByte() * 0x100 +
      this.nextByte()
    );
  }

  /** A float in [0, 1). */
  nextFloat(): number {
    return this.nextUint32() / 0x100000000;
  }

  /**
   * A uniform integer in [0, maxExclusive).
   *
   * Rejection sampling, not modulo: `x % n` over a 32-bit draw is biased toward
   * low values whenever n does not divide 2^32, which would quietly make some
   * grid positions and symbols more common than the paytable assumes.
   */
  nextInt(maxExclusive: number): number {
    if (!Number.isInteger(maxExclusive) || maxExclusive < 1) {
      throw new Error(`maxExclusive must be a positive integer, got ${maxExclusive}`);
    }
    if (maxExclusive === 1) return 0;
    const limit = Math.floor(0x100000000 / maxExclusive) * maxExclusive;
    for (;;) {
      const draw = this.nextUint32();
      if (draw < limit) return draw % maxExclusive;
      // Landed in the ragged tail above the last whole multiple; draw again so
      // every value keeps exactly equal probability.
    }
  }

  /** True with probability `chance` (0..1). */
  nextChance(chance: number): boolean {
    return this.nextFloat() < chance;
  }

  /** Pick an index from weights, proportional to each weight. */
  nextWeighted(weights: readonly number[]): number {
    const total = weights.reduce((a, b) => a + b, 0);
    if (total <= 0) throw new Error("weights must sum to a positive number");
    // Scale a float draw across the total so weights need not be integers.
    let roll = this.nextFloat() * total;
    for (let i = 0; i < weights.length; i += 1) {
      roll -= weights[i]!;
      if (roll < 0) return i;
    }
    return weights.length - 1;
  }
}

/**
 * Build the stream for one round.
 *
 * `byteBudget` is declared per game and derived up front so the stream itself
 * is synchronous — games read from it in ordinary loops rather than awaiting
 * every draw, which keeps the outcome logic simple enough to audit by eye.
 */
export async function createStream(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  byteBudget: number,
): Promise<SeedStream> {
  return new SeedStream(await deriveBytes(serverSeed, clientSeed, nonce, byteBudget));
}
