-- Ready workouts can end with a 10-minute block for one sport (soccer, swimming, ...). The exercises of that block
-- are ordinary session exercises, tagged with the sport id so the live workout can show them as their own section.
-- NULL = a normal exercise. The id is checked by the server against its sport list; the CHECK only keeps the shape sane.
ALTER TABLE session_exercises ADD COLUMN sport text;
ALTER TABLE session_exercises ADD CONSTRAINT session_exercises_sport_check CHECK (sport IS NULL OR sport ~ '^[a-z_]{2,30}$');
