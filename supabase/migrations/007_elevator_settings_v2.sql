-- ── エレベーターガチャ設定テーブル 追加カラム ─────────────────────
ALTER TABLE elevator_settings
  ADD COLUMN IF NOT EXISTS floor_range_min      INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS floor_range_max      INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS countdown_seconds    INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS chain_lose_threshold INTEGER DEFAULT 3;

-- win_rate デフォルト値を仕様書の 20% に修正
UPDATE elevator_settings
SET win_rate = 20
WHERE id = '00000000-0000-0000-0000-000000000007'
  AND win_rate = 40;
