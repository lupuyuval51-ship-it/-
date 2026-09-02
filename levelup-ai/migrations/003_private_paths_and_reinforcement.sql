-- PostgreSQL reference tables for private structured-AI paths and reinforcement.
-- Apply after 001 and 002. The active application still uses SQLite.
BEGIN;
SET search_path = levelup, pg_catalog;

ALTER TABLE learning_paths
  ADD COLUMN is_private boolean NOT NULL DEFAULT false,
  ADD COLUMN generation_source text NOT NULL DEFAULT 'catalog'
    CHECK (generation_source IN ('catalog','ai','demo-curated','demo-study')),
  ADD COLUMN generation_metadata jsonb NOT NULL DEFAULT '{}',
  ADD CONSTRAINT path_id_creator_unique UNIQUE(id,creator_id);

CREATE TABLE private_path_owners (
  path_id text PRIMARY KEY REFERENCES learning_paths(id),
  user_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY(path_id,user_id) REFERENCES learning_paths(id,creator_id)
);
CREATE INDEX private_paths_owner_idx ON private_path_owners(user_id,created_at DESC);

CREATE TABLE reinforcement_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  enrollment_id uuid NOT NULL REFERENCES path_enrollments(id),
  source_task_id text NOT NULL REFERENCES tasks(id),
  text text NOT NULL CHECK (length(text) BETWEEN 10 AND 20000),
  xp integer NOT NULL CHECK (xp BETWEEN 0 AND 20),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id,enrollment_id,source_task_id),
  FOREIGN KEY(enrollment_id,user_id) REFERENCES path_enrollments(id,user_id)
);
CREATE INDEX reinforcement_owner_idx ON reinforcement_submissions(user_id,created_at DESC);

ALTER TABLE private_path_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_path_owners FORCE ROW LEVEL SECURITY;
ALTER TABLE reinforcement_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reinforcement_submissions FORCE ROW LEVEL SECURITY;
CREATE POLICY private_path_owner_read ON private_path_owners FOR SELECT TO levelup_reader
  USING(user_id=levelup.current_user_id());
CREATE POLICY reinforcement_owner_read ON reinforcement_submissions FOR SELECT TO levelup_reader
  USING(user_id=levelup.current_user_id());
GRANT SELECT ON private_path_owners,reinforcement_submissions TO levelup_reader;
GRANT SELECT,INSERT,UPDATE,DELETE ON private_path_owners,reinforcement_submissions TO levelup_service;
CREATE TRIGGER private_path_updated_at BEFORE UPDATE ON private_path_owners
  FOR EACH ROW EXECUTE FUNCTION levelup.touch_updated_at();
CREATE TRIGGER reinforcement_updated_at BEFORE UPDATE ON reinforcement_submissions
  FOR EACH ROW EXECUTE FUNCTION levelup.touch_updated_at();

-- A future adapter inserts the private learning_path, content, owner and enrollment
-- together. Marking a path approved must never make a private path public.
DROP POLICY published_or_owned ON learning_paths;
CREATE POLICY published_or_owned ON learning_paths FOR SELECT TO levelup_reader USING (
  deleted_at IS NULL AND (
    (NOT is_private AND status='approved')
    OR creator_id=levelup.current_user_id()
    OR EXISTS(SELECT 1 FROM levelup.private_path_owners owner
      WHERE owner.path_id=learning_paths.id AND owner.user_id=levelup.current_user_id())
  )
);

CREATE FUNCTION require_private_parent() RETURNS trigger LANGUAGE plpgsql
SET search_path=levelup,pg_catalog AS $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM levelup.learning_paths
    WHERE id=NEW.path_id AND creator_id=NEW.user_id AND is_private) THEN
    RAISE EXCEPTION 'Private path must have its owner and privacy set before ownership insertion';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER validate_private_parent BEFORE INSERT OR UPDATE ON private_path_owners
  FOR EACH ROW EXECUTE FUNCTION require_private_parent();
REVOKE ALL ON FUNCTION require_private_parent() FROM PUBLIC;

-- Remove private paths from public listing at the data layer too. Publication
-- requires a separate moderated path; private student content is never a listing.
CREATE FUNCTION reject_private_listing() RETURNS trigger LANGUAGE plpgsql
SET search_path=levelup,pg_catalog AS $$
BEGIN
  IF EXISTS(SELECT 1 FROM levelup.learning_paths WHERE id=NEW.path_id AND is_private) THEN
    RAISE EXCEPTION 'Private learning paths cannot be inserted into Marketplace';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER private_marketplace_guard BEFORE INSERT OR UPDATE ON marketplace_paths
  FOR EACH ROW EXECUTE FUNCTION reject_private_listing();
REVOKE ALL ON FUNCTION reject_private_listing() FROM PUBLIC;
COMMIT;
