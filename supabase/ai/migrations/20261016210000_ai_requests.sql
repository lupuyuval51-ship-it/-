-- LEVEL UP AI (Supabase project levelup-ai): one row per generation request, so a learner gets one game at a time and a
-- daily limit. Only the Edge Function `generate-game` (service role) touches it: RLS is on and there are no policies.
-- `user_id` is the learner's id in the app's project (levelup-app); there is no foreign key because the accounts live there.

create table public.ai_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  status      text not null default 'PENDING' check (status in ('PENDING', 'DONE', 'FAILED')),
  created_at  timestamptz not null default now(),
  finished_at timestamptz
);
create index ai_requests_user_idx on public.ai_requests (user_id, created_at desc);
alter table public.ai_requests enable row level security;

-- Reserve one generation: refused while another is running (a request left PENDING by a crashed call stops blocking after
-- 3 minutes) or when the learner already has `p_daily` games in the last 24 hours. Only finished games (DONE) and the
-- running one count, so a failed generation never costs anything. Serialised per learner by an advisory lock.
create function public.reserve_ai_request(p_user uuid, p_daily int) returns jsonb
language plpgsql set search_path = '' as $$
declare v_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user::text, 0));
  if exists (select 1 from public.ai_requests where user_id = p_user and status = 'PENDING' and created_at > now() - interval '3 minutes') then
    return jsonb_build_object('refused', 'BUSY');
  end if;
  if (select count(*) from public.ai_requests
      where user_id = p_user and created_at > now() - interval '24 hours'
        and (status = 'DONE' or (status = 'PENDING' and created_at > now() - interval '3 minutes'))) >= p_daily then
    return jsonb_build_object('refused', 'LIMIT');
  end if;
  insert into public.ai_requests (user_id) values (p_user) returning id into v_id;
  return jsonb_build_object('id', v_id);
end $$;

-- Close a reservation: DONE counts towards the daily limit, FAILED is released.
create function public.finish_ai_request(p_id uuid, p_ok boolean) returns void
language sql set search_path = '' as $$
  update public.ai_requests set status = case when p_ok then 'DONE' else 'FAILED' end, finished_at = now()
  where id = p_id and status = 'PENDING';
$$;

revoke all on function public.reserve_ai_request(uuid, int) from public, anon, authenticated;
revoke all on function public.finish_ai_request(uuid, boolean) from public, anon, authenticated;
grant execute on function public.reserve_ai_request(uuid, int) to service_role;
grant execute on function public.finish_ai_request(uuid, boolean) to service_role;
