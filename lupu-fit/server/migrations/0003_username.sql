-- Login uses a username chosen by the user instead of an e-mail address.
-- password_reset_tokens is intentionally kept but is now UNUSED (there is no recovery channel without e-mail).
ALTER TABLE users RENAME COLUMN email TO username;
DROP INDEX users_email_lower_idx;
-- Device Mode accounts were generated as device-<hex>@lupu-fit.local; keep them valid as device_<hex>.
UPDATE users SET username = 'device_' || substr(split_part(username, '@', 1), 8) WHERE username LIKE 'device-%@lupu-fit.local';
CREATE UNIQUE INDEX users_username_lower_idx ON users (lower(username));
-- Old counters were keyed by hashed e-mail addresses and are meaningless now.
DELETE FROM auth_attempts;
