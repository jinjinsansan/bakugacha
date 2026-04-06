ALTER TABLE gacha_products
  ADD COLUMN IF NOT EXISTS access_code_target_id TEXT REFERENCES gacha_products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS requires_access_code BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS gacha_access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  source_product_id TEXT NOT NULL REFERENCES gacha_products(id) ON DELETE CASCADE,
  target_product_id TEXT NOT NULL REFERENCES gacha_products(id) ON DELETE CASCADE,
  winner_user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  gacha_result_id UUID REFERENCES gacha_results(id) ON DELETE SET NULL,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  used_by_user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_access_codes_code ON gacha_access_codes(code);
CREATE INDEX IF NOT EXISTS idx_access_codes_winner ON gacha_access_codes(winner_user_id);
CREATE INDEX IF NOT EXISTS idx_access_codes_target ON gacha_access_codes(target_product_id);
CREATE INDEX IF NOT EXISTS idx_access_codes_unused ON gacha_access_codes(winner_user_id, is_used) WHERE NOT is_used;
