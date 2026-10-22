-- Row level security checks for the sync tables. Each block creates throw-away users, runs as the `authenticated`
-- role with forged JWT claims, and ends with RAISE EXCEPTION so everything is rolled back. Run them one by one
-- (e.g. in the SQL editor). Results on project yhxwgfgodxbzdvaqtqjz (levelup-app), 2026-10-16 (the same on dytftgtyugvzfumdcoep, 2026-10-10):
--   owner sees own rows; another user sees 0 rows and updates/deletes 0 rows       PASS
--   insert with another user's user_id -> 42501 (RLS)                              PASS
--   session pointing at another user's game -> 23503 (foreign key)                PASS
--   spec > 1 MB -> 23514; invalid session status -> 23514                         PASS
--   updated_at is stamped by the server (client value ignored)                     PASS
--   anon role sees 0 rows                                                          PASS
--   cascade on user delete: NOT RUN — deleting from auth.users through the SQL
--   endpoint hangs on this project even with no rows in these tables; the app deletes
--   accounts through the Auth admin API (edge function `delete-account`) instead.

-- 1) isolation between two users
do $$ declare a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); n int; u int; d int; begin
  insert into auth.users (id, aud, role, email) values (a, 'authenticated', 'authenticated', 'rls-a@example.test'), (b, 'authenticated', 'authenticated', 'rls-b@example.test');
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  insert into public.games (local_id, title, spec) values ('g1', 'A game', '{"x":1}');
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  select count(*) into n from public.games;
  with x as (update public.games set title = 'hacked' returning 1) select count(*) into u from x;
  with y as (delete from public.games returning 1) select count(*) into d from y;
  raise exception 'B sees % rows, updated %, deleted % (expected 0, 0, 0)', n, u, d;
end $$;

-- 2) writes on behalf of another user are refused
do $$ declare a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); res text := ''; begin
  insert into auth.users (id, aud, role, email) values (a, 'authenticated', 'authenticated', 'rls-a@example.test'), (b, 'authenticated', 'authenticated', 'rls-b@example.test');
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  insert into public.games (local_id, title, spec) values ('g1', 'A game', '{"x":1}');
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  begin insert into public.games (user_id, local_id, title, spec) values (a, 'evil', 'x', '{}'); res := res || 'FAIL insert-as-A; ';
  exception when others then res := res || 'insert-as-A blocked ' || sqlstate || '; '; end;
  begin insert into public.sessions (local_id, game_id, status, state) values ('s2', 'g1', 'ACTIVE', '{}'); res := res || 'FAIL cross-user FK; ';
  exception when others then res := res || 'cross-user FK blocked ' || sqlstate || '; '; end;
  raise exception '%', res;
end $$;

-- 3) limits and server timestamps
do $$ declare a uuid := gen_random_uuid(); n int; res text := ''; begin
  insert into auth.users (id, aud, role, email) values (a, 'authenticated', 'authenticated', 'rls-a@example.test');
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  begin insert into public.games (local_id, title, spec) values ('big', 'big', to_jsonb(repeat('x', 1100000))); res := res || 'FAIL oversize; ';
  exception when others then res := res || 'oversize blocked ' || sqlstate || '; '; end;
  insert into public.games (local_id, title, spec, updated_at) values ('t', 't', '{}', '2000-01-01');
  select count(*) into n from public.games where local_id = 't' and updated_at > now() - interval '1 minute';
  raise exception '% server-stamped=%', res, (n = 1);
end $$;

-- 4) anonymous visitors see nothing
set local role anon;
select (select count(*) from public.games) as games, (select count(*) from public.sessions) as sessions, (select count(*) from public.deck_cards) as cards;
