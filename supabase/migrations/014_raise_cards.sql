-- 来世ガチャ カード発行テーブル
CREATE TABLE IF NOT EXISTS raise_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id),
  gacha_result_id UUID REFERENCES gacha_results(id),
  character_id TEXT NOT NULL,
  card_id TEXT NOT NULL,
  serial_number TEXT NOT NULL UNIQUE,
  serial_seq INTEGER NOT NULL,
  card_number TEXT NOT NULL,
  rarity TEXT NOT NULL,
  star_level INTEGER NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT raise_card_seq_unique UNIQUE (character_id, card_id, serial_seq)
);

CREATE INDEX IF NOT EXISTS idx_raise_cards_user ON raise_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_raise_cards_character ON raise_cards(character_id);
