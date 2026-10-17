-- LEVEL UP (Android app): optional cloud backup & sync. The app stays fully usable offline; signed-in users also
-- back their games, progress and review deck up here so they can change phones.
-- Every table is owner-only (row level security); the browser/app only ever holds the public publishable key.

create table public.games (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  local_id   text not null check (char_length(local_id) between 1 and 64),
  title      text not null check (char_length(title) between 1 and 200),
  spec       jsonb not null check (pg_column_size(spec) <= 1048576),   -- 1 MB: a game is far smaller
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,                                              -- tombstone so deletions sync to other devices
  primary key (user_id, local_id)
);

create table public.sessions (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  local_id   text not null check (char_length(local_id) between 1 and 64),
  game_id    text not null check (char_length(game_id) between 1 and 64),
  status     text not null check (status in ('ACTIVE', 'COMPLETED', 'ABANDONED')),
  state      jsonb not null check (pg_column_size(state) <= 262144),
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, local_id),
  foreign key (user_id, game_id) references public.games (user_id, local_id) on delete cascade
);

create table public.deck_cards (
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  card_key     text not null check (char_length(card_key) between 1 and 160),
  game_id      text not null check (char_length(game_id) between 1 and 64),
  challenge_id text not null check (char_length(challenge_id) between 1 and 64),
  box          smallint not null check (box between 1 and 5),
  due          timestamptz not null,
  updated_at   timestamptz not null default now(),
  primary key (user_id, card_key),
  foreign key (user_id, game_id) references public.games (user_id, local_id) on delete cascade
);

-- the composite primary keys already index user_id first; add the sync cursor
create index games_sync_idx      on public.games      (user_id, updated_at);
create index sessions_sync_idx   on public.sessions   (user_id, updated_at);
create index deck_cards_sync_idx on public.deck_cards (user_id, updated_at);

-- Row level security: a signed-in user can read and write only their own rows. Anonymous visitors get nothing.
alter table public.games      enable row level security;
alter table public.sessions   enable row level security;
alter table public.deck_cards enable row level security;

create policy games_owner on public.games for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy sessions_owner on public.sessions for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy deck_cards_owner on public.deck_cards for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Last write wins: the server sets updated_at, never the client.
create function public.touch_updated_at() returns trigger language plpgsql
set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger games_touch      before insert or update on public.games      for each row execute function public.touch_updated_at();
create trigger sessions_touch   before insert or update on public.sessions   for each row execute function public.touch_updated_at();
create trigger deck_cards_touch before insert or update on public.deck_cards for each row execute function public.touch_updated_at();

-- Deleting the account (auth.users row) cascades to all of the above. A user may also remove their data from the app.
