-- coin_transactions.type の CHECK 制約に 'kreward' を追加
-- netkeita Kリワード → 爆ガチャコイン転送機能のため

ALTER TABLE coin_transactions
  DROP CONSTRAINT IF EXISTS type_check;

ALTER TABLE coin_transactions
  ADD CONSTRAINT type_check
    CHECK (type IN ('purchase', 'gacha', 'bonus', 'refund', 'promo_code', 'daily_login', 'kreward'));
