-- 010: 競馬ガチャ デジタルカード
CREATE TABLE keiba_cards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES app_users(id),
  gacha_result_id UUID REFERENCES gacha_results(id),
  chara_id        TEXT NOT NULL,
  serial_number   TEXT NOT NULL UNIQUE,     -- 'KG24-JP001-0042'
  serial_seq      INTEGER NOT NULL,
  card_number     TEXT NOT NULL,            -- 'JP001'..'JP007'
  issued_at       TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chara_seq_unique UNIQUE (chara_id, serial_seq)
);

CREATE INDEX idx_keiba_cards_user ON keiba_cards(user_id);
ALTER TABLE keiba_cards DISABLE ROW LEVEL SECURITY;

-- 既存keiba_settingsに発行上限カラム追加
ALTER TABLE keiba_settings
  ADD COLUMN IF NOT EXISTS card_max_issuance JSONB DEFAULT '{}'::JSONB;
