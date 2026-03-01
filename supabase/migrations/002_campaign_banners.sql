-- campaign_banners テーブル作成
-- Supabase SQL Editor で実行してください

CREATE TABLE IF NOT EXISTS campaign_banners (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  subtitle    TEXT,
  tag         TEXT,
  badge       TEXT,
  badge_color TEXT DEFAULT '#c9a84c',
  image_url   TEXT,
  overlay     TEXT DEFAULT 'linear-gradient(90deg, rgba(5,5,20,0.92) 0%, rgba(5,5,20,0.7) 50%, rgba(5,5,20,0.3) 100%)',
  link_url    TEXT,
  sort_order  INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_banners_active
  ON campaign_banners (is_active, sort_order);
