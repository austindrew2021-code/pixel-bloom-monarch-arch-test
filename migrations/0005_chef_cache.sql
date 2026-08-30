-- Repeat Chef plates: same prompt + body goal returns the saved dish instantly.
create table if not exists chef_cache (
  prompt_key text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists chef_cache_created_idx on chef_cache (created_at desc);
