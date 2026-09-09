# Billing

Everything here is inert until four environment variables exist. With none of
them set the app behaves exactly as it did before: the Extras sheet shows an
Interac memo and unlocks locally, and no card button appears anywhere.

## What only you can do

1. **Create the products in Stripe.** One Price per row in `catalog.ts`.
   Subscriptions (`kitchen-table`, `chef-plus`, `family`, `trainer`) are
   recurring monthly Prices; everything else is one-time. The plate packs and
   `sos-3` are one-time Prices that may be bought repeatedly.

2. **Set the keys.** In the Vercel project (or `.grok/app-env.json` for local
   work — but never commit a live key):

   ```
   STRIPE_SECRET_KEY=sk_live_…
   STRIPE_WEBHOOK_SECRET=whsec_…
   VITE_PUBLIC_HOSTNAME=spoonful.example.com
   ```

   `VITE_PUBLIC_HOSTNAME` is what the success and cancel URLs are built from.
   Without it checkout returns to `localhost`.

3. **Set one Price id per extra**, using the `priceEnv` names in `catalog.ts`:

   ```
   STRIPE_PRICE_KITCHEN_TABLE=price_…
   STRIPE_PRICE_CHEF_PLUS=price_…
   STRIPE_PRICE_FAMILY=price_…
   STRIPE_PRICE_TRAINER=price_…
   STRIPE_PRICE_TABLE_YEAR=price_…
   STRIPE_PRICE_FOUNDER=price_…
   STRIPE_PRICE_TEAM_KITCHEN=price_…
   STRIPE_PRICE_GIFT_TABLE=price_…
   STRIPE_PRICE_STREAK_SAVE=price_…
   STRIPE_PRICE_SKINS_WORLD=price_…
   STRIPE_PRICE_SKINS_SEASON=price_…
   STRIPE_PRICE_TIP_FLOUR=price_…
   STRIPE_PRICE_TIP_BUTTER=price_…
   STRIPE_PRICE_PLATES_15=price_…
   STRIPE_PRICE_PLATES_40=price_…
   STRIPE_PRICE_SOS_3=price_…
   ```

   An extra with no Price id simply cannot be bought by card; it falls back to
   the Interac path. That is deliberate — a half-configured account should not
   half-charge anyone.

4. **Point the webhook at `/api/stripe-webhook`** and subscribe it to
   `checkout.session.completed`, `checkout.session.expired`, `invoice.paid`,
   and `customer.subscription.deleted`. Copy the signing secret into
   `STRIPE_WEBHOOK_SECRET`.

   `invoice.paid` is the one people forget. Without it a monthly kitchen lapses
   at the end of the first period even though the card kept paying.

## What the code guarantees

- **The webhook is the only thing that grants a paid entitlement.** The success
  URL just navigates the browser; landing on it grants nothing, so a cook who
  guesses the URL gets nothing.
- **Signatures are checked against the raw body**, inside a five-minute window,
  with a constant-time compare. A forged or replayed delivery gets 400, never
  500 — a 500 would make Stripe retry a request that can never become valid.
- **Every event id is claimed before anything is granted.** Stripe delivers at
  least once; without the claim a retry hands out a second pack of plates for
  one payment.
- **Plates are a ledger, not a counter**, so a refund is a row rather than an
  edit to a total.
- **The client's `unlocked` list stays a cache.** It paints the UI and works
  offline; `entitlements` in the database is the truth. Anything that must not
  be spoofable should read the server, not the store.

## Testing without spending money

Use Stripe test mode keys and `stripe listen --forward-to
localhost:8080/api/stripe-webhook`. `billing.test.ts` covers the signature
rules, the replay window, and the catalog invariants without touching the
network.
