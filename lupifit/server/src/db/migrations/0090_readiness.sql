-- Optional pre-workout readiness check-in (three taps) and the adjustment it caused for a session.
CREATE TABLE readiness_checkins (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  checked_on date NOT NULL,
  energy     text NOT NULL CHECK (energy IN ('low', 'normal', 'high')),
  soreness   text NOT NULL CHECK (soreness IN ('none', 'some', 'high')),
  sleep      text NOT NULL CHECK (sleep IN ('poor', 'ok', 'good')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, checked_on)
);
CREATE TRIGGER readiness_checkins_updated_at BEFORE UPDATE ON readiness_checkins FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE workout_sessions
  ADD COLUMN readiness jsonb,
  ADD COLUMN readiness_adjusted boolean NOT NULL DEFAULT false;
