alter table profiles add column if not exists is_private boolean not null default false;

create table if not exists social_posts (
  id text primary key,
  user_id text not null,
  kind text not null,
  body text not null default '',
  media text,
  visibility text not null default 'public',
  created_at timestamptz not null default now()
);

create index if not exists social_posts_user_idx on social_posts (user_id, created_at desc);

create table if not exists social_likes (
  post_id text not null,
  user_id text not null,
  primary key (post_id, user_id)
);

create table if not exists social_saves (
  post_id text not null,
  user_id text not null,
  primary key (post_id, user_id)
);

create table if not exists social_reposts (
  post_id text not null,
  user_id text not null,
  primary key (post_id, user_id)
);

create table if not exists social_comments (
  id text primary key,
  post_id text not null,
  user_id text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists social_comments_post_idx on social_comments (post_id, created_at);
