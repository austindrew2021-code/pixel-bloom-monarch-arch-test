/**
 * Provably-fair derivation for Cascade drops.
 *
 * The problem this solves: the outcome of a drop is decided by the server, and
 * players have to take the server's word that it was not decided *against*
 * them. Commit-reveal removes the need for that trust.
 *
 *   1. Before a season opens, the server generates a random `serverSeed` and
 *      publishes only `sha256(serverSeed)` — the commitment.
 *   2. Each player holds a `clientSeed` they can rotate at any time, and every
 *      drop carries a monotonically increasing `nonce`.
 *   3. A drop's path is derived from HMAC-SHA256(serverSeed, clientSeed:nonce)
 *      — deterministic, but unguessable without the seed.
 *   4. After the season closes, the server reveals `serverSeed`. Anyone can
 *      re-hash it to check it matches the commitment, then replay every drop
 *      in the season and confirm the recorded paths.
 *
 * The server cannot change a result after the fact (the hash pins the seed) and
 * cannot pick a seed that targets a player (the client seed is outside its
 * control). Verification runs entirely in the browser via `verifyDrop`.
 *
 * Web Crypto is used rather than `node:crypto` precisely so that the same code
 * runs in the player's browser on the verify page.
 */

const encoder = new TextEncoder();

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** SHA-256 of a UTF-8 string, hex encoded. */
export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(input));
  return toHex(new Uint8Array(digest));
}

/** The public commitment published before a season opens. */
export const commitServerSeed = sha256Hex;

/**
 * Check a revealed seed against the commitment that was published up front.
 * A season whose reveal fails this is evidence of tampering.
 */
export async function verifyCommitment(
  serverSeed: string,
  publishedHash: string,
): Promise<boolean> {
  const actual = await sha256Hex(serverSeed);
  // Plain comparison is fine: both sides are public post-reveal, so there is no
  // secret left for a timing side-channel to leak.
  return actual === publishedHash.trim().toLowerCase();
}

async function hmacSha256(key: string, message: string): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message));
  return new Uint8Array(sig);
}

/**
 * Derive `count` bytes for one drop. A single HMAC yields 32 bytes; boards
 * deeper than that chain additional blocks through an explicit cursor so the
 * stream stays deterministic and collision-free.
 */
export async function deriveBytes(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  count: number,
): Promise<number[]> {
  if (!Number.isInteger(nonce) || nonce < 0) {
    throw new Error(`nonce must be a non-negative integer, got ${nonce}`);
  }
  if (!Number.isInteger(count) || count < 1) {
    throw new Error(`count must be a positive integer, got ${count}`);
  }
  const out: number[] = [];
  for (let cursor = 0; out.length < count; cursor += 1) {
    const block = await hmacSha256(serverSeed, `${clientSeed}:${nonce}:${cursor}`);
    for (const byte of block) {
      if (out.length >= count) break;
      out.push(byte);
    }
  }
  return out;
}

/**
 * Turn derived bytes into left/right peg decisions.
 *
 * The low bit of each byte is used rather than a modulo of the whole byte:
 * HMAC output is uniform over 0..255, so `byte & 1` is an exactly fair coin,
 * whereas `byte % n` for non-power-of-two `n` would skew toward low values.
 */
export function bytesToPath(bytes: number[]): string {
  return bytes.map((b) => (b & 1 ? "1" : "0")).join("");
}

/** A fresh random seed, hex encoded. 32 bytes of CSPRNG output. */
export function randomSeed(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(32)));
}
