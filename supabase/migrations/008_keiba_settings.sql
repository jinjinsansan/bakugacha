-- ── 競馬ガチャ設定テーブル ────────────────────────────────────
CREATE TABLE IF NOT EXISTS keiba_settings (
  id                       UUID PRIMARY KEY,
  is_active                BOOLEAN DEFAULT TRUE,
  win_rate                 NUMERIC DEFAULT 30,
  umaoyaji_win_rate        NUMERIC DEFAULT 95,
  bakugachahime_win_rate   NUMERIC DEFAULT 90,
  fuwarin_win_rate         NUMERIC DEFAULT 20,
  chara_rates              JSONB DEFAULT '{}'::JSONB,
  course_rates             JSONB DEFAULT '{}'::JSONB,
  chain_lose_threshold     INTEGER DEFAULT 5,
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

-- 初期設定
INSERT INTO keiba_settings (
  id, is_active, win_rate, umaoyaji_win_rate, bakugachahime_win_rate,
  fuwarin_win_rate, chara_rates, course_rates, chain_lose_threshold
)
VALUES (
  '00000000-0000-0000-0000-000000000008', TRUE, 30, 95, 90,
  20, '{}'::JSONB, '{}'::JSONB, 5
)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE keiba_settings DISABLE ROW LEVEL SECURITY;
