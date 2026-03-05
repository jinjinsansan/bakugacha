-- ── 競馬ガチャ設定 v2: コース別当たり率 + キャラ×コース補正 ──────
-- win_rate(グローバル)を廃止し、コース別当たり率を核心ロジックに変更

-- 不要カラムを削除
ALTER TABLE keiba_settings DROP COLUMN IF EXISTS win_rate;

-- course_rates → course_appearance_rates にリネーム（出現率用）
ALTER TABLE keiba_settings RENAME COLUMN course_rates TO course_appearance_rates;

-- コース別当たり率を追加（大雨ほど激アツ）
ALTER TABLE keiba_settings
  ADD COLUMN IF NOT EXISTS course_win_rates JSONB
    DEFAULT '{"01":60,"02":45,"03":35,"04":25,"05":15,"06":70,"07":75}'::JSONB;

-- キャラ×コース補正テーブルを追加
ALTER TABLE keiba_settings
  ADD COLUMN IF NOT EXISTS chara_course_bonuses JSONB
    DEFAULT '{"aoikaze":{"01":20,"07":-10},"darkbolt":{"02":20,"04":20,"01":-10},"shirogane":{"01":10,"03":10},"fuwarin":{"*":-20},"bakugachahime":{"06":10,"07":10}}'::JSONB;

-- course_appearance_rates のデフォルト値を更新
UPDATE keiba_settings SET
  course_appearance_rates = '{"01":30,"02":20,"03":15,"04":15,"05":10,"06":5,"07":5}'::JSONB
WHERE id = '00000000-0000-0000-0000-000000000008'
  AND (course_appearance_rates IS NULL OR course_appearance_rates = '{}'::JSONB);
