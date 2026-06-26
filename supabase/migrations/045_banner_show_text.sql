-- ================================================================
-- 045: バナーのテキスト表示 ON/OFF
--
-- 目的:
--   画像にテキストを焼き込んだバナーで、タイトル/サブタイトル/タグ/バッジの
--   オーバーレイ表示を抑止し「画像のみ」表示にできるようにする。
--
-- 追加カラム:
--   show_text  BOOLEAN NOT NULL DEFAULT true
--     true（既定） -> 従来どおりテキストを画像上に重ねて表示
--     false        -> テキスト・バッジを表示せず画像のみ
-- ================================================================

ALTER TABLE campaign_banners
  ADD COLUMN IF NOT EXISTS show_text BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN campaign_banners.show_text IS
  'バナー上にタイトル等のテキストを重ねて表示するか。false なら画像のみ。';
