-- Signed-in kitchen backup: week, pantry, Fuel, body, goal follow the account
-- the same way MyFitnessPal / Lose It keep a log across phones.

create table if not exists kitchen_state (
  user_id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create index if not exists kitchen_state_updated_idx on kitchen_state (updated_at desc);
