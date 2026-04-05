-- ================================================================
-- 021: メンテナンスモード
--
-- app_settings にメンテナンスモードのフラグとメッセージを追加
-- ================================================================

ALTER TABLE app_settings
  ADD COLUMN IF NOT EXISTS maintenance_mode    BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE app_settings
  ADD COLUMN IF NOT EXISTS maintenance_message TEXT;

ALTER TABLE app_settings
  ADD COLUMN IF NOT EXISTS maintenance_title   TEXT;

-- 既存の 1行があれば、デフォルト値をセット
UPDATE app_settings
   SET maintenance_mode    = COALESCE(maintenance_mode, FALSE),
       maintenance_title   = COALESCE(maintenance_title, 'ただいまメンテナンス中です'),
       maintenance_message = COALESCE(
         maintenance_message,
         'より良いサービスをご提供するため、ただいまメンテナンスを実施しております。ご不便をおかけして申し訳ございません。'
       )
 WHERE id = '00000000-0000-0000-0000-000000000001';

-- 行がまだ存在しない場合は INSERT
INSERT INTO app_settings (id, maintenance_mode, maintenance_title, maintenance_message)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  FALSE,
  'ただいまメンテナンス中です',
  'より良いサービスをご提供するため、ただいまメンテナンスを実施しております。ご不便をおかけして申し訳ございません。'
)
ON CONFLICT (id) DO NOTHING;
