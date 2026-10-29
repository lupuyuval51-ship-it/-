-- Small, user-approved calorie adjustment from the weight-trend check (kcal relative to the computed target).
ALTER TABLE profiles
  ADD COLUMN calorie_adjustment smallint NOT NULL DEFAULT 0 CHECK (calorie_adjustment BETWEEN -150 AND 150),
  ADD COLUMN calorie_adjusted_on date,
  ADD COLUMN adjustment_dismissed_until date;
