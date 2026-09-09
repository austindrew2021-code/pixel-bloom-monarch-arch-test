-- Spoonful's own tables: the kitchen's social side, and the money.
--
-- Everything here is per-user and keyed by `user_id TEXT` (TEXT, not UUID — the
-- preview dev user id is the literal string 'dev-user'). Every server function
-- that reads these scopes by the caller's verified id; the schema does not rely
-- on row-level security.
--
-- The server code in src/lib/community.ts has queried these tables since it was
-- written, but nothing ever created them: `migrations/` held only the opt-in
-- auth folder, which neither applier descends into. People, messages and
-- notifications therefore failed against any database. This file is that
-- missing schema, plus the billing tables the Stripe rail needs.

-- ---------------------------------------------------------------- profiles --

create table if not exists profiles (
  user_id          text primary key,
  username         text not null unique,
  display_name     text not null default '',
  bio              text not null default '',
  xp               integer not null default 0,
  lift_count       integer not null default 0,
  stats_updated_at timestamptz,
  created_at       timestamptz not null default now()
);

-- Usernames are claimed and searched case-insensitively.
create unique index if not exists profiles_username_lower_idx on profiles (lower(username));

-- ----------------------------------------------------------------- follows --

create table if not exists follows (
  follower_id text not null,
  followee_id text not null,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create index if not exists follows_followee_idx on follows (followee_id);

-- A follower can mute a cook they follow without unfollowing them.
create table if not exists notification_prefs (
  user_id     text not null,
  followee_id text not null,
  enabled     boolean not null default true,
  primary key (user_id, followee_id)
);

-- -------------------------------------------------------- community recipes --

create table if not exists community_recipes (
  id          text primary key,
  user_id     text not null,
  name        text not null,
  description text not null default '',
  minutes     integer not null default 30,
  servings    integer not null default 4,
  cuisine     text not null default '',
  -- 'private' | 'followers' | 'public'
  visibility  text not null default 'private',
  ingredients jsonb not null default '[]'::jsonb,
  steps       jsonb not null default '[]'::jsonb,
  aliases     text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists community_recipes_user_idx on community_recipes (user_id, created_at desc);
create index if not exists community_recipes_feed_idx on community_recipes (visibility, created_at desc);

-- ----------------------------------------------------------- notifications --

create table if not exists notifications (
  id         text primary key,
  user_id    text not null,
  kind       text not null,
  actor_id   text not null default '',
  recipe_id  text,
  body       text not null default '',
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on notifications (user_id, created_at desc);

-- --------------------------------------------------------------- messaging --

create table if not exists conversations (
  id         text primary key,
  is_group   boolean not null default false,
  title      text not null default '',
  created_by text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists conversation_members (
  conversation_id text not null,
  user_id         text not null,
  joined_at       timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create index if not exists conversation_members_user_idx on conversation_members (user_id);

create table if not exists messages (
  id              text primary key,
  conversation_id text not null,
  user_id         text not null,
  body            text not null default '',
  created_at      timestamptz not null default now()
);

create index if not exists messages_convo_idx on messages (conversation_id, created_at desc);

-- ----------------------------------------------------------------- billing --

-- One row per Stripe Checkout session we started. The row is written before the
-- redirect so a webhook that lands first still has something to join onto, and
-- so an abandoned checkout is visible as `pending` rather than vanishing.
create table if not exists checkout_sessions (
  id           text primary key,
  user_id      text not null,
  addon_id     text not null,
  -- 'pending' | 'paid' | 'expired' | 'failed'
  status       text not null default 'pending',
  amount_cents integer not null default 0,
  currency     text not null default 'cad',
  created_at   timestamptz not null default now(),
  settled_at   timestamptz
);

create index if not exists checkout_sessions_user_idx on checkout_sessions (user_id, created_at desc);

-- What the cook is actually entitled to. The client's local `unlocked` list is
-- a cache for painting the UI; this table is the source of truth, and the only
-- thing that may be written by a verified Stripe webhook.
--
-- `expires_at` null means it never lapses (a one-time pack, the founder
-- kitchen). A subscription carries the paid-through date and is re-stamped on
-- each renewal.
create table if not exists entitlements (
  user_id     text not null,
  addon_id    text not null,
  source      text not null default 'stripe',
  expires_at  timestamptz,
  granted_at  timestamptz not null default now(),
  primary key (user_id, addon_id)
);

create index if not exists entitlements_user_idx on entitlements (user_id);

-- Consumables (Chef plates) are counted, not owned, so they get their own
-- ledger: each paid pack appends, each spend is recorded, and the balance is
-- the sum. A ledger rather than a counter so a refund or a dispute can be
-- written as a row instead of silently editing a total.
create table if not exists plate_ledger (
  id         text primary key,
  user_id    text not null,
  delta      integer not null,
  reason     text not null,
  week_start date not null,
  created_at timestamptz not null default now()
);

create index if not exists plate_ledger_user_week_idx on plate_ledger (user_id, week_start);

-- Stripe delivers a webhook at least once, not exactly once. Recording the
-- event id and refusing a repeat is what stops a retry from granting the same
-- pack twice.
create table if not exists billing_events (
  event_id   text primary key,
  kind       text not null default '',
  handled_at timestamptz not null default now()
);
