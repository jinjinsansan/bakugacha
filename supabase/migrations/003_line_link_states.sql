-- LINE連携状態テーブル
-- Supabase SQL Editor で実行してください

CREATE TABLE IF NOT EXISTS line_link_states (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  state         TEXT NOT NULL UNIQUE,
  nonce         TEXT NOT NULL,
  line_user_id  TEXT,
  rewarded_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_line_link_states_user
  ON line_link_states(user_id);

CREATE INDEX IF NOT EXISTS idx_line_link_states_rewarded
  ON line_link_states(rewarded_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_line_link_states_line_user_unique
  ON line_link_states(line_user_id)
  WHERE line_user_id IS NOT NULL;

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION set_line_link_states_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS line_link_states_set_updated_at ON line_link_states;

CREATE TRIGGER line_link_states_set_updated_at
BEFORE UPDATE ON line_link_states
FOR EACH ROW EXECUTE FUNCTION set_line_link_states_updated_at();
