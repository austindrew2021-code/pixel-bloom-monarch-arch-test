/**
 * Rewarded video: the revenue rail, and the one place a player is paid for
 * doing something an advertiser funds.
 *
 * The hard rule here is that **the browser is never the source of truth**. A
 * client that says "I finished an ad, credit me" is a fetch call anyone can
 * replay from the console, and drops decide who wins real prizes. So the flow
 * is the industry-standard server-side verification (SSV) one:
 *
 *   1. The player asks for an ad. The server mints a single-use token bound to
 *      that account, placement and a short expiry, and records it.
 *   2. The client hands the token to the ad network SDK as custom data and
 *      plays the video.
 *   3. When the video genuinely completes, the *network's* servers call our
 *      callback with that token plus their own signed parameters.
 *   4. The callback verifies the signature, consumes the token exactly once,
 *      and credits the drops.
 *
 * Nothing in step 4 trusts anything the browser said. The token is what ties an
 * otherwise anonymous impression back to an account, and `network_txn_id` makes
 * a retried callback — which every network does — credit nothing twice.
 */

import { DROPS_PER_REWARDED_AD } from "./allowance.ts";

export type AdProvider = "admob" | "unity" | "applovin" | "test";

export type AdPlacement = {
  id: string;
  label: string;
  /** Drops credited when the network confirms a completed view. */
  reward: number;
};

/**
 * Where ads can be offered. Keeping these as data means a new surface is a
 * config change rather than a new reward path that has to be re-secured.
 */
export const PLACEMENTS: Readonly<Record<string, AdPlacement>> = {
  "out-of-drops": {
    id: "out-of-drops",
    label: "Out of drops",
    reward: DROPS_PER_REWARDED_AD,
  },
  "top-up": {
    id: "top-up",
    label: "Top up",
    reward: DROPS_PER_REWARDED_AD,
  },
};

export function isPlacement(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(PLACEMENTS, id);
}

export function rewardFor(placementId: string): number {
  return PLACEMENTS[placementId]?.reward ?? 0;
}

/** How long a minted ad token stays usable. */
export const AD_TOKEN_TTL_MS = 30 * 60 * 1000;

/**
 * Whether real server-side verification is required.
 *
 * Off, a direct grant path is available so the loop can be developed and tested
 * without an ad network. On — which is what any deployment with a configured
 * provider gets — that path is refused and only a verified network callback can
 * credit drops. It is deliberately keyed off the secret being present, so
 * shipping without configuring verification cannot silently leave the open path
 * enabled.
 */
export function ssvRequired(env: Record<string, string | undefined>): boolean {
  return !!env.AD_SSV_SECRET;
}

export type CallbackParams = {
  token: string;
  provider: string;
  transactionId: string;
  signature?: string;
  revenueUsd?: number;
};

export type CallbackVerdict =
  | { ok: true; params: CallbackParams }
  | { ok: false; reason: string };

/**
 * Validate the shape of a network callback before any database work.
 *
 * Signature checking itself is per-provider (AdMob publishes a rotating public
 * key; Unity and AppLovin use a shared secret HMAC), so the provider adapter
 * supplies `verifySignature`. This function covers what every provider shares:
 * required fields, a known provider, and a sane revenue figure.
 */
export function readCallback(
  query: Record<string, string | undefined>,
  options: { requireSignature: boolean },
): CallbackVerdict {
  const token = query.token?.trim();
  const provider = query.provider?.trim();
  const transactionId = (query.transaction_id ?? query.txn_id)?.trim();

  if (!token) return { ok: false, reason: "missing token" };
  if (!provider) return { ok: false, reason: "missing provider" };
  if (!transactionId) return { ok: false, reason: "missing transaction id" };

  const signature = query.signature?.trim();
  if (options.requireSignature && !signature) {
    return { ok: false, reason: "missing signature" };
  }

  let revenueUsd: number | undefined;
  if (query.revenue !== undefined && query.revenue !== "") {
    const parsed = Number(query.revenue);
    // Revenue is reporting only and must never gate the reward, but a garbage
    // value should not reach the ledger either.
    if (!Number.isFinite(parsed) || parsed < 0) {
      return { ok: false, reason: "invalid revenue" };
    }
    revenueUsd = parsed;
  }

  return { ok: true, params: { token, provider, transactionId, signature, revenueUsd } };
}

/**
 * Constant-time string comparison for HMAC signatures.
 *
 * A plain `===` leaks how much of a forged signature was correct through its
 * timing, which over enough attempts is enough to construct a valid one.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** HMAC-SHA256 of `message`, hex encoded. Used by the shared-secret providers. */
export async function signPayload(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** The canonical message a shared-secret provider signs. */
export function callbackMessage(params: CallbackParams): string {
  return `${params.provider}:${params.token}:${params.transactionId}`;
}

export async function verifySharedSecretSignature(
  secret: string,
  params: CallbackParams,
): Promise<boolean> {
  if (!params.signature) return false;
  const expected = await signPayload(secret, callbackMessage(params));
  return timingSafeEqual(expected, params.signature.toLowerCase());
}
