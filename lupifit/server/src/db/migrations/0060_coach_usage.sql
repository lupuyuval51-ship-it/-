-- Coach daily quota ledger. One row per user message sent to the coach. Kept separate
-- from coach_messages so deleting a conversation does not give the quota back.
CREATE TABLE coach_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX coach_usage_user_idx ON coach_usage (user_id, created_at);

INSERT INTO coach_usage (user_id, created_at)
SELECT user_id, created_at FROM coach_messages WHERE role = 'user' AND created_at >= now() - interval '2 days';
