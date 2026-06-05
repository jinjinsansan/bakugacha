-- ================================================================
-- 040: コイン経済の堅牢化（防御的制約）
--
--   1. grant_coins に付与額のバリデーション（正数・上限）を追加
--      → 負数・小数・巨大値(オーバーフロー)による不正/事故を防ぐ
--   2. app_users.coins に「>= 0」CHECK 制約を追加
--      → どの経路でも残高が負にならないことを DB レベルで保証
--
--   ※ 既存データを壊さないよう CHECK は NOT VALID で追加（新規書込にのみ適用）。
-- ================================================================

-- 1. grant_coins に上限・正数チェックを追加（035 の定義を置き換え）
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
  -- 付与額の検証: 正の整数かつ上限以内のみ許可
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount > 1000000 THEN
    RAISE EXCEPTION 'INVALID_AMOUNT';
  END IF;

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

-- 2. 残高が負にならないことを保証する CHECK 制約
ALTER TABLE app_users
  DROP CONSTRAINT IF EXISTS coins_non_negative;

ALTER TABLE app_users
  ADD CONSTRAINT coins_non_negative CHECK (coins >= 0) NOT VALID;
