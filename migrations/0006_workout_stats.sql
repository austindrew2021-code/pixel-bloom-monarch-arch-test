-- Workout stats visible across users, for the followed-friends leaderboard.
alter table profiles add column if not exists xp integer not null default 0;
alter table profiles add column if not exists lift_count integer not null default 0;
alter table profiles add column if not exists stats_updated_at timestamptz not null default now();
