-- Settings the server creates for itself (one row). Not user data: never exported or shown to users.
-- vapid_*: the Web Push key pair made on the first start when VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY
-- are not set (modules/push/vapid.ts), so phone notifications work without generating keys by hand.
-- Replacing the pair invalidates every device that turned notifications on, so it is never rotated
-- automatically. The private key is a secret: never log it.
CREATE TABLE server_settings (
  id                boolean PRIMARY KEY DEFAULT true CHECK (id),
  vapid_public_key  text CHECK (vapid_public_key ~ '^[A-Za-z0-9_-]{87}$'),
  vapid_private_key text CHECK (vapid_private_key ~ '^[A-Za-z0-9_-]{43}$'),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CHECK ((vapid_public_key IS NULL) = (vapid_private_key IS NULL))
);
CREATE TRIGGER server_settings_updated_at BEFORE UPDATE ON server_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
