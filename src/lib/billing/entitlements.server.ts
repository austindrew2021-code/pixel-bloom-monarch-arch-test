import { getSql } from "../db.ts";
import { mondayOf } from "../week.ts";
import { billableFor } from "./catalog.ts";

/**
 * What a cook has actually paid for.
 *
 * The client keeps its own `unlocked` list so the UI can paint instantly and
 * work offline. That list is a cache. This module is the truth: it is written
 * only by a verified Stripe webhook, and it is what any check worth money
 * should consult.
 */

export type Entitlement = { addonId: string; expiresAt: string | null; source: string };

function uid(): string {
  return crypto.randomUUID();
}

/** Live entitlements — a lapsed subscription is simply not returned. */
export async function entitlementsFor(userId: string): Promise<Entitlement[]> {
  const sql = await getSql();
  const rows = await sql<{ addon_id: string; expires_at: string | null; source: string }>`
    select addon_id, expires_at, source
    from entitlements
    where user_id = ${userId}
      and (expires_at is null or expires_at > now())
    order by addon_id
  `;
  return rows.map((r) => ({ addonId: r.addon_id, expiresAt: r.expires_at, source: r.source }));
}

/**
 * Grants (or renews) an entitlement. Re-running with a later `expiresAt` is how
 * a renewal extends a subscription; re-running a one-time grant is a no-op, so
 * a webhook retry cannot double-charge anyone anything.
 */
export async function grantEntitlement(input: {
  userId: string;
  addonId: string;
  expiresAt?: Date | null;
  source?: string;
}): Promise<void> {
  const sql = await getSql();
  const expires = input.expiresAt ? input.expiresAt.toISOString() : null;
  await sql`
    insert into entitlements (user_id, addon_id, source, expires_at)
    values (${input.userId}, ${input.addonId}, ${input.source ?? "stripe"}, ${expires})
    on conflict (user_id, addon_id) do update
      set expires_at = excluded.expires_at,
          source = excluded.source,
          granted_at = now()
  `;
}

/** Ends a subscription now — a cancellation, a refund, a chargeback. */
export async function revokeEntitlement(userId: string, addonId: string): Promise<void> {
  const sql = await getSql();
  await sql`delete from entitlements where user_id = ${userId} and addon_id = ${addonId}`;
}

/**
 * Chef plates are counted, not owned, so a paid pack is a ledger row rather
 * than a flag. The balance is the sum for the week, which means a refund is
 * another row instead of an edit.
 */
export async function addPlates(input: {
  userId: string;
  plates: number;
  reason: string;
  weekStart?: string;
}): Promise<void> {
  const sql = await getSql();
  const week = input.weekStart ?? mondayOf();
  await sql`
    insert into plate_ledger (id, user_id, delta, reason, week_start)
    values (${uid()}, ${input.userId}, ${Math.round(input.plates)}, ${input.reason}, ${week})
  `;
}

/** Plates bought this week, over and above the free three. */
export async function boughtPlatesThisWeek(userId: string): Promise<number> {
  const sql = await getSql();
  const rows = await sql<{ total: string | number | null }>`
    select coalesce(sum(delta), 0) as total
    from plate_ledger
    where user_id = ${userId} and week_start = ${mondayOf()}
  `;
  return Math.max(0, Number(rows[0]?.total ?? 0));
}

/**
 * Records that we started a checkout, before the redirect.
 *
 * Written first so a webhook that beats the browser back still has a row to
 * join onto, and so an abandoned checkout stays visible as `pending` instead of
 * disappearing from the books entirely.
 */
export async function recordCheckoutStart(input: {
  sessionId: string;
  userId: string;
  addonId: string;
  amountCents: number;
  currency: string;
}): Promise<void> {
  const sql = await getSql();
  await sql`
    insert into checkout_sessions (id, user_id, addon_id, status, amount_cents, currency)
    values (${input.sessionId}, ${input.userId}, ${input.addonId}, 'pending', ${input.amountCents}, ${input.currency})
    on conflict (id) do nothing
  `;
}

export async function settleCheckout(sessionId: string, status: "paid" | "expired" | "failed"): Promise<void> {
  const sql = await getSql();
  await sql`
    update checkout_sessions
    set status = ${status}, settled_at = now()
    where id = ${sessionId}
  `;
}

/**
 * Claims a webhook event id.
 *
 * Stripe promises at-least-once delivery, so the same `checkout.session.completed`
 * can arrive twice. Returns false the second time, and the caller does nothing —
 * that is the whole reason a retry cannot grant a pack of plates twice.
 */
export async function claimEvent(eventId: string, kind: string): Promise<boolean> {
  const sql = await getSql();
  const rows = await sql<{ event_id: string }>`
    insert into billing_events (event_id, kind)
    values (${eventId}, ${kind})
    on conflict (event_id) do nothing
    returning event_id
  `;
  return rows.length > 0;
}

/**
 * Applies a settled purchase: a subscription gets a paid-through date, a
 * one-time buy is kept forever, and a pack of plates is appended to the ledger.
 */
export async function applyPurchase(input: {
  userId: string;
  addonId: string;
  periodEnd?: number | null;
  quantity?: number;
}): Promise<void> {
  const billable = billableFor(input.addonId);
  if (!billable) return;

  if (billable.kind === "consumable") {
    await addPlates({
      userId: input.userId,
      plates: (billable.plates ?? 0) * Math.max(1, input.quantity ?? 1),
      reason: input.addonId,
    });
    return;
  }

  await grantEntitlement({
    userId: input.userId,
    addonId: input.addonId,
    expiresAt:
      billable.kind === "subscription" && input.periodEnd ? new Date(input.periodEnd * 1000) : null,
  });
}
