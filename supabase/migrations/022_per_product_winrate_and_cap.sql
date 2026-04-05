-- ================================================================
-- 022: 商品別の当選率オーバーライドと当選上限
--
-- 目的:
--   - 特定商品だけ別の当選率で回したい (例: 高額景品は 1%)
--   - 特定商品の当選数に上限を設ける (例: Switch 100台で打ち切り)
--
-- 追加カラム:
--   win_rate_override  NUMERIC(5,2)  NULL 可
--     NULL      -> ガチャタイプ共通設定 (cd2/ecard/elevator/keiba/raise_*) を使用
--     値あり    -> その商品だけ当選率 (0-100) を上書き
--
--   max_winners        INT           NULL 可
--     NULL      -> 当選上限なし (従来通り)
--     値あり    -> 合計当選数が max_winners に達したら以降は強制ハズレ
-- ================================================================

ALTER TABLE gacha_products
  ADD COLUMN IF NOT EXISTS win_rate_override NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS max_winners INT;

ALTER TABLE gacha_products
  DROP CONSTRAINT IF EXISTS win_rate_override_range;
ALTER TABLE gacha_products
  ADD CONSTRAINT win_rate_override_range
    CHECK (win_rate_override IS NULL OR (win_rate_override >= 0 AND win_rate_override <= 100));

ALTER TABLE gacha_products
  DROP CONSTRAINT IF EXISTS max_winners_non_negative;
ALTER TABLE gacha_products
  ADD CONSTRAINT max_winners_non_negative
    CHECK (max_winners IS NULL OR max_winners >= 0);

COMMENT ON COLUMN gacha_products.win_rate_override IS
  '商品別の当選率(%). NULL ならガチャタイプ共通設定を使用。';
COMMENT ON COLUMN gacha_products.max_winners IS
  '商品別の当選上限(台数). NULL なら無制限。到達後はplay_gachaが強制ハズレを返す。';
