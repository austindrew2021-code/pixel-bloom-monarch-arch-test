-- Cascade: free-to-play drop arcade with monthly crypto prize seasons.
--
-- Compliance shape, encoded in the schema itself:
--   * There is NO deposit, wager, balance or purchasable entry anywhere below.
--     Entry is always free, so the prize ladder is a promotional sweepstakes
--     rather than gambling. Never add a "buy drops" table.
--   * `wallet_address` is a PAYOUT destination only. The app never holds keys
--     and never takes custody of funds.
--   * Prize amounts are fixed in `season_prizes` when a season opens, before
--     any drop is played, and never vary with participation.
--
-- Fairness shape:
--   * A season commits to `server_seed_hash` before it opens and only reveals
--     `server_seed` after it closes, so every drop is independently verifiable
--     after the fact but unpredictable during play.

-- ----------------------------------------------------------------- players --

create table if not exists players (
  user_id          text primary key,
  handle           text not null unique,
  wallet_address   text unique,
  wallet_linked_at timestamptz,
  -- Set when a player is excluded from prizes (duplicate account, automation).
  -- They can still play; they are skipped when the ladder is assigned.
  prize_blocked    boolean not null default false,
  created_at       timestamptz not null default now()
);

create unique index if not exists players_handle_lower_idx on players (lower(handle));
-- One wallet may back exactly one account. This is the primary anti-sybil
-- control: wallets are free to mint, so the uniqueness constraint is what stops
-- one person farming the whole top-20 with throwaway addresses.
create unique index if not exists players_wallet_lower_idx on players (lower(wallet_address));

-- ----------------------------------------------------------------- seasons --

create table if not exists seasons (
  id               text primary key,          -- 'YYYY-MM'
  opens_at         timestamptz not null,
  closes_at        timestamptz not null,
  -- sha256(server_seed), published before the season opens.
  server_seed_hash text not null,
  -- Revealed only after close, so players can verify every historical drop.
  server_seed      text,
  revealed_at      timestamptz,
  status           text not null default 'open'
    check (status in ('open', 'closed', 'settled')),
  created_at       timestamptz not null default now(),
  check (closes_at > opens_at),
  -- The seed is STORED from the moment the season opens (drops are derived from
  -- it) but stays secret: no query that can reach a client ever selects it. What
  -- this guards is DISCLOSURE — a season may only be marked revealed once it has
  -- stopped accepting drops, because revealing early would let anyone predict
  -- every remaining drop.
  check (revealed_at is null or status in ('closed', 'settled'))
);

-- The published prize ladder for a season. Rows are written when the season is
-- created and are immutable afterwards: the amounts must not depend on how many
-- people enter.
create table if not exists season_prizes (
  season_id   text not null references seasons (id) on delete cascade,
  rank_from   integer not null,
  rank_to     integer not null,
  tier        text not null,                  -- 'headline' | 'residual'
  amount_usdc numeric(12, 2) not null,
  primary key (season_id, rank_from),
  check (rank_to >= rank_from),
  check (amount_usdc >= 0)
);

-- ------------------------------------------------------------- play ledger --

-- Per-player, per-season seed state. `nonce` is the monotonic drop counter that
-- makes each drop's outcome a distinct, verifiable derivation.
create table if not exists player_seeds (
  user_id     text not null,
  season_id   text not null references seasons (id) on delete cascade,
  client_seed text not null,
  nonce       integer not null default 0,
  primary key (user_id, season_id),
  check (nonce >= 0)
);

-- Every drop ever played. Append-only: this is the audit trail that makes the
-- reveal meaningful, so nothing here is ever updated or deleted.
create table if not exists drops (
  id          text primary key,
  user_id     text not null,
  season_id   text not null references seasons (id) on delete cascade,
  nonce       integer not null,
  client_seed text not null,
  rows        integer not null,
  -- 0..rows, the slot the ball settled in.
  slot        integer not null,
  -- Left/right peg decisions as a string of '0'/'1', kept so a player can
  -- replay the exact path that produced their slot.
  path        text not null,
  points      integer not null,
  created_at  timestamptz not null default now(),
  unique (user_id, season_id, nonce),
  check (slot >= 0 and slot <= rows),
  check (points >= 0)
);

create index if not exists drops_season_user_idx on drops (season_id, user_id);

-- Daily free-drop budget. The cap is what keeps this a contest of equal
-- opportunity rather than a grind, and `bonus_granted` tracks ad-earned extras
-- separately so the always-free baseline is auditable.
create table if not exists drop_allowance (
  user_id       text not null,
  season_id     text not null references seasons (id) on delete cascade,
  day           date not null,
  used          integer not null default 0,
  bonus_granted integer not null default 0,
  primary key (user_id, day),
  check (used >= 0),
  check (bonus_granted >= 0)
);

-- ------------------------------------------------------------- leaderboard --

-- Running season totals. Maintained alongside `drops` so the leaderboard is a
-- single indexed read instead of an aggregate over the full ledger.
create table if not exists season_scores (
  user_id      text not null,
  season_id    text not null references seasons (id) on delete cascade,
  points       integer not null default 0,
  drops_used   integer not null default 0,
  -- Timestamp the player first reached their current points total. Used as the
  -- published tie-break: same score, whoever got there first ranks higher.
  reached_at   timestamptz not null default now(),
  primary key (user_id, season_id)
);

create index if not exists season_scores_board_idx
  on season_scores (season_id, points desc, drops_used asc, reached_at asc);

-- ----------------------------------------------------------------- payouts --

create table if not exists payouts (
  id             text primary key,
  season_id      text not null references seasons (id) on delete cascade,
  user_id        text not null,
  rank           integer not null,
  tier           text not null,
  amount_usdc    numeric(12, 2) not null,
  wallet_address text not null,
  status         text not null default 'pending'
    check (status in ('pending', 'sent', 'failed')),
  tx_hash        text,
  created_at     timestamptz not null default now(),
  unique (season_id, user_id)
);

create index if not exists payouts_season_rank_idx on payouts (season_id, rank);

-- -------------------------------------------------------- wallet challenges --

-- One-shot nonces for proving control of a payout address.
--
-- The player signs a plain-text message containing the nonce; the signature is
-- recovered to an address and matched against the one being linked. The message
-- is not a transaction and authorises no transfer — it only demonstrates that
-- the person holds the key. Rows are single-use and short-lived so a signature
-- captured from a log cannot be replayed later.
create table if not exists wallet_challenges (
  nonce      text primary key,
  user_id    text not null,
  address    text not null,
  issued_at  timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz
);

create index if not exists wallet_challenges_user_idx on wallet_challenges (user_id);
