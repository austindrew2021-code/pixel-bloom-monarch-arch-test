-- Family kitchens: shared table, live meal events

create table if not exists kitchens (
  id text primary key,
  name text not null,
  invite_code text not null unique,
  owner_id text not null,
  created_at timestamptz not null default now()
);
create index if not exists kitchens_owner_idx on kitchens (owner_id);
create unique index if not exists kitchens_code_idx on kitchens (invite_code);

create table if not exists kitchen_members (
  kitchen_id text not null,
  user_id text not null,
  role text not null default 'cook',
  joined_at timestamptz not null default now(),
  primary key (kitchen_id, user_id)
);
create index if not exists kitchen_members_user_idx on kitchen_members (user_id);

create table if not exists kitchen_events (
  id text primary key,
  kitchen_id text not null,
  user_id text not null,
  kind text not null,
  body text not null default '',
  recipe_name text,
  created_at timestamptz not null default now()
);
create index if not exists kitchen_events_kitchen_idx on kitchen_events (kitchen_id, created_at desc);
