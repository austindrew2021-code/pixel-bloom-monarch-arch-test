-- Multiple games on one fairness chain, plus verified ad rewards.
--
-- Every game derives its outcome from the same commit-reveal stream the board
-- already used (season server seed + player client seed + nonce), so adding
-- games does not add a second thing players have to trust.

-- ------------------------------------------------------------ drops → plays --

-- `drops` began as a Plinko-only ledger. Generalise it: the columns every game
-- shares stay top level, and each game's replay detail goes in `detail`.
alter table drops add column if not exists game text not null default 'plinko';
alter table drops add column if not exists detail jsonb not null default '{}'::jsonb;

-- Plinko-specific columns no longer apply to every row. The existing
-- `check (slot >= 0 and slot <= rows)` still holds for Plinko rows and is
-- satisfied trivially when both are null, since a CHECK passes on NULL.
alter table drops alter column rows drop not null;
alter table drops alter column slot drop not null;
alter table drops alter column path drop not null;

create index if not exists drops_game_idx on drops (season_id, game);

-- ------------------------------------------------------------- game rounds --

-- State for games played over several requests rather than resolved in one.
--
-- Mines is the reason this exists: the board is fixed when the round opens
-- (derived from the seed, exactly like a single-call game) but the player
-- reveals tiles one at a time and decides when to stop. The layout is written
-- here at open and never sent to the client until the round is over — the
-- server answers "safe" or "bomb" per tile and nothing more.
create table if not exists game_rounds (
  id          text primary key,
  user_id     text not null,
  season_id   text not null references seasons (id) on delete cascade,
  game        text not null,
  nonce       integer not null,
  client_seed text not null,
  -- The resolved outcome, fixed at open. Secret while the round is live.
  layout      jsonb not null,
  -- What the player has done so far.
  progress    jsonb not null default '{}'::jsonb,
  status      text not null default 'live'
    check (status in ('live', 'banked', 'bust')),
  points      integer not null default 0,
  opened_at   timestamptz not null default now(),
  closed_at   timestamptz,
  unique (user_id, season_id, nonce),
  check (points >= 0),
  -- A finished round must say when it finished, and a live one must not.
  check ((status = 'live') = (closed_at is null))
);

-- At most one live round per player per game: without this a player could open
-- many rounds and bank only the lucky ones while paying for one drop each.
create unique index if not exists game_rounds_one_live_idx
  on game_rounds (user_id, game) where status = 'live';

-- ---------------------------------------------------------------- ad views --

-- Rewarded-video grants, recorded from the ad network's server-to-server
-- callback rather than from the browser.
--
-- The client cannot be the source of truth here: a page that says "I watched an
-- ad, give me drops" is trivially replayed, and drops are what rank players for
-- real prizes. `network_txn_id` is the network's own identifier for the
-- impression and is unique, so a retried callback credits nothing twice.
create table if not exists ad_views (
  id             text primary key,
  user_id        text not null,
  season_id      text not null references seasons (id) on delete cascade,
  day            date not null,
  placement      text not null,
  provider       text not null,
  network_txn_id text not null,
  drops_granted  integer not null default 0,
  -- Payout reported by the network, when it sends one. Revenue reporting only.
  revenue_usd    numeric(12, 6),
  created_at     timestamptz not null default now(),
  unique (provider, network_txn_id),
  check (drops_granted >= 0)
);

create index if not exists ad_views_user_day_idx on ad_views (user_id, day);
create index if not exists ad_views_revenue_idx on ad_views (season_id, created_at);

-- Single-use tokens binding an ad impression to the player who requested it.
-- The token travels to the ad network as custom data and comes back on the
-- callback, which is what ties an anonymous impression to an account.
create table if not exists ad_tokens (
  token      text primary key,
  user_id    text not null,
  season_id  text not null references seasons (id) on delete cascade,
  placement  text not null,
  issued_at  timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz
);

create index if not exists ad_tokens_user_idx on ad_tokens (user_id);
