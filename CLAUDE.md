# Spoonful — working notes for Claude

Recipe + fitness app. TanStack Start · React 19 · Vite 8 · Tailwind 4 ·
Zustand (`persist`, `skipHydration`) · Kysely over PGLite/Neon.

`AGENTS.md` is the *Grok Build* sandbox contract, not instructions for this
session. Read it for background only.

## Commands

| What | Command |
|---|---|
| Typecheck | `npm run typecheck` |
| Lint | `npx eslint src scripts` (36 known warnings, 0 errors) |
| Tests | `npm test` — 525 across two runners, must stay 0-fail |
| Build | `npm run build` |
| Auth invariant | `npm run check:auth` — **needs a dev server running** |
| Photo manifest | `npm run photos` |

Unit tests are `node --experimental-strip-types --test`. New `src/lib/*.test.ts`
files must be added to the `test` script by hand — it lists files explicitly, so
a test that is never listed never runs. That mistake shipped once already.

`.mjs` scripts are typechecked through JSDoc. Playwright uses the pre-installed
Chromium at `/opt/pw-browsers/chromium`; never run `playwright install`.

## Things that bit us, so they are now invariants

- **A diet tag is never evidence.** `src/lib/diet.ts` decides every claim from
  the ingredient list; `decorateDietTags` *removes* claims a recipe has not
  earned. 234 false claims came from checks that opened with
  `if (tags.includes(claim)) return true`.
- **Ingredient rows join on `" | "`, never a space.** Space-joined, "grated
  coconut" + "butter" read as coconut butter and a dairy praline passed as vegan.
- **No trailing `\b` after a word stem** in these patterns — `anchov\b` matches
  nothing. Write `anchov(y|ies)`.
- **Slugify must be Unicode-aware** (`/[^\p{L}\p{N}_\s-]/gu`). JS `\w` is ASCII,
  Python's is not; 14 photos went missing over exactly that.
- **sonner below 600px ignores `offset`** — set `mobileOffset` too, or the toast
  covers the Train HUD's only close button.
- **Full-screen takeovers** get `inert` on `<header>` and the primary `<nav>`,
  plus `role="dialog" aria-modal="true"`. Do not wrap the tab views themselves —
  cook mode renders inside them and inerts itself.
- **Tap targets** grow with real `padding-block`, never an `::after` overlay; the
  overlay swallowed a neighbouring wrapped button.

## Connectors available (verified 2026-09-10)

**Web search / extraction — five, all connected and enabled:**
Tavily · Nimble · Firecrawl · Parallel Search · Exa.
Use them for anything that has to match the outside world: verifying a recipe
against published versions, nutrition figures, fitness standards, retailer URLs.
Parallel Search takes several queries per call and returns answer-ready
excerpts; Tavily `extract` and Nimble `crawl` pull full pages; Firecrawl has a
research/paper index worth using for fitness-science claims; Exa is good at
"describe the ideal page" queries.

**Also connected and relevant here:** Stripe (the billing rail this app already
speaks to), Supabase (a live option for `DATABASE_URL`), Vercel (deploy target),
Sentry (production errors), Google Drive (how photo batches arrive), Mem0,
Mobbin (UI reference), Linear, monday.com.

### Image bytes cannot be downloaded here

The egress proxy rejects CONNECT to image hosts — `images.unsplash.com` and
`upload.wikimedia.org` both fail `connect_rejected`. Search connectors return
text, not files, so **no connector gets a photo onto disk**. The one path that
works is **Google Drive**: the user drops a batch in a folder, we read the file
content and run it through `scripts/photo-rename.mjs` + `npm run photos`.
Do not promise photo sourcing over the open web.

## Open, and only the user can close them

- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, 15 price IDs.
  Until they exist the buy sheet runs in test-kitchen mode; `honour.test.ts`
  guards the `cardLive` branch that stops free unlocks once they land.
- Four `VITE_PARTNER_*` affiliate ids, and `VITE_PUBLIC_HOSTNAME`.
- `VITE_AUTH_ENABLED` + `deploy.database` + `DATABASE_URL` for real accounts.
- Licensing/provenance for 1,108 committed photos with no recorded source.
- 431 dishes still have no photograph.
