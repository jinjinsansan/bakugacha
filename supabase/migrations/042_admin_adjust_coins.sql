-- ================================================================
-- 042: 管理者による手動コイン調整
--
--   1. coin_transactions.type に 'admin_adjust' を許可（返金・補填・回収の台帳種別）
--   2. admin_adjust_coins RPC: 符号付き金額を原子的に増減する
--      - p_amount > 0 で付与、< 0 で減算
--      - 残高が 0 未満になる減算は拒否（INSUFFICIENT_COINS）
--      - ユーザー不在は USER_NOT_FOUND
--      - coin_transactions に type='admin_adjust' で記録
-- ================================================================

ALTER TABLE coin_transactions
  DROP CONSTRAINT IF EXISTS type_check;

ALTER TABLE coin_transactions
  ADD CONSTRAINT type_check
    CHECK (type IN ('purchase', 'gacha', 'bonus', 'refund', 'promo_code', 'daily_login', 'kreward', 'admin_adjust'));

CREATE OR REPLACE FUNCTION admin_adjust_coins(
  p_user_id     UUID,
  p_amount      INT,
  p_description TEXT
)
RETURNS TABLE(new_balance INT)
LANGUAGE plpgsql
AS $func$
DECLARE
  v_new_balance INT;
BEGIN
  IF p_amount IS NULL OR p_amount = 0 THEN
    RAISE EXCEPTION 'INVALID_AMOUNT';
  END IF;
  IF abs(p_amount) > 1000000 THEN
    RAISE EXCEPTION 'AMOUNT_TOO_LARGE';
  END IF;

  -- 原子的に増減。減算で残高が負になる場合は WHERE 条件に外れ 0 件 → NULL。
  UPDATE app_users
    SET coins      = coins + p_amount,
        updated_at = NOW()
  WHERE id = p_user_id
    AND coins + p_amount >= 0
  RETURNING coins INTO v_new_balance;

  IF v_new_balance IS NULL THEN
    PERFORM 1 FROM app_users WHERE id = p_user_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'USER_NOT_FOUND';
    ELSE
      RAISE EXCEPTION 'INSUFFICIENT_COINS';
    END IF;
  END IF;

  INSERT INTO coin_transactions(user_id, type, amount, balance_after, description)
  VALUES (p_user_id, 'admin_adjust', p_amount, v_new_balance, p_description);

  RETURN QUERY SELECT v_new_balance;
END;
$func$;

GRANT EXECUTE ON FUNCTION admin_adjust_coins(UUID, INT, TEXT) TO service_role;
