import { createFileRoute } from "@tanstack/react-router";
import {
  readCallback,
  rewardFor,
  ssvRequired,
  verifySharedSecretSignature,
} from "@/lib/arcade/ads";
import { dayKey } from "@/lib/arcade/allowance";
import { claimAdBonus, consumeAdToken, recordAdView } from "@/lib/arcade/queries";
import { getSql } from "@/lib/db";

/**
 * Server-to-server reward callback for rewarded video.
 *
 * The ad network calls this — not the player's browser — when a video is
 * genuinely watched to completion. It is the only path that credits drops once
 * a provider is configured, because drops decide who wins real prizes and a
 * browser-triggered grant is a fetch anyone can replay.
 *
 * Ordering matters and is deliberate:
 *   1. Verify the signature, so a forged call goes no further.
 *   2. Consume the one-time token, which names the account.
 *   3. Insert the ad view, unique on (provider, transaction id). Networks retry
 *      callbacks routinely, so this insert — not the token — is what makes a
 *      repeat delivery credit nothing twice.
 *   4. Only then credit the drops.
 *
 * Always answers 200 to a well-formed call the network can't act on (a
 * duplicate, a spent token), because a non-200 makes networks retry forever.
 * Malformed or unauthenticated calls get 400/403 so misconfiguration is loud.
 */
export const Route = createFileRoute("/api/ad-reward")({
  server: {
    handlers: {
      GET: async ({ request }) => handle(request),
      POST: async ({ request }) => handle(request),
    },
  },
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function handle(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const query: Record<string, string | undefined> = {};
  for (const [key, value] of url.searchParams) query[key] = value;

  const secret = process.env.AD_SSV_SECRET;
  const requireSignature = ssvRequired(process.env);

  const verdict = readCallback(query, { requireSignature });
  if (!verdict.ok) return json({ ok: false, error: verdict.reason }, 400);
  const params = verdict.params;

  if (requireSignature) {
    if (!secret || !(await verifySharedSecretSignature(secret, params))) {
      return json({ ok: false, error: "bad signature" }, 403);
    }
  }

  const sql = await getSql();
  const claim = await consumeAdToken(sql, params.token);
  if (!claim) {
    // Expired or already used. The network cannot fix this by retrying.
    return json({ ok: true, credited: 0, reason: "token not claimable" }, 200);
  }

  const reward = rewardFor(claim.placement);
  const view = await recordAdView(sql, {
    id: crypto.randomUUID(),
    userId: claim.user_id,
    seasonId: claim.season_id,
    day: dayKey(),
    placement: claim.placement,
    provider: params.provider,
    networkTxnId: params.transactionId,
    dropsGranted: reward,
    revenueUsd: params.revenueUsd,
  });
  if (!view) {
    return json({ ok: true, credited: 0, reason: "duplicate callback" }, 200);
  }

  // Clamped at the daily ceiling inside the query; a player past it keeps the
  // recorded impression (it still earned revenue) but gains no further drops.
  const granted = await claimAdBonus(sql, claim.user_id, claim.season_id, dayKey());
  return json({ ok: true, credited: granted ? reward : 0 }, 200);
}
