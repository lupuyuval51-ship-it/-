-- DB-backed brute-force protection: survives restarts and works across instances.
-- Keyed by (scope, identifier) where identifier is a salted SHA-256 of the normalised email or of the client IP.
CREATE TABLE auth_attempts (
  scope TEXT NOT NULL,
  identifier TEXT NOT NULL,
  fail_count INTEGER NOT NULL DEFAULT 0,
  first_failed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (scope, identifier)
);
