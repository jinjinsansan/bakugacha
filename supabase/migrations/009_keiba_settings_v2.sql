-- ── 競馬ガチャ設定テーブル 追加カラム ─────────────────────────
ALTER TABLE keiba_settings
  ADD COLUMN IF NOT EXISTS star_honest_rate INTEGER DEFAULT 60;
