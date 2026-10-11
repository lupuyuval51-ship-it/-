-- A saved meal item can keep the user's manual nutrient correction (made on the logged entry it was
-- saved from). NULL = compute from the food's values. Shape: { kcal, proteinG, carbsG, fatG, fiberG }
-- for the item's stored grams.
ALTER TABLE saved_meal_items ADD COLUMN correction jsonb;
