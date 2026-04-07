-- ガチャ受付時間帯の設定カラム追加
-- available_from: 受付開始日時 (NULL = 制限なし)
-- available_until: 受付終了日時 (NULL = 制限なし)
ALTER TABLE gacha_products
  ADD COLUMN IF NOT EXISTS available_from  TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS available_until TIMESTAMPTZ DEFAULT NULL;
