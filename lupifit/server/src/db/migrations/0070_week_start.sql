-- Week start is fixed per account (set at registration from the language) so that switching
-- the interface language cannot move week boundaries and re-earn weekly XP.
ALTER TABLE users ADD COLUMN week_start smallint NOT NULL DEFAULT 1 CHECK (week_start IN (0, 1));
UPDATE users SET week_start = CASE WHEN locale = 'he' THEN 0 ELSE 1 END;
