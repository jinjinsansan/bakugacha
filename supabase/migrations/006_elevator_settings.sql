-- ── エレベーターガチャ設定テーブル ────────────────────────────────
CREATE TABLE IF NOT EXISTS elevator_settings (
  id                    UUID PRIMARY KEY,
  is_active             BOOLEAN DEFAULT TRUE,
  win_rate              NUMERIC DEFAULT 40,
  donten_rate           NUMERIC DEFAULT 15,
  min_floors            INTEGER DEFAULT 3,
  max_floors            INTEGER DEFAULT 6,
  boss_floor_rate       NUMERIC DEFAULT 20,
  countdown_floor_rate  NUMERIC DEFAULT 15,
  multidoor_floor_rate  NUMERIC DEFAULT 10,
  chaos_floor_rate      NUMERIC DEFAULT 10,
  reverse_floor_rate    NUMERIC DEFAULT 10,
  star5_rate            NUMERIC DEFAULT 70,
  star4_rate            NUMERIC DEFAULT 60,
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 初期設定
INSERT INTO elevator_settings (
  id, is_active, win_rate, donten_rate, min_floors, max_floors,
  boss_floor_rate, countdown_floor_rate, multidoor_floor_rate,
  chaos_floor_rate, reverse_floor_rate, star5_rate, star4_rate
)
VALUES (
  '00000000-0000-0000-0000-000000000007', TRUE, 40, 15, 3, 6,
  20, 15, 10, 10, 10, 70, 60
)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE elevator_settings DISABLE ROW LEVEL SECURITY;
