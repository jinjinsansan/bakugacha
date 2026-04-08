-- 037: 景品マスタテーブル追加
CREATE TABLE prizes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('paypay','amazon_gift','delivery','digital','other')),
  value       INT,
  description TEXT,
  image_url   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE gacha_products ADD COLUMN prize_id UUID REFERENCES prizes(id) ON DELETE SET NULL;

GRANT ALL ON prizes TO service_role;
