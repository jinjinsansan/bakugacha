ALTER TABLE app_settings
  ADD COLUMN IF NOT EXISTS daily_login_bonus_amount INT NOT NULL DEFAULT 0;

ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS last_login_bonus_at TIMESTAMPTZ;

ALTER TABLE app_settings
  DROP CONSTRAINT IF EXISTS daily_login_bonus_amount_non_negative;

ALTER TABLE app_settings
  ADD CONSTRAINT daily_login_bonus_amount_non_negative
    CHECK (daily_login_bonus_amount >= 0);
