-- Nutrition lookups: a user's own foods by barcode, recent/frequent foods and day views.
CREATE INDEX IF NOT EXISTS foods_owner_barcode_idx ON foods (owner_user_id, barcode) WHERE owner_user_id IS NOT NULL AND barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS food_log_entries_user_created_idx ON food_log_entries (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS saved_meal_items_food_idx ON saved_meal_items (food_id);
