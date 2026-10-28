-- Sessions module: persist the progression suggestion shown for each session exercise
-- (computed once when the exercise is added, so the reason stays stable during the
-- workout), persist the full reward result of a finished session (so the summary can be
-- re-rendered after a refresh), and index lookups by session.
ALTER TABLE session_exercises ADD COLUMN suggestion jsonb;
ALTER TABLE workout_sessions ADD COLUMN rewards jsonb;

CREATE INDEX session_sets_session_idx ON session_sets (session_id);
CREATE INDEX personal_records_session_idx ON personal_records (session_id);
CREATE INDEX workout_sessions_plan_workout_idx ON workout_sessions (user_id, plan_workout_id, started_at DESC) WHERE status = 'completed';
