-- Spoonful community: profiles, homemade recipes, follows, chat, notifications

create table if not exists profiles (
  user_id text primary key,
  username text not null unique,
  display_name text not null default '',
  bio text not null default '',
  created_at timestamptz not null default now()
);
create unique index if not exists profiles_username_lower_idx on profiles (lower(username));

create table if not exists community_recipes (
  id text primary key,
  user_id text not null,
  name text not null,
  description text not null default '',
  minutes integer not null default 30,
  servings integer not null default 4,
  cuisine text not null default 'Homemade',
  visibility text not null default 'private',
  ingredients jsonb not null default '[]',
  steps jsonb not null default '[]',
  aliases text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists community_recipes_user_idx on community_recipes (user_id);
create index if not exists community_recipes_vis_idx on community_recipes (visibility, created_at desc);

create table if not exists follows (
  follower_id text not null,
  followee_id text not null,
  created_at timestamptz not null default now(),
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
  actor_id text not null,
  recipe_id text,
  body text not null default '',
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on notifications (user_id, created_at desc);

create table if not exists conversations (
  id text primary key,
  is_group boolean not null default false,
  title text not null default '',
  created_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists conversation_members (
  conversation_id text not null,
  user_id text not null,
  primary key (conversation_id, user_id)
);
create index if not exists conversation_members_user_idx on conversation_members (user_id);

create table if not exists messages (
  id text primary key,
  conversation_id text not null,
  user_id text not null,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists messages_conv_idx on messages (conversation_id, created_at);
