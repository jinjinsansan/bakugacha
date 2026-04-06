-- coin_transactions.type の CHECK 制約に 'promo_code' と 'daily_login' を追加
-- migration 026 (daily_login_bonus) と 027 (promo_codes) で追加されたが制約が未更新だったため修正

ALTER TABLE coin_transactions
  DROP CONSTRAINT IF EXISTS type_check;

ALTER TABLE coin_transactions
  ADD CONSTRAINT type_check
    CHECK (type IN ('purchase', 'gacha', 'bonus', 'refund', 'promo_code', 'daily_login'));
