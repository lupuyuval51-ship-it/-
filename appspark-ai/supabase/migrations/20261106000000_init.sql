-- AppSpark AI – initial schema
-- Apply with: supabase db push   (or paste into the SQL editor)
-- Every user-owned table is protected with row-level security.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles (one row per auth user, created automatically)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  locale text not null default 'he' check (locale in ('he', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: owner can read" on public.profiles for select using (auth.uid() = id);
create policy "profiles: owner can update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles: owner can insert" on public.profiles for insert with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Catalogue: categories and curated ideas (public read, admin write)
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  slug text primary key,
  label jsonb not null,          -- {"he": "...", "en": "..."}
  description jsonb not null,
  glyph text not null,
  hue integer not null check (hue between 0 and 360),
  sort_order integer not null default 0
);

create table if not exists public.ideas (
  id text primary key,
  category text not null references public.categories (slug),
  secondary_categories text[] not null default '{}',
  name jsonb not null,
  tagline jsonb not null,
  difficulty text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  effort_weeks_min integer not null check (effort_weeks_min >= 1),
  effort_weeks_max integer not null check (effort_weeks_max >= effort_weeks_min),
  budget text not null check (budget in ('free', 'low', 'medium', 'high')),
  business_model text not null,
  platforms text[] not null default '{}',
  audience text[] not null default '{}',
  tags text[] not null default '{}',
  identity jsonb not null,
  flags jsonb not null,
  spec jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ideas_category_idx on public.ideas (category);
create index if not exists ideas_tags_idx on public.ideas using gin (tags);

alter table public.categories enable row level security;
alter table public.ideas enable row level security;

create policy "categories: public read" on public.categories for select using (true);
create policy "ideas: public read" on public.ideas for select using (true);
-- Writes to the catalogue happen with the service role (seed script / admin), never from clients.

-- ---------------------------------------------------------------------------
-- User data
-- ---------------------------------------------------------------------------
create table if not exists public.saved_ideas (
  user_id uuid not null references auth.users (id) on delete cascade,
  idea_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, idea_id)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  idea_id text,
  name text not null check (char_length(name) between 1 and 120),
  description text not null default '',
  notes text not null default '',
  status text not null default 'saved' check (status in ('saved', 'exploring', 'ready', 'in-development', 'launched')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_user_idx on public.projects (user_id, updated_at desc);

create table if not exists public.generated_prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  idea_id text not null,
  title text not null check (char_length(title) between 1 and 160),
  options jsonb not null,
  content text not null check (char_length(content) <= 60000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists generated_prompts_user_idx on public.generated_prompts (user_id, updated_at desc);
create index if not exists generated_prompts_idea_idx on public.generated_prompts (user_id, idea_id);

create table if not exists public.generated_ideas (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  source text not null check (source in ('ai', 'demo')),
  brief text not null default '',
  idea jsonb not null,
  provider text,
  model text,
  created_at timestamptz not null default now()
);

create index if not exists generated_ideas_user_idx on public.generated_ideas (user_id, created_at desc);

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  theme_mode text not null default 'system' check (theme_mode in ('system', 'dark', 'light')),
  locale text not null default 'he' check (locale in ('he', 'en')),
  onboarding jsonb not null default '{}'::jsonb,
  onboarding_completed boolean not null default false,
  updated_at timestamptz not null default now()
);

-- AI usage accounting for the Edge Function quota
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null default current_date,
  requests integer not null default 0,
  primary key (user_id, day)
);

alter table public.saved_ideas enable row level security;
alter table public.projects enable row level security;
alter table public.generated_prompts enable row level security;
alter table public.generated_ideas enable row level security;
alter table public.user_preferences enable row level security;
alter table public.ai_usage enable row level security;

create policy "saved_ideas: owner all" on public.saved_ideas for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "projects: owner all" on public.projects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "generated_prompts: owner all" on public.generated_prompts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "generated_ideas: owner all" on public.generated_ideas for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_preferences: owner all" on public.user_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "ai_usage: owner read" on public.ai_usage for select using (auth.uid() = user_id);
-- ai_usage is written only by the Edge Function with the service role.

-- Atomic quota increment used by the Edge Function (service role only).
create or replace function public.increment_ai_usage(p_user_id uuid, p_limit integer)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  current_count integer;
begin
  insert into public.ai_usage (user_id, day, requests)
  values (p_user_id, current_date, 1)
  on conflict (user_id, day) do update set requests = public.ai_usage.requests + 1
  returning requests into current_count;
  return current_count <= p_limit;
end;
$$;

revoke all on function public.increment_ai_usage(uuid, integer) from public;
revoke all on function public.increment_ai_usage(uuid, integer) from anon, authenticated;

-- keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_touch on public.projects;
create trigger projects_touch before update on public.projects for each row execute procedure public.touch_updated_at();
drop trigger if exists prompts_touch on public.generated_prompts;
create trigger prompts_touch before update on public.generated_prompts for each row execute procedure public.touch_updated_at();
drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles for each row execute procedure public.touch_updated_at();
