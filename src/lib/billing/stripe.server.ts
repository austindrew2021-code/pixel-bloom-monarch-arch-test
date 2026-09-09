import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Stripe, over its REST API with `fetch` and `node:crypto`.
 *
 * No SDK on purpose: Checkout plus one webhook is two endpoints and an HMAC,
 * and a dependency-free rail runs unchanged on Node, on Vercel's runtime, and
 * in the PGLite preview. It also keeps the payment path free of a transitive
 * dependency tree nobody on this project reads.
 */

const API = "https://api.stripe.com/v1";

function env(name: string): string {
  const raw = typeof process !== "undefined" ? process.env?.[name] : undefined;
  return typeof raw === "string" ? raw.trim() : "";
}

/** True once the account's secret key is present. Everything else stays inert. */
export function stripeConfigured(): boolean {
  return env("STRIPE_SECRET_KEY").length > 0;
}

export function priceIdFor(priceEnv: string): string {
  return env(priceEnv);
}

/** Stripe wants form encoding, including for nested fields. */
function form(params: Record<string, string | number | boolean | undefined>): string {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    body.set(key, String(value));
  }
  return body.toString();
}

async function call<T>(path: string, params: Record<string, string | number | boolean | undefined>): Promise<T> {
  const key = env("STRIPE_SECRET_KEY");
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/x-www-form-urlencoded",
      // Pin the shape we parse, so an account-level API upgrade cannot change
      // the fields under us without a deliberate bump here.
      "stripe-version": "2024-06-20",
    },
    body: form(params),
  });
  const json = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok) throw new Error(json?.error?.message ?? `Stripe ${res.status}`);
  return json;
}

export type CheckoutSession = { id: string; url: string; amountCents: number; currency: string };

/**
 * Opens a Checkout session.
 *
 * `client_reference_id` carries our own user id, and the addon rides in
 * metadata, so the webhook can settle the purchase without trusting anything
 * the browser sends back on the return trip.
 */
export async function createCheckoutSession(input: {
  priceId: string;
  mode: "payment" | "subscription";
  userId: string;
  addonId: string;
  successUrl: string;
  cancelUrl: string;
  /** Lets a cook buy two plate packs in one go. Ignored for subscriptions. */
  quantity?: number;
}): Promise<CheckoutSession> {
  const session = await call<{
    id: string;
    url: string;
    amount_total?: number | null;
    currency?: string | null;
  }>("/checkout/sessions", {
    mode: input.mode,
    "line_items[0][price]": input.priceId,
    "line_items[0][quantity]": Math.max(1, Math.min(10, input.quantity ?? 1)),
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    client_reference_id: input.userId,
    "metadata[addon_id]": input.addonId,
    "metadata[user_id]": input.userId,
    // A subscription's metadata has to be set on the subscription too, or the
    // renewal invoice arrives with nothing to identify it by.
    ...(input.mode === "subscription"
      ? {
          "subscription_data[metadata][addon_id]": input.addonId,
          "subscription_data[metadata][user_id]": input.userId,
        }
      : {}),
    allow_promotion_codes: true,
  });
  return {
    id: session.id,
    url: session.url,
    amountCents: session.amount_total ?? 0,
    currency: session.currency ?? "cad",
  };
}

/**
 * Verifies a webhook signature the way Stripe documents it: the signed payload
 * is `timestamp.body`, compared against every `v1=` scheme in the header.
 *
 * Returns null rather than throwing, because a caller must answer 400 to a
 * forged delivery, not 500 — a 500 makes Stripe retry a request that will never
 * be valid. The timestamp window is what stops a captured-and-replayed body.
 */
export function verifyWebhook(rawBody: string, signatureHeader: string, toleranceSec = 300): { ok: boolean } {
  const secret = env("STRIPE_WEBHOOK_SECRET");
  if (!secret || !signatureHeader) return { ok: false };

  const parts = signatureHeader.split(",").map((p) => p.trim());
  const timestamp = parts.find((p) => p.startsWith("t="))?.slice(2) ?? "";
  const signatures = parts.filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  if (!timestamp || signatures.length === 0) return { ok: false };

  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > toleranceSec) return { ok: false };

  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`, "utf8").digest();
  const match = signatures.some((sig) => {
    const given = Buffer.from(sig, "hex");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
  return { ok: match };
}

export type StripeEvent = {
  id: string;
  type: string;
  data: {
    object: {
      id?: string;
      client_reference_id?: string | null;
      customer?: string | null;
      subscription?: string | null;
      amount_total?: number | null;
      currency?: string | null;
      status?: string | null;
      metadata?: Record<string, string> | null;
      current_period_end?: number | null;
      /** Set on invoice.* events. */
      lines?: { data?: { period?: { end?: number } }[] };
    };
  };
};

export function parseEvent(rawBody: string): StripeEvent | null {
  try {
    const parsed = JSON.parse(rawBody) as StripeEvent;
    return parsed && typeof parsed.id === "string" && typeof parsed.type === "string" ? parsed : null;
  } catch {
    return null;
  }
}
