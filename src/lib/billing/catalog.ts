import type { AddonId } from "../types";

/**
 * What each paid extra *is*, in billing terms.
 *
 * - `subscription` renews and lapses. The entitlement carries a paid-through
 *   date and is re-stamped every renewal.
 * - `once` is bought and kept forever. No expiry.
 * - `consumable` is a bag of Chef plates: it is counted in the plate ledger,
 *   not owned, so buying it twice gives twice the plates.
 *
 * Nothing here decides what a cook can *do* — `src/lib/access.ts` still owns
 * that. This only says how the money behaves.
 */
export type BillingKind = "subscription" | "once" | "consumable";

export type BillableAddon = {
  id: AddonId;
  kind: BillingKind;
  /** Chef plates granted, for `consumable` only. */
  plates?: number;
  /** Env var holding this addon's Stripe Price id. */
  priceEnv: string;
};

/**
 * Every addon that can take money. An addon missing from this table is free by
 * definition — `body-sync` and `midnight` are priced at 0 and never checkout.
 *
 * The Price ids live in env, not in the code: the same build then runs against
 * a test account and a live one without a rebuild, and no key or product id is
 * ever committed.
 */
export const BILLABLE: readonly BillableAddon[] = [
  { id: "kitchen-table", kind: "subscription", priceEnv: "STRIPE_PRICE_KITCHEN_TABLE" },
  { id: "chef-plus", kind: "subscription", priceEnv: "STRIPE_PRICE_CHEF_PLUS" },
  { id: "family", kind: "subscription", priceEnv: "STRIPE_PRICE_FAMILY" },
  { id: "trainer", kind: "subscription", priceEnv: "STRIPE_PRICE_TRAINER" },

  { id: "table-year", kind: "once", priceEnv: "STRIPE_PRICE_TABLE_YEAR" },
  { id: "founder", kind: "once", priceEnv: "STRIPE_PRICE_FOUNDER" },
  { id: "team-kitchen", kind: "once", priceEnv: "STRIPE_PRICE_TEAM_KITCHEN" },
  { id: "gift-table", kind: "once", priceEnv: "STRIPE_PRICE_GIFT_TABLE" },
  { id: "streak-save", kind: "once", priceEnv: "STRIPE_PRICE_STREAK_SAVE" },
  { id: "skins-world", kind: "once", priceEnv: "STRIPE_PRICE_SKINS_WORLD" },
  { id: "skins-season", kind: "once", priceEnv: "STRIPE_PRICE_SKINS_SEASON" },
  { id: "tip-flour", kind: "once", priceEnv: "STRIPE_PRICE_TIP_FLOUR" },
  { id: "tip-butter", kind: "once", priceEnv: "STRIPE_PRICE_TIP_BUTTER" },

  { id: "plates-15", kind: "consumable", plates: 15, priceEnv: "STRIPE_PRICE_PLATES_15" },
  { id: "plates-40", kind: "consumable", plates: 40, priceEnv: "STRIPE_PRICE_PLATES_40" },
  { id: "sos-3", kind: "consumable", plates: 3, priceEnv: "STRIPE_PRICE_SOS_3" },
];

const BY_ID = new Map(BILLABLE.map((b) => [b.id, b]));

export function billableFor(id: string): BillableAddon | undefined {
  return BY_ID.get(id as AddonId);
}

export function isBillable(id: string): boolean {
  return BY_ID.has(id as AddonId);
}
