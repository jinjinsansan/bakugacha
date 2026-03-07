-- 来世ガチャ設定テーブル（健太編）
CREATE TABLE IF NOT EXISTS raise_kenta_settings (
  id UUID PRIMARY KEY,
  is_active BOOLEAN DEFAULT TRUE,
  loss_rate NUMERIC DEFAULT 60,
  star_distribution JSONB DEFAULT '[30,25,15,10,7,5,3,2,1.5,0.5,0.5,0.5]',
  donden_rate NUMERIC DEFAULT 20,
  card_max_issuance JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO raise_kenta_settings(id)
VALUES('00000000-0000-0000-0000-000000000010')
ON CONFLICT DO NOTHING;

-- 来世ガチャ設定テーブル（正一編）
CREATE TABLE IF NOT EXISTS raise_shoichi_settings (
  id UUID PRIMARY KEY,
  is_active BOOLEAN DEFAULT TRUE,
  loss_rate NUMERIC DEFAULT 60,
  star_distribution JSONB DEFAULT '[30,25,15,10,7,5,3,2,1.5,0.5,0.5,0.5]',
  donden_rate NUMERIC DEFAULT 20,
  card_max_issuance JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO raise_shoichi_settings(id)
VALUES('00000000-0000-0000-0000-000000000011')
ON CONFLICT DO NOTHING;
