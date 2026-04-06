-- redeem_promo_code の coin_amount 曖昧参照エラー (42702) を修正
-- RETURNS TABLE の coin_amount 列と promo_codes.coin_amount 列が衝突していたため
-- SELECT 文でテーブル名を明示的に修飾する

CREATE OR REPLACE FUNCTION redeem_promo_code(
  p_user_id UUID,
  p_code TEXT
)
RETURNS TABLE(
  success BOOLEAN,
  error_code TEXT,
  coin_amount INT,
  new_balance INT
) AS $$
DECLARE
  v_promo_id UUID;
  v_coin_amount INT;
  v_max_uses INT;
  v_used_count INT;
  v_expires_at TIMESTAMPTZ;
  v_is_active BOOLEAN;
  v_already_redeemed BIGINT;
  v_current_coins INT;
  v_new_balance INT;
BEGIN
  SELECT pc.id, pc.coin_amount, pc.max_uses, pc.used_count, pc.expires_at, pc.is_active
    INTO v_promo_id, v_coin_amount, v_max_uses, v_used_count, v_expires_at, v_is_active
  FROM promo_codes pc
  WHERE pc.code = p_code
  FOR UPDATE;

  IF v_promo_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'NOT_FOUND'::TEXT, 0, 0;
    RETURN;
  END IF;

  IF NOT v_is_active THEN
    RETURN QUERY SELECT FALSE, 'INACTIVE'::TEXT, 0, 0;
    RETURN;
  END IF;

  IF v_expires_at IS NOT NULL AND v_expires_at < NOW() THEN
    RETURN QUERY SELECT FALSE, 'EXPIRED'::TEXT, 0, 0;
    RETURN;
  END IF;

  IF v_max_uses IS NOT NULL AND v_used_count >= v_max_uses THEN
    RETURN QUERY SELECT FALSE, 'LIMIT_REACHED'::TEXT, 0, 0;
    RETURN;
  END IF;

  SELECT COUNT(*) INTO v_already_redeemed
  FROM promo_code_redemptions
  WHERE user_id = p_user_id AND promo_code_id = v_promo_id;

  IF v_already_redeemed > 0 THEN
    RETURN QUERY SELECT FALSE, 'ALREADY_REDEEMED'::TEXT, 0, 0;
    RETURN;
  END IF;

  SELECT au.coins INTO v_current_coins
  FROM app_users au
  WHERE au.id = p_user_id
  FOR UPDATE;

  IF v_current_coins IS NULL THEN
    RETURN QUERY SELECT FALSE, 'USER_NOT_FOUND'::TEXT, 0, 0;
    RETURN;
  END IF;

  v_new_balance := v_current_coins + v_coin_amount;

  UPDATE app_users
    SET coins = v_new_balance, updated_at = NOW()
    WHERE id = p_user_id;

  UPDATE promo_codes
    SET used_count = used_count + 1
    WHERE id = v_promo_id;

  INSERT INTO promo_code_redemptions(user_id, promo_code_id, coin_amount)
  VALUES (p_user_id, v_promo_id, v_coin_amount);

  INSERT INTO coin_transactions(user_id, type, amount, balance_after, description)
  VALUES (p_user_id, 'promo_code', v_coin_amount, v_new_balance, 'プロモコード: ' || p_code);

  RETURN QUERY SELECT TRUE, NULL::TEXT, v_coin_amount, v_new_balance;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION redeem_promo_code(UUID, TEXT) TO service_role;
