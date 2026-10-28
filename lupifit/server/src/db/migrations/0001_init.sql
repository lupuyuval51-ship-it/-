-- FITAI initial schema.
-- Conventions: uuid primary keys, timestamptz everywhere, every user-owned row carries
-- user_id (ON DELETE CASCADE) so authorization filters and account deletion are simple.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- App metadata (content seed versions etc.)
-- ---------------------------------------------------------------------------
CREATE TABLE app_meta (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Identity & authentication
-- ---------------------------------------------------------------------------
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 254),
  password_hash text NOT NULL,
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 60),
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  locale text NOT NULL DEFAULT 'he' CHECK (locale IN ('he', 'en')),
  theme text NOT NULL DEFAULT 'system' CHECK (theme IN ('system', 'dark', 'light')),
  units text NOT NULL DEFAULT 'metric' CHECK (units IN ('metric', 'imperial')),
  timezone text NOT NULL DEFAULT 'UTC' CHECK (char_length(timezone) BETWEEN 1 AND 64),
  failed_login_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  password_changed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_lower_key ON users (lower(email));
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Opaque session tokens: the cookie holds a random token, the DB only stores its SHA-256.
CREATE TABLE auth_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  csrf_token text NOT NULL,
  user_agent text,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
CREATE INDEX auth_sessions_user_idx ON auth_sessions (user_id);
CREATE INDEX auth_sessions_expires_idx ON auth_sessions (expires_at);

CREATE TABLE password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX password_reset_tokens_user_idx ON password_reset_tokens (user_id);

-- Stored responses for client-supplied Idempotency-Key headers (duplicate-submission protection).
CREATE TABLE idempotency_keys (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key text NOT NULL CHECK (char_length(key) BETWEEN 8 AND 100),
  method text NOT NULL,
  path text NOT NULL,
  status_code integer,
  response jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, key)
);
CREATE INDEX idempotency_keys_created_idx ON idempotency_keys (created_at);

-- ---------------------------------------------------------------------------
-- Profile (onboarding questionnaire, preferences, nutrition targets, reminders)
-- ---------------------------------------------------------------------------
CREATE TABLE profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  age_years integer CHECK (age_years BETWEEN 13 AND 100),
  age_recorded_on date,
  sex text CHECK (sex IN ('male', 'female', 'unspecified')),
  height_cm numeric(5,1) CHECK (height_cm BETWEEN 120 AND 230),
  weight_kg numeric(5,1) CHECK (weight_kg BETWEEN 30 AND 300),
  experience_level text CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  -- Self-reported ability benchmarks: { pushUpsMax, pullUpsMax, plankSeconds, squat1rmKg, bench1rmKg, deadlift1rmKg }
  ability jsonb NOT NULL DEFAULT '{}'::jsonb,
  goal text CHECK (goal IN ('muscle_gain', 'strength', 'general_fitness', 'fat_loss', 'athletic_performance')),
  training_location text CHECK (training_location IN ('gym', 'home', 'outdoor')),
  equipment text[] NOT NULL DEFAULT '{}',
  days_per_week integer CHECK (days_per_week BETWEEN 1 AND 7),
  session_minutes integer CHECK (session_minutes BETWEEN 15 AND 180),
  preferred_days integer[] NOT NULL DEFAULT '{}',
  focus_muscle_groups text[] NOT NULL DEFAULT '{}',
  avoid_exercise_ids text[] NOT NULL DEFAULT '{}',
  exercise_likes text NOT NULL DEFAULT '',
  exercise_dislikes text NOT NULL DEFAULT '',
  limitations text NOT NULL DEFAULT '',
  injuries text[] NOT NULL DEFAULT '{}',
  injury_notes text NOT NULL DEFAULT '',
  diet_type text CHECK (diet_type IN ('omnivore', 'vegetarian', 'vegan', 'pescatarian')),
  allergies text[] NOT NULL DEFAULT '{}',
  dietary_restrictions text[] NOT NULL DEFAULT '{}',
  disliked_foods text NOT NULL DEFAULT '',
  activity_level text CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  occupation_activity text CHECK (occupation_activity IN ('desk', 'mixed', 'physical')),
  sleep_hours numeric(3,1) CHECK (sleep_hours BETWEEN 0 AND 24),
  stress_level text CHECK (stress_level IN ('low', 'moderate', 'high')),
  meals_per_day integer CHECK (meals_per_day BETWEEN 1 AND 8),
  weekly_workout_goal integer CHECK (weekly_workout_goal BETWEEN 1 AND 7),
  calorie_target integer CHECK (calorie_target BETWEEN 1000 AND 6000),
  protein_target_g integer CHECK (protein_target_g BETWEEN 20 AND 400),
  carbs_target_g integer CHECK (carbs_target_g BETWEEN 0 AND 900),
  fat_target_g integer CHECK (fat_target_g BETWEEN 15 AND 300),
  targets_custom boolean NOT NULL DEFAULT false,
  reminders jsonb NOT NULL DEFAULT '{"enabled": false, "workoutDays": [], "workoutTime": "18:00", "mealLogging": false, "mealTimes": ["08:00", "13:00", "19:30"]}'::jsonb,
  onboarding_completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE body_weight_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  measured_on date NOT NULL,
  weight_kg numeric(5,1) NOT NULL CHECK (weight_kg BETWEEN 30 AND 300),
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, measured_on)
);
CREATE TRIGGER body_weight_entries_updated_at BEFORE UPDATE ON body_weight_entries FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Exercise library (seeded from server/src/data/exercises)
-- ---------------------------------------------------------------------------
CREATE TABLE exercises (
  id text PRIMARY KEY CHECK (id ~ '^[a-z0-9]+(_[a-z0-9]+)*$'),
  name jsonb NOT NULL,              -- { en, he }
  description jsonb NOT NULL,       -- { en, he }
  primary_muscles text[] NOT NULL,
  secondary_muscles text[] NOT NULL DEFAULT '{}',
  equipment text[] NOT NULL DEFAULT '{}',
  category text NOT NULL,
  movement_pattern text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  tracking_type text NOT NULL CHECK (tracking_type IN ('weight_reps', 'reps', 'time')),
  unilateral boolean NOT NULL DEFAULT false,
  is_compound boolean NOT NULL DEFAULT false,
  instructions jsonb NOT NULL,      -- { en: [], he: [] }
  mistakes jsonb NOT NULL,
  safety jsonb NOT NULL,
  contraindications text[] NOT NULL DEFAULT '{}',
  easier_alternatives text[] NOT NULL DEFAULT '{}',
  harder_alternatives text[] NOT NULL DEFAULT '{}',
  load_increment_kg numeric(4,1),
  -- Demonstration media. NULL until a real, licensed asset is attached — the UI never implies media exists otherwise.
  media_url text,
  media_type text CHECK (media_type IN ('video', 'animation', 'image')),
  media_credit text,
  search_text text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX exercises_search_trgm_idx ON exercises USING gin (search_text gin_trgm_ops);
CREATE TRIGGER exercises_updated_at BEFORE UPDATE ON exercises FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Workout plans
-- ---------------------------------------------------------------------------
CREATE TABLE workout_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  goal text CHECK (goal IN ('muscle_gain', 'strength', 'general_fitness', 'fat_loss', 'athletic_performance')),
  split_type text NOT NULL DEFAULT 'custom' CHECK (split_type IN ('full_body', 'upper_lower', 'push_pull_legs', 'upper_lower_full', 'custom')),
  days_per_week integer CHECK (days_per_week BETWEEN 1 AND 7),
  session_minutes integer CHECK (session_minutes BETWEEN 15 AND 180),
  source text NOT NULL CHECK (source IN ('generated', 'custom', 'duplicate')),
  generator_version text,
  generation_input jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Human-readable explanation of generator decisions: [{ code, params }] rendered via i18n on the client.
  generation_notes jsonb NOT NULL DEFAULT '[]'::jsonb,
  next_workout_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX workout_plans_one_active_idx ON workout_plans (user_id) WHERE status = 'active';
CREATE INDEX workout_plans_user_idx ON workout_plans (user_id, updated_at DESC);
CREATE TRIGGER workout_plans_updated_at BEFORE UPDATE ON workout_plans FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE plan_workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position integer NOT NULL CHECK (position >= 0),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  focus text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  estimated_minutes integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX plan_workouts_plan_idx ON plan_workouts (plan_id, position);
CREATE TRIGGER plan_workouts_updated_at BEFORE UPDATE ON plan_workouts FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE plan_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id uuid NOT NULL REFERENCES plan_workouts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id text NOT NULL REFERENCES exercises(id),
  position integer NOT NULL CHECK (position >= 0),
  sets integer NOT NULL CHECK (sets BETWEEN 1 AND 10),
  rep_min integer CHECK (rep_min BETWEEN 1 AND 100),
  rep_max integer CHECK (rep_max BETWEEN 1 AND 100),
  target_seconds integer CHECK (target_seconds BETWEEN 5 AND 7200),
  rest_seconds integer NOT NULL CHECK (rest_seconds BETWEEN 0 AND 600),
  target_rpe numeric(3,1) CHECK (target_rpe BETWEEN 1 AND 10),
  target_weight_kg numeric(6,2) CHECK (target_weight_kg BETWEEN 0 AND 1000),
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (rep_min IS NULL OR rep_max IS NULL OR rep_min <= rep_max),
  CHECK (rep_min IS NOT NULL OR target_seconds IS NOT NULL)
);
CREATE INDEX plan_exercises_workout_idx ON plan_exercises (workout_id, position);
CREATE TRIGGER plan_exercises_updated_at BEFORE UPDATE ON plan_exercises FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Workout sessions (execution & history)
-- ---------------------------------------------------------------------------
CREATE TABLE workout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES workout_plans(id) ON DELETE SET NULL,
  plan_workout_id uuid REFERENCES plan_workouts(id) ON DELETE SET NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'paused', 'completed', 'abandoned')),
  started_at timestamptz NOT NULL DEFAULT now(),
  paused_at timestamptz,
  paused_seconds integer NOT NULL DEFAULT 0 CHECK (paused_seconds >= 0),
  ended_at timestamptz,
  duration_seconds integer CHECK (duration_seconds >= 0),
  current_exercise_index integer NOT NULL DEFAULT 0,
  -- { durationSeconds, endsAt (ISO) | null, remainingSeconds (when paused) | null, exerciseId }
  rest_timer jsonb,
  total_volume_kg numeric(12,2),
  total_sets integer,
  total_reps integer,
  perceived_exertion integer CHECK (perceived_exertion BETWEEN 1 AND 10),
  notes text NOT NULL DEFAULT '',
  xp_awarded integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((status = 'paused') = (paused_at IS NOT NULL))
);
CREATE UNIQUE INDEX workout_sessions_one_open_idx ON workout_sessions (user_id) WHERE status IN ('in_progress', 'paused');
CREATE INDEX workout_sessions_user_started_idx ON workout_sessions (user_id, started_at DESC);
CREATE TRIGGER workout_sessions_updated_at BEFORE UPDATE ON workout_sessions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE session_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id text NOT NULL REFERENCES exercises(id),
  position integer NOT NULL CHECK (position >= 0),
  rep_min integer,
  rep_max integer,
  target_seconds integer,
  rest_seconds integer NOT NULL DEFAULT 90 CHECK (rest_seconds BETWEEN 0 AND 600),
  target_rpe numeric(3,1),
  target_weight_kg numeric(6,2),
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX session_exercises_session_idx ON session_exercises (session_id, position);
CREATE INDEX session_exercises_user_exercise_idx ON session_exercises (user_id, exercise_id);
CREATE TRIGGER session_exercises_updated_at BEFORE UPDATE ON session_exercises FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE session_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_exercise_id uuid NOT NULL REFERENCES session_exercises(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  set_number integer NOT NULL CHECK (set_number BETWEEN 1 AND 50),
  target_reps integer,
  target_weight_kg numeric(6,2),
  target_seconds integer,
  reps integer CHECK (reps BETWEEN 0 AND 1000),
  weight_kg numeric(6,2) CHECK (weight_kg BETWEEN 0 AND 1000),
  duration_seconds integer CHECK (duration_seconds BETWEEN 0 AND 7200),
  rpe numeric(3,1) CHECK (rpe BETWEEN 1 AND 10),
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (completed = (completed_at IS NOT NULL))
);
CREATE INDEX session_sets_exercise_idx ON session_sets (session_exercise_id, set_number);
CREATE INDEX session_sets_user_completed_idx ON session_sets (user_id, completed_at);
CREATE TRIGGER session_sets_updated_at BEFORE UPDATE ON session_sets FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE personal_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id text NOT NULL REFERENCES exercises(id),
  record_type text NOT NULL CHECK (record_type IN ('max_weight', 'est_1rm', 'max_reps', 'max_volume', 'max_duration')),
  value numeric(10,2) NOT NULL,
  previous_value numeric(10,2),
  weight_kg numeric(6,2),
  reps integer,
  duration_seconds integer,
  session_id uuid REFERENCES workout_sessions(id) ON DELETE CASCADE,
  set_id uuid REFERENCES session_sets(id) ON DELETE SET NULL,
  achieved_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX personal_records_lookup_idx ON personal_records (user_id, exercise_id, record_type, value DESC);
CREATE INDEX personal_records_user_time_idx ON personal_records (user_id, achieved_at DESC);

-- ---------------------------------------------------------------------------
-- Nutrition
-- ---------------------------------------------------------------------------
CREATE TABLE foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE,                                            -- built-in foods only
  owner_user_id uuid REFERENCES users(id) ON DELETE CASCADE,  -- NULL = shared/global
  source text NOT NULL CHECK (source IN ('builtin', 'user', 'openfoodfacts')),
  name jsonb NOT NULL,                                         -- { en, he }
  brand text,
  barcode text CHECK (barcode ~ '^[0-9]{6,14}$'),
  category text NOT NULL,
  kcal numeric(6,1) NOT NULL CHECK (kcal BETWEEN 0 AND 900),   -- all nutrient values are per 100 g
  protein_g numeric(6,2) NOT NULL CHECK (protein_g BETWEEN 0 AND 100),
  carbs_g numeric(6,2) NOT NULL CHECK (carbs_g BETWEEN 0 AND 100),
  fat_g numeric(6,2) NOT NULL CHECK (fat_g BETWEEN 0 AND 100),
  fiber_g numeric(6,2) NOT NULL DEFAULT 0 CHECK (fiber_g BETWEEN 0 AND 100),
  sugar_g numeric(6,2) CHECK (sugar_g BETWEEN 0 AND 100),
  sodium_mg numeric(8,1) CHECK (sodium_mg BETWEEN 0 AND 100000),
  serving_grams numeric(6,1) NOT NULL CHECK (serving_grams > 0 AND serving_grams <= 2000),
  serving_label jsonb NOT NULL,                                -- { en, he }
  allergens text[] NOT NULL DEFAULT '{}',
  animal_source text NOT NULL DEFAULT 'none' CHECK (animal_source IN ('none', 'dairy_egg', 'fish', 'meat')),
  contains text[] NOT NULL DEFAULT '{}',
  search_text text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (source <> 'user' OR owner_user_id IS NOT NULL),
  CHECK (source <> 'builtin' OR slug IS NOT NULL)
);
CREATE UNIQUE INDEX foods_global_barcode_idx ON foods (barcode) WHERE owner_user_id IS NULL AND barcode IS NOT NULL;
CREATE INDEX foods_owner_idx ON foods (owner_user_id);
CREATE INDEX foods_search_trgm_idx ON foods USING gin (search_text gin_trgm_ops);
CREATE TRIGGER foods_updated_at BEFORE UPDATE ON foods FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE food_log_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  logged_on date NOT NULL,
  meal_type text NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  food_id uuid REFERENCES foods(id) ON DELETE SET NULL,
  food_name jsonb NOT NULL,                                    -- snapshot { en, he }
  grams numeric(7,1) CHECK (grams > 0 AND grams <= 5000),      -- NULL for quick-add calorie entries
  servings numeric(6,2) CHECK (servings > 0 AND servings <= 100),
  kcal numeric(7,1) NOT NULL CHECK (kcal BETWEEN 0 AND 20000),
  protein_g numeric(7,1) NOT NULL DEFAULT 0 CHECK (protein_g >= 0),
  carbs_g numeric(7,1) NOT NULL DEFAULT 0 CHECK (carbs_g >= 0),
  fat_g numeric(7,1) NOT NULL DEFAULT 0 CHECK (fat_g >= 0),
  fiber_g numeric(7,1) NOT NULL DEFAULT 0 CHECK (fiber_g >= 0),
  is_corrected boolean NOT NULL DEFAULT false,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'barcode', 'photo', 'saved_meal', 'suggestion', 'quick_add')),
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX food_log_entries_user_day_idx ON food_log_entries (user_id, logged_on);
CREATE INDEX food_log_entries_user_food_idx ON food_log_entries (user_id, food_id);
CREATE TRIGGER food_log_entries_updated_at BEFORE UPDATE ON food_log_entries FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE saved_meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  meal_type text CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX saved_meals_user_idx ON saved_meals (user_id);
CREATE TRIGGER saved_meals_updated_at BEFORE UPDATE ON saved_meals FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE saved_meal_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_meal_id uuid NOT NULL REFERENCES saved_meals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  food_id uuid NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  grams numeric(7,1) NOT NULL CHECK (grams > 0 AND grams <= 5000),
  position integer NOT NULL DEFAULT 0
);
CREATE INDEX saved_meal_items_meal_idx ON saved_meal_items (saved_meal_id, position);

CREATE TABLE meal_templates (
  slug text PRIMARY KEY,
  name jsonb NOT NULL,
  description jsonb NOT NULL,
  meal_types text[] NOT NULL,
  items jsonb NOT NULL,          -- [{ foodSlug, grams }]
  prep_minutes integer NOT NULL DEFAULT 10,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- AI coach
-- ---------------------------------------------------------------------------
CREATE TABLE coach_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '' CHECK (char_length(title) <= 120),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX coach_threads_user_idx ON coach_threads (user_id, updated_at DESC);
CREATE TRIGGER coach_threads_updated_at BEFORE UPDATE ON coach_threads FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE coach_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES coach_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL CHECK (char_length(content) <= 20000),
  source text CHECK (source IN ('llm', 'builtin')),
  status text NOT NULL DEFAULT 'ok' CHECK (status IN ('ok', 'error', 'refused')),
  model text,
  input_tokens integer,
  output_tokens integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX coach_messages_thread_idx ON coach_messages (thread_id, created_at);
CREATE INDEX coach_messages_user_idx ON coach_messages (user_id, created_at);

-- ---------------------------------------------------------------------------
-- Motivation: XP, achievements, notifications
-- ---------------------------------------------------------------------------
CREATE TABLE xp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_type text NOT NULL,
  source_key text NOT NULL,           -- idempotency key (session id, date, week…)
  xp integer NOT NULL CHECK (xp BETWEEN 0 AND 1000),
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, source_type, source_key)
);
CREATE INDEX xp_events_user_idx ON xp_events (user_id, created_at DESC);

CREATE TABLE user_achievements (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id text NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, achievement_id)
);

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('achievement', 'level_up', 'personal_record', 'weekly_goal', 'reminder', 'info')),
  data jsonb NOT NULL DEFAULT '{}'::jsonb,   -- rendered client-side via i18n (no free text stored)
  dedupe_key text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON notifications (user_id, created_at DESC);
CREATE UNIQUE INDEX notifications_dedupe_idx ON notifications (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL;
