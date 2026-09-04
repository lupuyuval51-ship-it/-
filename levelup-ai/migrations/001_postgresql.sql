-- LEVELUP AI PostgreSQL reference deployment schema.
-- IMPORTANT: the current application uses node:sqlite (src/lib/server/db.ts).
-- This migration is a separately deployable PostgreSQL foundation, not an active adapter.
-- Apply once to an empty database with a migration-owner account (PostgreSQL 16+).
BEGIN;
CREATE SCHEMA IF NOT EXISTS levelup;
SET search_path = levelup, pg_catalog;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'levelup_reader') THEN
    CREATE ROLE levelup_reader NOLOGIN NOBYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'levelup_service') THEN
    CREATE ROLE levelup_service NOLOGIN BYPASSRLS;
  END IF;
END $$;
REVOKE ALL ON SCHEMA levelup FROM PUBLIC;
GRANT USAGE ON SCHEMA levelup TO levelup_reader, levelup_service;

CREATE FUNCTION current_user_id() RETURNS uuid LANGUAGE sql STABLE
SET search_path = pg_catalog AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '')::uuid
$$;
-- app.user_id must be set with SET LOCAL inside a transaction after server session validation.
-- Never allow browser clients to connect directly using the service role or set this value.

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text NOT NULL,
  password_hash text NOT NULL, role text NOT NULL DEFAULT 'learner' CHECK (role IN ('learner','admin')),
  email_verified_at timestamptz, blocked_at timestamptz, deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_unique ON users (lower(email)) WHERE deleted_at IS NULL;
CREATE TABLE profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id), display_name varchar(60) NOT NULL,
  birth_year smallint NOT NULL CHECK (birth_year BETWEEN 1900 AND 2200), avatar_key text,
  locale text NOT NULL DEFAULT 'he' CHECK (locale IN ('he','en')), timezone text NOT NULL DEFAULT 'Asia/Jerusalem',
  privacy text NOT NULL DEFAULT 'private' CHECK (privacy IN ('private','public')),
  preferences jsonb NOT NULL DEFAULT '{}', deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE parental_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id),
  parent_email text NOT NULL, token_hash text UNIQUE, status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','revoked','expired')),
  policy_version text NOT NULL, approved_at timestamptz, revoked_at timestamptz, expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE sessions (
  token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id), expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE auth_tokens (
  token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id),
  kind text NOT NULL CHECK (kind IN ('verify','reset','parent')), expires_at timestamptz NOT NULL, used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE plans (
  id text PRIMARY KEY CHECK (id IN ('FREE','BASIC','PLUS','PRO')), name text NOT NULL,
  price_agorot integer NOT NULL CHECK (price_agorot >= 0), currency text NOT NULL DEFAULT 'ILS' CHECK (currency = 'ILS'),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE plan_features (
  plan_id text NOT NULL REFERENCES plans(id), feature text NOT NULL, value jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(plan_id, feature)
);
CREATE TABLE categories (
  id text PRIMARY KEY, title jsonb NOT NULL, is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE learning_paths (
  id text PRIMARY KEY, creator_id uuid REFERENCES users(id), category_id text NOT NULL REFERENCES categories(id),
  title jsonb NOT NULL, description jsonb NOT NULL, cover_key text, level text NOT NULL CHECK (level IN ('beginner','intermediate','advanced')),
  daily_minutes integer NOT NULL CHECK (daily_minutes BETWEEN 5 AND 240), duration_days integer NOT NULL CHECK (duration_days BETWEEN 1 AND 730),
  final_goal jsonb NOT NULL, status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending','approved','rejected','changes_requested','archived')),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0), deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE path_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id), path_id text NOT NULL REFERENCES learning_paths(id),
  skill text NOT NULL, level text NOT NULL, daily_minutes integer NOT NULL CHECK (daily_minutes IN (10,20,30,60)),
  goal text NOT NULL, starts_on date NOT NULL DEFAULT CURRENT_DATE, target_date date NOT NULL,
  learning_styles jsonb NOT NULL DEFAULT '[]', adaptation jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','completed','archived')), deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,path_id)
);
CREATE TABLE chapters (
  id text PRIMARY KEY, path_id text NOT NULL REFERENCES learning_paths(id), title jsonb NOT NULL,
  position integer NOT NULL CHECK (position >= 0), unlock_rule jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(path_id,position)
);
CREATE TABLE lessons (
  id text PRIMARY KEY, chapter_id text NOT NULL REFERENCES chapters(id), title jsonb NOT NULL,
  position integer NOT NULL CHECK (position >= 0),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(chapter_id,position)
);
CREATE TABLE tasks (
  id text PRIMARY KEY, lesson_id text NOT NULL REFERENCES lessons(id), title jsonb NOT NULL,
  type text NOT NULL CHECK (type IN ('practice','quiz','project')), objective jsonb NOT NULL,
  instructions jsonb NOT NULL, examples jsonb NOT NULL, hints jsonb NOT NULL, resources jsonb NOT NULL DEFAULT '[]',
  estimated_minutes integer NOT NULL CHECK (estimated_minutes > 0), xp integer NOT NULL CHECK (xp BETWEEN 0 AND 1000),
  rubric jsonb NOT NULL, question_prompt jsonb, question_options jsonb, answer_key jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id), storage_key text NOT NULL UNIQUE,
  original_name text NOT NULL, mime text NOT NULL CHECK (mime IN ('image/png','image/jpeg','image/webp','application/pdf','text/plain','application/zip')),
  size_bytes integer NOT NULL CHECK (size_bytes BETWEEN 1 AND 5242880), sha256 text NOT NULL CHECK (length(sha256)=64),
  purpose text NOT NULL CHECK (purpose IN ('payment','submission','avatar')), scan_status text NOT NULL DEFAULT 'pending' CHECK (scan_status IN ('pending','clean','rejected')),
  deleted_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE task_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id),
  enrollment_id uuid NOT NULL REFERENCES path_enrollments(id), task_id text NOT NULL REFERENCES tasks(id),
  text text NOT NULL, link text, upload_id uuid REFERENCES uploads(id), difficulty text NOT NULL CHECK (difficulty IN ('easy','right','hard')),
  feedback jsonb NOT NULL, rubric_result jsonb NOT NULL DEFAULT '{}', awarded_xp integer NOT NULL CHECK (awarded_xp >= 0), deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,enrollment_id,task_id)
);
CREATE TABLE ai_coach_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id), enrollment_id uuid REFERENCES path_enrollments(id),
  role text NOT NULL CHECK (role IN ('user','assistant')), content text NOT NULL, provider text NOT NULL,
  is_demo boolean NOT NULL DEFAULT false, usage jsonb NOT NULL DEFAULT '{}', deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE skills (
  id text PRIMARY KEY, category_id text NOT NULL REFERENCES categories(id), title jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE user_skills (
  user_id uuid NOT NULL REFERENCES users(id), skill_id text NOT NULL REFERENCES skills(id), mastery numeric(5,4) NOT NULL DEFAULT 0 CHECK (mastery BETWEEN 0 AND 1),
  evidence_count integer NOT NULL DEFAULT 0 CHECK (evidence_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,skill_id)
);
CREATE TABLE xp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id), source text NOT NULL,
  source_id text NOT NULL, xp integer NOT NULL CHECK (xp >= 0), coins integer NOT NULL DEFAULT 0 CHECK (coins >= 0),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,source,source_id)
);
CREATE TABLE achievements (
  id text PRIMARY KEY, title jsonb NOT NULL, description jsonb NOT NULL, rule jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE user_achievements (
  user_id uuid NOT NULL REFERENCES users(id), achievement_id text NOT NULL REFERENCES achievements(id),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,achievement_id)
);
CREATE TABLE streaks (
  user_id uuid PRIMARY KEY REFERENCES users(id), current_count integer NOT NULL DEFAULT 0 CHECK (current_count >= 0),
  longest_count integer NOT NULL DEFAULT 0 CHECK (longest_count >= current_count), last_day date, protection_count integer NOT NULL DEFAULT 0 CHECK (protection_count BETWEEN 0 AND 3),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id), friend_id uuid NOT NULL REFERENCES users(id),
  status text NOT NULL CHECK (status IN ('pending','accepted','blocked','declined')), CHECK (user_id <> friend_id),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,friend_id)
);
CREATE TABLE challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL REFERENCES users(id), path_id text NOT NULL REFERENCES learning_paths(id),
  title text NOT NULL, invite_code_hash text NOT NULL UNIQUE, status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','closed','cancelled')),
  expires_at timestamptz NOT NULL, rules jsonb NOT NULL DEFAULT '{}', deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE challenge_participants (
  challenge_id uuid NOT NULL REFERENCES challenges(id), user_id uuid NOT NULL REFERENCES users(id), score integer NOT NULL DEFAULT 0 CHECK (score >= 0),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(challenge_id,user_id)
);
CREATE TABLE marketplace_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), path_id text NOT NULL UNIQUE REFERENCES learning_paths(id), creator_id uuid REFERENCES users(id),
  price_agorot integer NOT NULL CHECK (price_agorot >= 0), status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','changes_requested','disabled')),
  preview jsonb NOT NULL, review_note text, reviewed_by uuid REFERENCES users(id), reviewed_at timestamptz, deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id),
  plan_id text REFERENCES plans(id), marketplace_path_id uuid REFERENCES marketplace_paths(id),
  amount_agorot integer NOT NULL CHECK (amount_agorot >= 0), currency text NOT NULL DEFAULT 'ILS' CHECK (currency='ILS'),
  status text NOT NULL DEFAULT 'created' CHECK (status IN ('created','awaiting_payment','proof_uploaded','under_review','approved','rejected','cancelled','refunded_manually')),
  payment_adapter text NOT NULL DEFAULT 'manual_bit', review_note text, internal_note text,
  reviewed_by uuid REFERENCES users(id), reviewed_at timestamptz, deleted_at timestamptz,
  CHECK ((plan_id IS NOT NULL)::integer + (marketplace_path_id IS NOT NULL)::integer = 1),
  CHECK (status <> 'approved' OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id), plan_id text NOT NULL REFERENCES plans(id),
  order_id uuid UNIQUE REFERENCES orders(id), status text NOT NULL CHECK (status IN ('active','expired','cancelled')),
  starts_at timestamptz NOT NULL, expires_at timestamptz NOT NULL CHECK (expires_at > starts_at),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE payment_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id), order_id uuid NOT NULL REFERENCES orders(id),
  upload_id uuid NOT NULL UNIQUE REFERENCES uploads(id), status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','rejected')),
  deleted_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE marketplace_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), marketplace_path_id uuid NOT NULL REFERENCES marketplace_paths(id), buyer_id uuid NOT NULL REFERENCES users(id),
  order_id uuid NOT NULL UNIQUE REFERENCES orders(id), amount_agorot integer NOT NULL CHECK (amount_agorot >= 0),
  commission_agorot integer NOT NULL CHECK (commission_agorot >= 0), creator_agorot integer NOT NULL CHECK (creator_agorot >= 0),
  payout_status text NOT NULL DEFAULT 'not_paid' CHECK (payout_status IN ('not_paid','paid_manually','reversed')),
  CHECK (commission_agorot + creator_agorot = amount_agorot),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id), path_id text NOT NULL REFERENCES learning_paths(id),
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5), comment text NOT NULL CHECK (length(comment)<=2000),
  status text NOT NULL DEFAULT 'visible' CHECK (status IN ('visible','hidden')), deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,path_id)
);
CREATE TABLE favorites (
  user_id uuid NOT NULL REFERENCES users(id), path_id text NOT NULL REFERENCES learning_paths(id),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,path_id)
);
CREATE TABLE daily_game_templates (
  id text PRIMARY KEY, mode text NOT NULL CHECK (mode IN ('answer-gates','escape-room','collect-sort','build-path','boss-quiz')),
  version integer NOT NULL CHECK (version > 0), parameters jsonb NOT NULL, is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE daily_games (
  id text PRIMARY KEY, date date NOT NULL, seed text NOT NULL, version integer NOT NULL, template_id text NOT NULL REFERENCES daily_game_templates(id),
  path_id text NOT NULL REFERENCES learning_paths(id), game_mode text NOT NULL, world_theme text NOT NULL,
  difficulty text NOT NULL, lesson_topics jsonb NOT NULL, obstacles jsonb NOT NULL, rewards jsonb NOT NULL, score_rules jsonb NOT NULL,
  time_limit integer NOT NULL CHECK (time_limit BETWEEN 30 AND 1800), leaderboard_group text NOT NULL,
  minimum_plan text NOT NULL REFERENCES plans(id), is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(date,leaderboard_group,version)
);
CREATE TABLE daily_game_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), daily_game_id text NOT NULL REFERENCES daily_games(id), task_id text REFERENCES tasks(id),
  position integer NOT NULL CHECK (position >= 0), prompt jsonb NOT NULL, options jsonb NOT NULL, answer_key jsonb NOT NULL,
  explanation jsonb NOT NULL, reviewed_by uuid REFERENCES users(id), reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(daily_game_id,position)
);
CREATE TABLE daily_game_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id), daily_game_id text NOT NULL REFERENCES daily_games(id),
  attempt_number smallint NOT NULL CHECK (attempt_number BETWEEN 1 AND 2), status text NOT NULL DEFAULT 'playing' CHECK (status IN ('playing','completed','abandoned','rejected')),
  started_at timestamptz NOT NULL DEFAULT now(), finished_at timestamptz,
  active_elapsed_ms integer NOT NULL DEFAULT 0 CHECK (active_elapsed_ms >= 0), score integer NOT NULL DEFAULT 0 CHECK (score >= 0),
  correct_count smallint NOT NULL DEFAULT 0 CHECK (correct_count >= 0), event_count smallint NOT NULL DEFAULT 0 CHECK (event_count >= correct_count),
  suspicious boolean NOT NULL DEFAULT false, suspicion_reason text, awarded_xp integer NOT NULL DEFAULT 0 CHECK (awarded_xp >= 0),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,daily_game_id,attempt_number)
);
CREATE TABLE game_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), attempt_id uuid NOT NULL REFERENCES daily_game_attempts(id), position integer NOT NULL CHECK (position >= 0),
  question_id uuid REFERENCES daily_game_questions(id), answer integer, correct boolean NOT NULL,
  elapsed_ms integer NOT NULL CHECK (elapsed_ms >= 0), event_type text NOT NULL CHECK (event_type IN ('answer','hint','pause','resume','finish')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(attempt_id,position)
);
CREATE TABLE leaderboards (
  daily_game_id text NOT NULL REFERENCES daily_games(id), user_id uuid NOT NULL REFERENCES users(id),
  first_attempt_id uuid NOT NULL REFERENCES daily_game_attempts(id), first_score integer NOT NULL CHECK (first_score >= 0),
  personal_best integer NOT NULL CHECK (personal_best >= first_score),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(daily_game_id,user_id)
);
CREATE TABLE cosmetic_items (
  id text PRIMARY KEY, title jsonb NOT NULL, kind text NOT NULL, price_coins integer NOT NULL CHECK (price_coins >= 0),
  asset_key text NOT NULL, minimum_plan text NOT NULL REFERENCES plans(id), is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE user_inventory (
  user_id uuid NOT NULL REFERENCES users(id), item_id text NOT NULL REFERENCES cosmetic_items(id), equipped boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,item_id)
);
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id), message jsonb NOT NULL,
  target text, read_at timestamptz, deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id), path_id text REFERENCES learning_paths(id),
  target_user_id uuid REFERENCES users(id), reason text NOT NULL, status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewing','resolved','dismissed')),
  resolved_by uuid REFERENCES users(id), resolution text, deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_id uuid REFERENCES users(id), action text NOT NULL,
  target_type text NOT NULL, target_id text NOT NULL, before_state jsonb, after_state jsonb, request_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE rate_limits (
  key_hash text PRIMARY KEY, count integer NOT NULL CHECK (count >= 0), expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX parental_user_idx ON parental_consents(user_id,status);
CREATE INDEX sessions_user_idx ON sessions(user_id,expires_at);
CREATE INDEX tokens_user_idx ON auth_tokens(user_id,kind,expires_at);
CREATE INDEX subscription_entitlement_idx ON subscriptions(user_id,status,expires_at DESC);
CREATE INDEX path_catalog_idx ON learning_paths(category_id,level,status) WHERE deleted_at IS NULL;
CREATE INDEX enrollment_user_idx ON path_enrollments(user_id,status);
CREATE INDEX submission_user_idx ON task_submissions(user_id,created_at DESC);
CREATE INDEX coach_user_idx ON ai_coach_messages(user_id,created_at DESC);
CREATE INDEX xp_user_idx ON xp_events(user_id,created_at DESC);
CREATE INDEX friendships_receiver_idx ON friendships(friend_id,status);
CREATE INDEX challenge_owner_idx ON challenges(owner_id,status);
CREATE INDEX marketplace_status_idx ON marketplace_paths(status,price_agorot) WHERE deleted_at IS NULL;
CREATE INDEX marketplace_sales_path_idx ON marketplace_sales(marketplace_path_id,created_at DESC);
CREATE INDEX reviews_path_idx ON reviews(path_id,status);
CREATE INDEX daily_date_idx ON daily_games(date,path_id,is_active);
CREATE INDEX attempt_history_idx ON daily_game_attempts(user_id,started_at DESC);
CREATE INDEX attempt_suspicious_idx ON daily_game_attempts(started_at DESC) WHERE suspicious;
CREATE INDEX leaderboard_rank_idx ON leaderboards(daily_game_id,first_score DESC);
CREATE INDEX orders_queue_idx ON orders(status,created_at) WHERE status IN ('proof_uploaded','under_review');
CREATE INDEX orders_owner_idx ON orders(user_id,created_at DESC);
CREATE INDEX proof_owner_idx ON payment_proofs(user_id,order_id);
CREATE INDEX uploads_owner_idx ON uploads(user_id,purpose);
CREATE INDEX notification_user_idx ON notifications(user_id,created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX reports_status_idx ON reports(status,created_at);
CREATE INDEX admin_time_idx ON admin_actions(created_at DESC);
CREATE INDEX admin_target_idx ON admin_actions(target_type,target_id,created_at DESC);
CREATE INDEX rate_limits_expiry_idx ON rate_limits(expires_at);

CREATE FUNCTION touch_updated_at() RETURNS trigger LANGUAGE plpgsql
SET search_path = pg_catalog AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
DO $$ DECLARE t record; BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='levelup' LOOP
    EXECUTE format('ALTER TABLE levelup.%I ENABLE ROW LEVEL SECURITY', t.tablename);
    EXECUTE format('ALTER TABLE levelup.%I FORCE ROW LEVEL SECURITY', t.tablename);
    IF t.tablename <> 'admin_actions' THEN
      EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON levelup.%I FOR EACH ROW EXECUTE FUNCTION levelup.touch_updated_at()',t.tablename);
    END IF;
  END LOOP;
END $$;

-- Least privilege: read identity data without password hashes, tokens, answer keys or internal notes.
GRANT SELECT(id,email,role,email_verified_at,blocked_at,created_at,updated_at) ON users TO levelup_reader;
CREATE POLICY own_identity ON users FOR SELECT TO levelup_reader USING (id=current_user_id() AND deleted_at IS NULL);
GRANT SELECT ON profiles TO levelup_reader;
CREATE POLICY own_profile ON profiles FOR SELECT TO levelup_reader USING (user_id=current_user_id() AND deleted_at IS NULL);
-- Public profiles and leaderboards must be projected by the API into display-name-only DTOs.
DO $$ DECLARE tbl text; BEGIN
  FOREACH tbl IN ARRAY ARRAY['parental_consents','subscriptions','path_enrollments','task_submissions','ai_coach_messages','user_skills','xp_events','user_achievements','streaks','favorites','daily_game_attempts','user_inventory','notifications','reports'] LOOP
    EXECUTE format('GRANT SELECT ON levelup.%I TO levelup_reader',tbl);
    EXECUTE format('CREATE POLICY owner_read ON levelup.%I FOR SELECT TO levelup_reader USING (user_id=levelup.current_user_id())',tbl);
  END LOOP;
END $$;
GRANT SELECT(id,user_id,plan_id,marketplace_path_id,amount_agorot,currency,status,payment_adapter,review_note,reviewed_at,created_at,updated_at) ON orders TO levelup_reader;
CREATE POLICY own_orders ON orders FOR SELECT TO levelup_reader USING(user_id=current_user_id() AND deleted_at IS NULL);
GRANT SELECT(id,user_id,order_id,status,created_at,updated_at) ON payment_proofs TO levelup_reader;
CREATE POLICY own_proofs ON payment_proofs FOR SELECT TO levelup_reader USING(user_id=current_user_id() AND deleted_at IS NULL);
-- No direct grants for uploads/storage paths: authenticated API checks ownership and serves bytes.
DO $$ DECLARE tbl text; BEGIN
  FOREACH tbl IN ARRAY ARRAY['plans','plan_features','categories','achievements','skills','cosmetic_items'] LOOP
    EXECUTE format('GRANT SELECT ON levelup.%I TO levelup_reader',tbl);
    EXECUTE format('CREATE POLICY catalog_read ON levelup.%I FOR SELECT TO levelup_reader USING (true)',tbl);
  END LOOP;
END $$;
GRANT SELECT ON learning_paths TO levelup_reader;
CREATE POLICY published_or_owned ON learning_paths FOR SELECT TO levelup_reader
  USING (deleted_at IS NULL AND (status='approved' OR creator_id=current_user_id()));
GRANT SELECT ON chapters,lessons TO levelup_reader;
CREATE POLICY enrolled_chapters ON chapters FOR SELECT TO levelup_reader USING (
  EXISTS(SELECT 1 FROM path_enrollments e WHERE e.path_id=chapters.path_id AND e.user_id=current_user_id())
);
CREATE POLICY enrolled_lessons ON lessons FOR SELECT TO levelup_reader USING (
  EXISTS(SELECT 1 FROM chapters c WHERE c.id=lessons.chapter_id)
);
GRANT SELECT(id,lesson_id,title,type,objective,instructions,examples,hints,resources,estimated_minutes,xp,rubric,question_prompt,question_options,created_at,updated_at) ON tasks TO levelup_reader;
CREATE POLICY enrolled_tasks ON tasks FOR SELECT TO levelup_reader USING (
  EXISTS(SELECT 1 FROM lessons l WHERE l.id=tasks.lesson_id)
);
GRANT SELECT(id,path_id,creator_id,price_agorot,status,preview,created_at,updated_at) ON marketplace_paths TO levelup_reader;
CREATE POLICY marketplace_visible ON marketplace_paths FOR SELECT TO levelup_reader
  USING(deleted_at IS NULL AND (status='approved' OR creator_id=current_user_id()));
GRANT SELECT ON marketplace_sales TO levelup_reader;
CREATE POLICY own_sales ON marketplace_sales FOR SELECT TO levelup_reader USING (
  buyer_id=current_user_id() OR EXISTS(SELECT 1 FROM marketplace_paths m WHERE m.id=marketplace_sales.marketplace_path_id AND m.creator_id=current_user_id())
);
GRANT SELECT ON reviews TO levelup_reader;
CREATE POLICY own_reviews ON reviews FOR SELECT TO levelup_reader USING(user_id=current_user_id() AND deleted_at IS NULL);
GRANT SELECT ON friendships TO levelup_reader;
CREATE POLICY related_friendships ON friendships FOR SELECT TO levelup_reader USING(user_id=current_user_id() OR friend_id=current_user_id());
GRANT SELECT ON challenge_participants TO levelup_reader;
CREATE POLICY own_participation ON challenge_participants FOR SELECT TO levelup_reader USING(user_id=current_user_id());
GRANT SELECT(id,owner_id,path_id,title,status,expires_at,rules,created_at,updated_at) ON challenges TO levelup_reader;
CREATE POLICY related_challenges ON challenges FOR SELECT TO levelup_reader USING(
  owner_id=current_user_id() OR EXISTS(SELECT 1 FROM challenge_participants p WHERE p.challenge_id=challenges.id AND p.user_id=current_user_id())
);
GRANT SELECT ON daily_games TO levelup_reader;
CREATE POLICY active_games ON daily_games FOR SELECT TO levelup_reader USING(is_active);
GRANT SELECT ON game_events TO levelup_reader;
CREATE POLICY own_game_events ON game_events FOR SELECT TO levelup_reader USING(
  EXISTS(SELECT 1 FROM daily_game_attempts a WHERE a.id=game_events.attempt_id AND a.user_id=current_user_id())
);
GRANT SELECT ON leaderboards TO levelup_reader;
CREATE POLICY own_leaderboard ON leaderboards FOR SELECT TO levelup_reader USING(user_id=current_user_id());

-- Browser/user roles cannot mutate prices, entitlements, scoring, moderation, or audit records.
-- All writes use a trusted server service account after validated session and schema checks.
GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA levelup TO levelup_service;
REVOKE UPDATE,DELETE,TRUNCATE ON admin_actions FROM levelup_service;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA levelup FROM PUBLIC;
GRANT EXECUTE ON FUNCTION current_user_id() TO levelup_reader,levelup_service;

-- Append-only audit: even a mistakenly over-granted runtime role cannot edit history.
CREATE FUNCTION immutable_audit() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN RAISE EXCEPTION 'Audit events are append-only'; END $$;
CREATE TRIGGER immutable_admin_actions BEFORE UPDATE OR DELETE ON admin_actions FOR EACH ROW EXECUTE FUNCTION immutable_audit();
REVOKE ALL ON FUNCTION immutable_audit() FROM PUBLIC;

INSERT INTO plans(id,name,price_agorot) VALUES ('FREE','Free',0),('BASIC','Basic',900),('PLUS','Plus',1900),('PRO','Pro',3900);
INSERT INTO plan_features(plan_id,feature,value)
SELECT p.id, feature,
  to_jsonb(CASE feature
    WHEN 'canPlayFull3DGames' THEN p.id<>'FREE'
    WHEN 'canAccessBasic3DWorlds' THEN p.id<>'FREE'
    WHEN 'canAccessPremium3DWorlds' THEN p.id IN ('PLUS','PRO')
    WHEN 'canViewGameHistory' THEN p.id<>'FREE'
    WHEN 'canViewFullGameHistory' THEN p.id IN ('PLUS','PRO')
    WHEN 'canUseAdvancedCoach' THEN p.id IN ('PLUS','PRO')
    ELSE p.id='PRO' END)
FROM plans p CROSS JOIN unnest(ARRAY[
  'canPlayFull3DGames','canAccessBasic3DWorlds','canAccessPremium3DWorlds','canViewGameHistory',
  'canViewFullGameHistory','canCreatePrivate3DChallenge','canCreate3DGameContent',
  'canAccessEarlyGameModes','canUseAdvancedCoach','canCreateLearningPath','canPublishMarketplacePath'
]) AS f(feature);
INSERT INTO categories(id,title) VALUES
('programming','{"he":"תכנות","en":"Programming"}'),('apps','{"he":"בניית אפליקציות","en":"App development"}'),
('games','{"he":"בניית משחקים","en":"Game development"}'),('ai','{"he":"כלי AI","en":"AI tools"}'),
('english','{"he":"אנגלית","en":"English"}'),('math','{"he":"מתמטיקה","en":"Mathematics"}'),
('content','{"he":"יצירת תוכן","en":"Content creation"}'),('video','{"he":"עריכת וידאו","en":"Video editing"}'),
('design','{"he":"עיצוב","en":"Design"}'),('business','{"he":"יזמות ועסקים","en":"Entrepreneurship"}'),
('marketing','{"he":"שיווק ומכירות","en":"Marketing"}'),('learning','{"he":"הרגלי למידה","en":"Learning habits"}'),
('personal','{"he":"כישורים אישיים","en":"Personal skills"}'),('fitness','{"he":"הרגלים בריאים","en":"Healthy habits"}');
INSERT INTO daily_game_templates(id,mode,version,parameters) VALUES
('answer-gates-v1','answer-gates',1,'{"lanes":3}'),('escape-room-v1','escape-room',1,'{"locks":4}'),
('collect-sort-v1','collect-sort',1,'{"collectibles":8}'),('build-path-v1','build-path',1,'{"segments":8}'),
('boss-quiz-v1','boss-quiz',1,'{"phases":3}');
COMMIT;
