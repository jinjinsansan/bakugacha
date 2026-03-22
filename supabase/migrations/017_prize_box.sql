-- gacha_products に交換コイン数を追加
ALTER TABLE gacha_products ADD COLUMN exchange_coins INT NOT NULL DEFAULT 0;

-- 当選品の受取選択・配送管理テーブル
CREATE TABLE prize_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id),
  gacha_result_id UUID NOT NULL REFERENCES gacha_results(id),
  product_id TEXT NOT NULL REFERENCES gacha_products(id),
  prize_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  recipient_name TEXT,
  postal_code TEXT,
  address TEXT,
  phone TEXT,
  tracking_number TEXT,
  notes TEXT,
  requested_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prize_claims_user ON prize_claims(user_id);
CREATE INDEX idx_prize_claims_status ON prize_claims(status);
