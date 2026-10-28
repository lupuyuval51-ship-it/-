-- Per-user usage log for metered AI features (meal-photo analysis). Used to enforce
-- daily quotas; holds no prompt, image or model output.
CREATE TABLE IF NOT EXISTS ai_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind ~ '^[a-z][a-z_]{1,39}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_usage_events_user_kind_idx ON ai_usage_events (user_id, kind, created_at DESC);
