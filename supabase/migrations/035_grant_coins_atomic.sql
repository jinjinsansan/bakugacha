-- grantCoins をアトミックな RPC に置き換え
-- coins = coins + p_amount を1トランザクションで実行し競合状態を排除

CREATE OR REPLACE FUNCTION grant_coins(
  p_user_id    UUID,
  p_amount     INT,
  p_description TEXT,
  p_type       TEXT DEFAULT 'bonus'
)
RETURNS TABLE(new_balance INT)
LANGUAGE plpgsql
AS $func$
DECLARE
  v_new_balance INT;
BEGIN
  UPDATE app_users
    SET coins      = coins + p_amount,
        updated_at = NOW()
  WHERE id = p_user_id
  RETURNING coins INTO v_new_balance;

  IF v_new_balance IS NULL THEN
    RAISE EXCEPTION 'USER_NOT_FOUND';
  END IF;

  INSERT INTO coin_transactions(user_id, type, amount, balance_after, description)
  VALUES (p_user_id, p_type, p_amount, v_new_balance, p_description);

  RETURN QUERY SELECT v_new_balance;
END;
$func$;

GRANT EXECUTE ON FUNCTION grant_coins(UUID, INT, TEXT, TEXT) TO service_role;
