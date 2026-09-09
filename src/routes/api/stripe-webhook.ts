import { createFileRoute } from "@tanstack/react-router";

/**
 * Stripe's webhook. This is the only thing in the app allowed to grant a paid
 * entitlement.
 *
 * Three rules hold the money side together:
 *
 *  1. The signature is checked against the RAW body. Parsing first and
 *     re-serialising changes the bytes and every signature stops matching.
 *  2. An unverified delivery gets 400, never 500 — a 500 makes Stripe retry a
 *     request that can never become valid.
 *  3. The event id is claimed before anything is granted. Stripe delivers at
 *     least once, so a retry that is not de-duplicated hands out a second pack
 *     of plates for one payment.
 */
export const Route = createFileRoute("/api/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const signature = request.headers.get("stripe-signature") ?? "";

        const { verifyWebhook, parseEvent } = await import("@/lib/billing/stripe.server");
        if (!verifyWebhook(raw, signature).ok) {
          return new Response("bad signature", { status: 400 });
        }
        const event = parseEvent(raw);
        if (!event) return new Response("bad payload", { status: 400 });

        const { claimEvent, applyPurchase, settleCheckout, revokeEntitlement } = await import(
          "@/lib/billing/entitlements.server"
        );

        try {
          if (!(await claimEvent(event.id, event.type))) {
            // Already handled. Acknowledge so Stripe stops retrying.
            return Response.json({ received: true, duplicate: true });
          }

          const object = event.data.object;
          const meta = object.metadata ?? {};
          const userId = String(object.client_reference_id ?? meta.user_id ?? "").trim();
          const addonId = String(meta.addon_id ?? "").trim();

          switch (event.type) {
            case "checkout.session.completed": {
              if (object.status && object.status !== "complete") break;
              if (object.id) await settleCheckout(object.id, "paid");
              if (userId && addonId) {
                await applyPurchase({ userId, addonId, periodEnd: periodEndOf(object) });
              }
              break;
            }
            case "checkout.session.expired": {
              if (object.id) await settleCheckout(object.id, "expired");
              break;
            }
            // A renewal re-stamps the paid-through date. Without this a monthly
            // kitchen would lapse at the end of the first period even though
            // the card kept paying.
            case "invoice.paid": {
              if (userId && addonId) {
                await applyPurchase({ userId, addonId, periodEnd: periodEndOf(object) });
              }
              break;
            }
            case "customer.subscription.deleted": {
              if (userId && addonId) await revokeEntitlement(userId, addonId);
              break;
            }
            default:
              break;
          }
          return Response.json({ received: true });
        } catch (err) {
          // The signature was good and the work failed: a 500 is correct here,
          // because Stripe SHOULD retry this one.
          console.error("[stripe-webhook]", err);
          return new Response("handler error", { status: 500 });
        }
      },
    },
  },
});

/** Paid-through date, whichever shape the event carries it in. */
function periodEndOf(object: {
  current_period_end?: number | null;
  lines?: { data?: { period?: { end?: number } }[] };
}): number | null {
  if (typeof object.current_period_end === "number") return object.current_period_end;
  const line = object.lines?.data?.[0]?.period?.end;
  return typeof line === "number" ? line : null;
}
