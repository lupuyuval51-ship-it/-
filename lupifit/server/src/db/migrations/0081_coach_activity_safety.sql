-- Conversation order follows the last message, not any edit: renaming a thread used to bump updated_at
-- (via the generic trigger) and move it to the top of the list.
ALTER TABLE coach_threads ADD COLUMN last_activity_at timestamptz;
UPDATE coach_threads t
   SET last_activity_at = COALESCE((SELECT max(m.created_at) FROM coach_messages m WHERE m.thread_id = t.id), t.created_at);
ALTER TABLE coach_threads ALTER COLUMN last_activity_at SET NOT NULL;
ALTER TABLE coach_threads ALTER COLUMN last_activity_at SET DEFAULT now();
CREATE INDEX coach_threads_user_activity_idx ON coach_threads (user_id, last_activity_at DESC);

-- Replies produced by the safety pre-check (self-harm, medical red flags, eating-disorder signals, PED dosing)
-- are marked so the UI can present them as safety guidance rather than as a normal coaching answer.
ALTER TABLE coach_messages ADD COLUMN safety_category text
  CHECK (safety_category IN ('self_harm', 'medical_red_flag', 'eating_disorder', 'ped_dosing'));
