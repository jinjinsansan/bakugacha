-- keiba_cards にステータス・買取コード列を追加
ALTER TABLE keiba_cards ADD COLUMN status TEXT NOT NULL DEFAULT 'held';
ALTER TABLE keiba_cards ADD COLUMN buyback_code TEXT;
ALTER TABLE keiba_cards ADD COLUMN buyback_requested_at TIMESTAMPTZ;
ALTER TABLE keiba_cards ADD COLUMN transferred_at TIMESTAMPTZ;
ALTER TABLE keiba_cards ADD COLUMN converted_at TIMESTAMPTZ;

-- raise_cards にも同様
ALTER TABLE raise_cards ADD COLUMN status TEXT NOT NULL DEFAULT 'held';
ALTER TABLE raise_cards ADD COLUMN buyback_code TEXT;
ALTER TABLE raise_cards ADD COLUMN buyback_requested_at TIMESTAMPTZ;
ALTER TABLE raise_cards ADD COLUMN transferred_at TIMESTAMPTZ;
ALTER TABLE raise_cards ADD COLUMN converted_at TIMESTAMPTZ;

-- カード別ポイント交換レート設定テーブル
CREATE TABLE card_exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gacha_type TEXT NOT NULL,          -- keiba, raise_kenta, raise_shoichi
  card_id TEXT NOT NULL,             -- charaId(keiba) or cardId(raise)
  exchange_coins INT NOT NULL DEFAULT 0,
  UNIQUE(gacha_type, card_id)
);
