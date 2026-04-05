CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  coin_amount INT NOT NULL CHECK (coin_amount >= 0),
  max_uses INT CHECK (max_uses IS NULL OR max_uses >= 0),
  used_count INT NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_is_active ON promo_codes(is_active);

CREATE TABLE IF NOT EXISTS promo_code_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  coin_amount INT NOT NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, promo_code_id)
);

CREATE INDEX IF NOT EXISTS idx_promo_redemptions_user ON promo_code_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_promo_redemptions_code ON promo_code_redemptions(promo_code_id);

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
  SELECT id, coin_amount, max_uses, used_count, expires_at, is_active
    INTO v_promo_id, v_coin_amount, v_max_uses, v_used_count, v_expires_at, v_is_active
  FROM promo_codes
  WHERE code = p_code
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

  SELECT coins INTO v_current_coins
  FROM app_users
  WHERE id = p_user_id
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
