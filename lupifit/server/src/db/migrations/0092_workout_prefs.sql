-- Workout settings that follow the account across devices (screen wake lock, vibration, rest sound,
-- automatic next exercise). NULL = never set on any device; the app then keeps its local choices.
ALTER TABLE users ADD COLUMN workout_prefs jsonb;
