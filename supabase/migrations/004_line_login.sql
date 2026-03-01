-- LINE Login support
-- Add LINE profile columns to app_users
-- Make email / password_hash nullable for LINE-only users
-- Make line_link_states.user_id nullable for unauthenticated OAuth

ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS line_user_id      TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS line_display_name  TEXT,
  ADD COLUMN IF NOT EXISTS line_picture_url   TEXT;

ALTER TABLE app_users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE app_users ALTER COLUMN password_hash DROP NOT NULL;

ALTER TABLE line_link_states ALTER COLUMN user_id DROP NOT NULL;
