create table if not exists profiles (
  user_id text primary key,
  username text not null unique,
  display_name text not null default '',
  bio text not null default '',
  xp integer not null default 0,
  lift_count integer not null default 0,
  stats_updated_at timestamptz
);

create table if not exists follows (
  follower_id text not null,
  followee_id text not null,
  primary key (follower_id, followee_id)
);

create table if not exists notification_prefs (
  user_id text not null,
  followee_id text not null,
  enabled boolean not null default true,
  primary key (user_id, followee_id)
);

create table if not exists notifications (
  id text primary key,
  user_id text not null,
  kind text not null,
  actor_id text,
  recipe_id text,
  body text not null default '',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on notifications (user_id, created_at desc);

create table if not exists community_recipes (
  id text primary key,
  user_id text not null,
  name text not null,
  description text not null default '',
  minutes integer not null default 30,
  servings integer not null default 2,
  cuisine text not null default '',
  visibility text not null default 'private',
  ingredients jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  aliases text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists conversations (
  id text primary key,
  is_group boolean not null default false,
  title text not null default '',
  created_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists conversation_members (
  conversation_id text not null references conversations (id) on delete cascade,
  user_id text not null,
  primary key (conversation_id, user_id)
);

create table if not exists messages (
  id text primary key,
  conversation_id text not null references conversations (id) on delete cascade,
  user_id text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_convo_idx on messages (conversation_id, created_at);

create table if not exists kitchens (
  id text primary key,
  name text not null,
  invite_code text not null unique,
  owner_id text not null
);

create table if not exists kitchen_members (
  kitchen_id text not null references kitchens (id) on delete cascade,
  user_id text not null,
  role text not null default 'cook',
  primary key (kitchen_id, user_id)
);

create table if not exists kitchen_events (
  id text primary key,
  kitchen_id text not null references kitchens (id) on delete cascade,
  user_id text not null,
  kind text not null,
  body text not null default '',
  recipe_name text,
  created_at timestamptz not null default now()
);

create table if not exists chef_cache (
  prompt_key text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
