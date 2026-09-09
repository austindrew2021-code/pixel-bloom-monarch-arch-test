import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";

/**
 * The two calls the store screen makes: start a checkout, and read back what
 * the account is entitled to.
 *
 * Both are thin — the Stripe and database work lives in `*.server.ts` modules
 * that are imported inside the handler, so none of it is bundled for the
 * browser.
 */

export const startCheckout = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        addonId: z.string().min(1).max(40),
        quantity: z.number().int().min(1).max(10).optional(),
        returnTo: z.string().max(300).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { billableFor } = await import("./catalog.ts");
    const { createCheckoutSession, priceIdFor, stripeConfigured } = await import("./stripe.server.ts");
    const { recordCheckoutStart } = await import("./entitlements.server.ts");

    const billable = billableFor(data.addonId);
    if (!billable) return { ok: false as const, error: "That extra is free — nothing to buy." };
    if (!stripeConfigured()) {
      return { ok: false as const, error: "Card payments are not switched on for this kitchen yet." };
    }
    const priceId = priceIdFor(billable.priceEnv);
    if (!priceId) {
      return { ok: false as const, error: "That extra has no price set up yet." };
    }

    // The return trip only navigates the browser; it never grants anything, so
    // an origin we build ourselves is enough and a spoofed one buys nothing.
    const origin = originFromEnv();
    const back = safeReturnPath(data.returnTo);

    try {
      const session = await createCheckoutSession({
        priceId,
        mode: billable.kind === "subscription" ? "subscription" : "payment",
        userId: context.userId,
        addonId: billable.id,
        quantity: data.quantity,
        successUrl: `${origin}${back}?paid=${encodeURIComponent(billable.id)}`,
        cancelUrl: `${origin}${back}?paid=cancelled`,
      });
      await recordCheckoutStart({
        sessionId: session.id,
        userId: context.userId,
        addonId: billable.id,
        amountCents: session.amountCents,
        currency: session.currency,
      });
      return { ok: true as const, url: session.url };
    } catch {
      return { ok: false as const, error: "The till did not open. Try again in a moment." };
    }
  });

/**
 * Whether this kitchen can take a card yet. No auth: it is a feature flag, and
 * the store screen has to know before it can offer a Pay button. Defaults to
 * false everywhere, so an unconfigured kitchen simply never shows one.
 */
export const billingStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { stripeConfigured } = await import("./stripe.server.ts");
  return { card: stripeConfigured() };
});

export const myEntitlements = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { entitlementsFor, boughtPlatesThisWeek } = await import("./entitlements.server.ts");
    const [owned, plates] = await Promise.all([
      entitlementsFor(context.userId),
      boughtPlatesThisWeek(context.userId),
    ]);
    return { owned, plates };
  });

function originFromEnv(): string {
  const host =
    (typeof process !== "undefined" ? process.env?.VITE_PUBLIC_HOSTNAME : "") ??
    "";
  const clean = String(host).trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  return clean ? `https://${clean}` : "http://localhost:8080";
}

/** Only ever a same-site path, so the return URL cannot be pointed off-site. */
function safeReturnPath(raw?: string): string {
  const path = String(raw ?? "/").trim();
  if (!path.startsWith("/") || path.startsWith("//")) return "/";
  return path.split("?")[0]!.slice(0, 200);
}
