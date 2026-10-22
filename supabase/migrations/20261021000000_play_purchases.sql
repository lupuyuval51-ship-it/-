-- UNUSED since 2026-10-22: the server-side purchase check that used this table was removed (see supabase/README.md). Kept because it was applied.
-- LEVEL UP (Android app): Google Play purchases checked by the server.
-- The Edge Function `verify-purchase` asks Google's Play Developer API about the purchase tokens a signed-in phone sends and
-- stores the verdict here. Rows are written ONLY by that function (service role): an account can read its own rows and can
-- never insert, change or delete one, so nobody can give themselves a plan from the app.
-- The purchase token itself is never stored, only its SHA-256, which is enough to say "this purchase already belongs to an account".

create table public.play_purchases (
  token_hash  text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
  user_id     uuid not null references auth.users (id) on delete cascade,
  product_id  text not null check (product_id in ('levelup_plus', 'levelup_pro', 'levelup_plus_lifetime', 'levelup_pro_lifetime')),
  plan        text check (plan in ('PLUS', 'PRO')),
  kind        text check (kind in ('SUBSCRIPTION', 'LIFETIME')),
  entitled    boolean not null,
  reason      text check (reason in ('EXPIRED', 'REFUNDED', 'PENDING', 'ON_HOLD', 'PAUSED', 'UNKNOWN_PRODUCT', 'UNKNOWN_STATE')),
  expires_at  timestamptz,                 -- end of the paid period (null for a purchase made once)
  verified_at timestamptz not null,        -- when Google last confirmed this verdict
  created_at  timestamptz not null default now()
);

create index play_purchases_user_idx on public.play_purchases (user_id, verified_at desc);

alter table public.play_purchases enable row level security;
-- read-only for the owner; no insert/update/delete policy exists, so only the service role (the function) can write
create policy play_purchases_owner_read on public.play_purchases for select to authenticated
  using ((select auth.uid()) = user_id);

-- Stores a verdict for the user unless ANOTHER account already holds the token (first proof wins). One atomic statement, so two
-- accounts racing for the same token cannot both get it. Returns true when the user holds the token afterwards.
create function public.claim_play_purchase(
  p_user uuid, p_hash text, p_product text, p_plan text, p_kind text, p_entitled boolean, p_reason text, p_expires timestamptz, p_verified timestamptz
) returns boolean language plpgsql security invoker set search_path = '' as $$
declare v_user uuid;
begin
  insert into public.play_purchases as t (token_hash, user_id, product_id, plan, kind, entitled, reason, expires_at, verified_at)
  values (p_hash, p_user, p_product, p_plan, p_kind, p_entitled, p_reason, p_expires, p_verified)
  on conflict (token_hash) do update
    set product_id = excluded.product_id, plan = excluded.plan, kind = excluded.kind, entitled = excluded.entitled,
        reason = excluded.reason, expires_at = excluded.expires_at, verified_at = excluded.verified_at
    where t.user_id = excluded.user_id
  returning t.user_id into v_user;
  return v_user is not null;
end $$;

-- only the Edge Function (service role) may call it
revoke execute on function public.claim_play_purchase(uuid, text, text, text, text, boolean, text, timestamptz, timestamptz) from public, anon, authenticated;
