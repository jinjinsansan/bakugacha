/**
 * 爆ガチャ DB セットアップスクリプト
 * 実行: npx tsx --env-file=.env.local scripts/setup-db.ts
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を設定してください。');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const SQL_STATEMENTS = [
  // app_users
  `CREATE TABLE IF NOT EXISTS app_users (
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
  )`,

  // sessions
  `CREATE TABLE IF NOT EXISTS sessions (
    token        TEXT PRIMARY KEY,
    user_id      UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    expires_at   TIMESTAMPTZ NOT NULL,
    created_at   TIMESTAMPTZ DEFAULT NOW()
  )`,

  // gacha_products
  `CREATE TABLE IF NOT EXISTS gacha_products (
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
    created_at           TIMESTAMPTZ DEFAULT NOW()
  )`,

  // gacha_results
  `CREATE TABLE IF NOT EXISTS gacha_results (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES app_users(id),
    product_id   TEXT NOT NULL REFERENCES gacha_products(id),
    result       TEXT NOT NULL,
    prize_name   TEXT,
    coins_spent  INTEGER NOT NULL,
    played_at    TIMESTAMPTZ DEFAULT NOW()
  )`,

  // coin_transactions
  `CREATE TABLE IF NOT EXISTS coin_transactions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES app_users(id),
    type           TEXT NOT NULL,
    amount         INTEGER NOT NULL,
    balance_after  INTEGER NOT NULL,
    description    TEXT,
    created_at     TIMESTAMPTZ DEFAULT NOW()
  )`,

  // cd2_gacha_settings
  `CREATE TABLE IF NOT EXISTS cd2_gacha_settings (
    id            UUID PRIMARY KEY,
    is_enabled    BOOLEAN DEFAULT TRUE,
    loss_rate     NUMERIC DEFAULT 60,
    donden_rate   NUMERIC DEFAULT 10,
    patlite_rate  NUMERIC DEFAULT 5,
    freeze_rate   NUMERIC DEFAULT 2,
    updated_at    TIMESTAMPTZ DEFAULT NOW()
  )`,

  // announcements
  `CREATE TABLE IF NOT EXISTS announcements (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title          TEXT NOT NULL,
    body           TEXT,
    published_at   TIMESTAMPTZ DEFAULT NOW(),
    created_at     TIMESTAMPTZ DEFAULT NOW()
  )`,

  // インデックス
  `CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)`,
  `CREATE INDEX IF NOT EXISTS idx_gacha_results_user_id ON gacha_results(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON coin_transactions(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_gacha_products_status ON gacha_products(status)`,

  // RLS無効化
  `ALTER TABLE app_users DISABLE ROW LEVEL SECURITY`,
  `ALTER TABLE sessions DISABLE ROW LEVEL SECURITY`,
  `ALTER TABLE gacha_products DISABLE ROW LEVEL SECURITY`,
  `ALTER TABLE gacha_results DISABLE ROW LEVEL SECURITY`,
  `ALTER TABLE coin_transactions DISABLE ROW LEVEL SECURITY`,
  `ALTER TABLE cd2_gacha_settings DISABLE ROW LEVEL SECURITY`,
  `ALTER TABLE announcements DISABLE ROW LEVEL SECURITY`,
];

async function setup() {
  console.log('🚀 爆ガチャ DB セットアップ開始...\n');

  for (const sql of SQL_STATEMENTS) {
    const label = sql.trim().split('\n')[0].substring(0, 60);
    const { error } = await supabase.rpc('exec_sql', { query: sql }).single().catch(() => ({
      error: new Error('rpc not available'),
    }));

    if (error) {
      // rpc が使えない場合は REST API 経由
      const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'POST',
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      console.log(`  ⚠ ${label}`);
    } else {
      console.log(`  ✓ ${label}`);
    }
  }

  // CD2 初期データ挿入
  const { error: cd2Error } = await supabase
    .from('cd2_gacha_settings')
    .upsert({
      id: '00000000-0000-0000-0000-000000000005',
      is_enabled: true,
      loss_rate: 60,
      donden_rate: 10,
      patlite_rate: 5,
      freeze_rate: 2,
    });

  if (cd2Error) {
    console.log(`  ⚠ CD2設定挿入: ${cd2Error.message}`);
  } else {
    console.log('  ✓ CD2ガチャ設定 初期データ挿入');
  }

  console.log('\n完了！');
}

setup().catch(console.error);
