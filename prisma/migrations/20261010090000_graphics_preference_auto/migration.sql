-- The graphics preference becomes optional: NULL means "automatic" = the best tier the current plan allows.
-- Previously every new account stored an explicit "B", which would have kept a freshly upgraded Plus/Pro
-- user on Tier B until they found the setting. Nobody could have chosen B explicitly before this UI existed,
-- so existing values are reset to automatic.
ALTER TABLE "UserProfile" ALTER COLUMN "graphicsPreference" DROP NOT NULL;
ALTER TABLE "UserProfile" ALTER COLUMN "graphicsPreference" DROP DEFAULT;
UPDATE "UserProfile" SET "graphicsPreference" = NULL;
