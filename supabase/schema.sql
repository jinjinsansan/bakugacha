-- ================================================================
-- 爆ガチャ データベーススキーマ
-- Supabase SQL Editor で実行してください
-- ================================================================

-- ── ユーザーテーブル ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS app_users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email            TEXT UNIQUE NOT NULL,
  password_hash    TEXT NOT NULL,
  display_name     TEXT,
  coins            INTEGER NOT NULL DEFAULT 0,
  referral_code    TEXT UNIQUE,
  referred_by      UUID REFERENCES app_users(id),
  email_verified   BOOLEAN DEFAULT FALSE,
  last_login_at    TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── セッションテーブル ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  token        TEXT PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  expires_at   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── ガチャ商品テーブル ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gacha_products (
  id                   TEXT PRIMARY KEY,
  title                TEXT NOT NULL,
  category             TEXT NOT NULL,
  price                INTEGER NOT NULL DEFAULT 0,
  image_url            TEXT,
  thumbnail_gradient   TEXT,
  thumbnail_emoji      TEXT,
  thumbnail_label      TEXT,
  status               TEXT NOT NULL DEFAULT 'active',
  is_featured          BOOLEAN DEFAULT FALSE,
  stock_total          INTEGER,
  stock_remaining      INTEGER,
  sort_order           INTEGER DEFAULT 0,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT status_check CHECK (status IN ('active', 'sold-out'))
);

-- ── ガチャ結果テーブル ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gacha_results (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES app_users(id),
  product_id   TEXT NOT NULL REFERENCES gacha_products(id),
  result       TEXT NOT NULL,
  prize_name   TEXT,
  coins_spent  INTEGER NOT NULL,
  played_at    TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT result_check CHECK (result IN ('win', 'loss'))
);

-- ── コイントランザクションテーブル ───────────────────────────
CREATE TABLE IF NOT EXISTS coin_transactions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES app_users(id),
  type           TEXT NOT NULL,
  amount         INTEGER NOT NULL,
  balance_after  INTEGER NOT NULL,
  description    TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT type_check CHECK (type IN ('purchase', 'gacha', 'bonus', 'refund'))
);

-- ── CD2ガチャ設定テーブル ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS cd2_gacha_settings (
  id            UUID PRIMARY KEY,
  is_enabled    BOOLEAN DEFAULT TRUE,
  loss_rate     NUMERIC DEFAULT 60,
  donden_rate   NUMERIC DEFAULT 10,
  patlite_rate  NUMERIC DEFAULT 5,
  freeze_rate   NUMERIC DEFAULT 2,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- CD2初期設定
INSERT INTO cd2_gacha_settings (id, is_enabled, loss_rate, donden_rate, patlite_rate, freeze_rate)
VALUES ('00000000-0000-0000-0000-000000000005', TRUE, 60, 10, 5, 2)
ON CONFLICT (id) DO NOTHING;

-- ── お知らせテーブル ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT NOT NULL,
  body           TEXT,
  published_at   TIMESTAMPTZ DEFAULT NOW(),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── インデックス ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_gacha_results_user_id ON gacha_results(user_id);
CREATE INDEX IF NOT EXISTS idx_gacha_results_played_at ON gacha_results(played_at DESC);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_gacha_products_status ON gacha_products(status);
CREATE INDEX IF NOT EXISTS idx_gacha_products_is_featured ON gacha_products(is_featured);

-- ── RLS（Row Level Security）無効化 ──────────────────────────
-- service_role key で直接アクセスするため RLS は使用しない
ALTER TABLE app_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE gacha_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE gacha_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE cd2_gacha_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;
