-- Phone notifications (Web Push). One row per browser/device that allowed notifications.
-- The endpoint and keys are capabilities for that device: never logged in full or exported.
CREATE TABLE push_subscriptions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint        text NOT NULL UNIQUE CHECK (char_length(endpoint) BETWEEN 12 AND 1024),
  p256dh          text NOT NULL CHECK (char_length(p256dh) BETWEEN 80 AND 100),
  auth            text NOT NULL CHECK (char_length(auth) BETWEEN 16 AND 32),
  user_agent      text NOT NULL DEFAULT '' CHECK (char_length(user_agent) <= 300),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  last_success_at timestamptz,
  failure_count   integer NOT NULL DEFAULT 0 CHECK (failure_count >= 0)
);
CREATE INDEX push_subscriptions_user_idx ON push_subscriptions (user_id);
CREATE TRIGGER push_subscriptions_updated_at BEFORE UPDATE ON push_subscriptions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Reminder log: each reminder slot is decided once per user and local day (sent or skipped),
-- so a reminder is never sent twice, even with several server instances.
CREATE TABLE push_deliveries (
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind       text NOT NULL CHECK (kind IN ('workout', 'meal')),
  local_date date NOT NULL,
  slot       text NOT NULL CHECK (slot ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  status     text NOT NULL CHECK (status IN ('pending', 'sent', 'skipped', 'failed')),
  sent_count integer NOT NULL DEFAULT 0 CHECK (sent_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, kind, local_date, slot)
);
CREATE INDEX push_deliveries_created_idx ON push_deliveries (created_at);
