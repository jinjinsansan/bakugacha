-- Track LINE official account friend-add bonus
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS line_friend_bonus_at TIMESTAMPTZ;
