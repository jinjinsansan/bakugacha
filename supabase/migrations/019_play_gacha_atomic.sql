-- ================================================================
-- 019: ガチャ実行の原子化 (1000人同時アクセス対応)
--
-- 目的:
--   - コイン減算・在庫減算・結果記録・カード発行・当選品登録を
--     1つのトランザクションで原子的に実行する
--   - SELECT ... FOR UPDATE による行ロックで競合を排除
--   - advisory lock でカードシリアル採番を直列化
--
-- 呼び出し:
--   SELECT * FROM play_gacha(
--     p_user_id, p_product_id, p_price, p_is_admin,
--     p_result, p_prize_name,
--     p_card_info,           -- NULL (cd2/ecard/elevator) or JSONB (keiba/raise)
--     p_create_prize_claim   -- true (cd2/ecard) false (keiba/raise/elevator)
--   );
-- ================================================================

-- ── CHECK 制約 (DB 最終防衛ライン) ───────────────────────────
ALTER TABLE app_users DROP CONSTRAINT IF EXISTS coins_non_negative;
ALTER TABLE app_users ADD CONSTRAINT coins_non_negative CHECK (coins >= 0);

ALTER TABLE gacha_products DROP CONSTRAINT IF EXISTS stock_non_negative;
ALTER TABLE gacha_products ADD CONSTRAINT stock_non_negative
  CHECK (stock_remaining IS NULL OR stock_remaining >= 0);

-- ── play_gacha 統合 RPC ─────────────────────────────────────
CREATE OR REPLACE FUNCTION play_gacha(
  p_user_id             UUID,
  p_product_id          TEXT,
  p_price               INT,
  p_is_admin            BOOLEAN,
  p_result              TEXT,        -- 'win' or 'loss'
  p_prize_name          TEXT,
  p_card_info           JSONB DEFAULT NULL,
  p_create_prize_claim  BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(
  success       BOOLEAN,
  error_code    TEXT,
  gacha_result_id UUID,
  new_coins     INT,
  card_serial   TEXT,
  card_row_id   UUID,
  card_seq      INT
) AS $$
DECLARE
  v_coins          INT;
  v_result_id      UUID;
  v_new_card_id    UUID;
  v_next_seq       INT;
  v_serial         TEXT;
  v_card_type      TEXT;
  v_chara_id       TEXT;
  v_card_number    TEXT;
  v_character_id   TEXT;
  v_card_id_text   TEXT;
  v_rarity         TEXT;
  v_star_level     INT;
  v_max_issuance   INT;
  v_current_count  INT;
  v_serial_prefix  TEXT;
  v_stock_exists   BIGINT;
BEGIN
  -- ── 1. ユーザー行をロック取得 + コインチェック ───────────
  IF p_user_id IS NOT NULL THEN
    IF NOT p_is_admin AND p_price > 0 THEN
      SELECT coins INTO v_coins
      FROM app_users
      WHERE id = p_user_id
      FOR UPDATE;

      IF v_coins IS NULL THEN
        RETURN QUERY SELECT FALSE, 'USER_NOT_FOUND'::TEXT,
                             NULL::UUID, 0, NULL::TEXT, NULL::UUID, NULL::INT;
        RETURN;
      END IF;

      IF v_coins < p_price THEN
        RETURN QUERY SELECT FALSE, 'INSUFFICIENT_COINS'::TEXT,
                             NULL::UUID, v_coins, NULL::TEXT, NULL::UUID, NULL::INT;
        RETURN;
      END IF;
    ELSE
      SELECT coins INTO v_coins FROM app_users WHERE id = p_user_id;
      v_coins := COALESCE(v_coins, 0);
    END IF;
  ELSE
    v_coins := 0;
  END IF;

  -- ── 2. 在庫を原子的にデクリメント ─────────────────────────
  IF p_product_id IS NOT NULL THEN
    UPDATE gacha_products
    SET stock_remaining = CASE WHEN stock_remaining IS NULL THEN NULL ELSE stock_remaining - 1 END,
        status = CASE
          WHEN stock_remaining IS NOT NULL AND stock_remaining - 1 <= 0 THEN 'sold-out'
          ELSE status
        END
    WHERE id = p_product_id
      AND (stock_remaining IS NULL OR stock_remaining > 0);

    GET DIAGNOSTICS v_stock_exists = ROW_COUNT;

    IF v_stock_exists = 0 THEN
      -- 商品が存在しないか、在庫切れ
      PERFORM 1 FROM gacha_products WHERE id = p_product_id;
      IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'PRODUCT_NOT_FOUND'::TEXT,
                             NULL::UUID, v_coins, NULL::TEXT, NULL::UUID, NULL::INT;
      ELSE
        RETURN QUERY SELECT FALSE, 'OUT_OF_STOCK'::TEXT,
                             NULL::UUID, v_coins, NULL::TEXT, NULL::UUID, NULL::INT;
      END IF;
      RETURN;
    END IF;
  END IF;

  -- ── 3. コイン減算 + トランザクション記録 ─────────────────
  IF p_user_id IS NOT NULL AND NOT p_is_admin AND p_price > 0 THEN
    UPDATE app_users
      SET coins = coins - p_price,
          updated_at = NOW()
      WHERE id = p_user_id;

    v_coins := v_coins - p_price;

    INSERT INTO coin_transactions(user_id, type, amount, balance_after, description)
    VALUES (p_user_id, 'gacha', -p_price, v_coins, 'ガチャ: ' || p_prize_name);
  END IF;

  -- ── 4. gacha_results 挿入 ─────────────────────────────────
  IF p_user_id IS NOT NULL AND p_product_id IS NOT NULL THEN
    INSERT INTO gacha_results(user_id, product_id, result, prize_name, coins_spent)
    VALUES (p_user_id, p_product_id, p_result, p_prize_name, p_price)
    RETURNING id INTO v_result_id;
  END IF;

  -- ── 5. カード発行 (card_info 指定時) ──────────────────────
  IF p_card_info IS NOT NULL AND v_result_id IS NOT NULL THEN
    v_card_type := p_card_info->>'type';

    -- 5a. 競馬ガチャカード ────────────────────────────────
    IF v_card_type = 'keiba' THEN
      v_chara_id    := p_card_info->>'chara_id';
      v_card_number := p_card_info->>'card_number';
      v_max_issuance := COALESCE((p_card_info->>'max_issuance')::INT, 0);

      -- 同じchara_idに対する同時採番を直列化
      PERFORM pg_advisory_xact_lock(hashtext('keiba_card:' || v_chara_id));

      IF v_max_issuance > 0 THEN
        SELECT COUNT(*) INTO v_current_count
        FROM keiba_cards
        WHERE chara_id = v_chara_id;

        IF v_current_count >= v_max_issuance THEN
          -- 発行上限到達 → ガチャ結果は残すがカードはNULL
          RETURN QUERY SELECT TRUE, 'CARD_MAX_REACHED'::TEXT,
                               v_result_id, v_coins, NULL::TEXT, NULL::UUID, NULL::INT;
          RETURN;
        END IF;
      END IF;

      SELECT COALESCE(MAX(serial_seq), 0) + 1 INTO v_next_seq
      FROM keiba_cards
      WHERE chara_id = v_chara_id;

      v_serial := 'KG24-' || v_card_number || '-' || LPAD(v_next_seq::TEXT, 4, '0');

      INSERT INTO keiba_cards(user_id, gacha_result_id, chara_id, serial_number, serial_seq, card_number)
      VALUES (p_user_id, v_result_id, v_chara_id, v_serial, v_next_seq, v_card_number)
      RETURNING id INTO v_new_card_id;

    -- 5b. 来世ガチャカード ────────────────────────────────
    ELSIF v_card_type = 'raise' THEN
      v_character_id  := p_card_info->>'character_id';
      v_card_id_text  := p_card_info->>'card_id';
      v_card_number   := p_card_info->>'card_number';
      v_rarity        := p_card_info->>'rarity';
      v_star_level    := (p_card_info->>'star_level')::INT;
      v_max_issuance  := COALESCE((p_card_info->>'max_issuance')::INT, 0);

      PERFORM pg_advisory_xact_lock(
        hashtext('raise_card:' || v_character_id || ':' || v_card_id_text)
      );

      IF v_max_issuance > 0 THEN
        SELECT COUNT(*) INTO v_current_count
        FROM raise_cards
        WHERE character_id = v_character_id AND card_id = v_card_id_text;

        IF v_current_count >= v_max_issuance THEN
          RETURN QUERY SELECT TRUE, 'CARD_MAX_REACHED'::TEXT,
                               v_result_id, v_coins, NULL::TEXT, NULL::UUID, NULL::INT;
          RETURN;
        END IF;
      END IF;

      SELECT COALESCE(MAX(serial_seq), 0) + 1 INTO v_next_seq
      FROM raise_cards
      WHERE character_id = v_character_id AND card_id = v_card_id_text;

      v_serial_prefix := CASE v_character_id
                           WHEN 'kenta'   THEN 'RK'
                           WHEN 'shoichi' THEN 'RS'
                           ELSE 'RR'
                         END;

      v_serial := v_serial_prefix || '26-' || v_card_number || '-' || LPAD(v_next_seq::TEXT, 4, '0');

      INSERT INTO raise_cards(
        user_id, gacha_result_id, character_id, card_id,
        serial_number, serial_seq, card_number, rarity, star_level
      )
      VALUES (
        p_user_id, v_result_id, v_character_id, v_card_id_text,
        v_serial, v_next_seq, v_card_number, v_rarity, v_star_level
      )
      RETURNING id INTO v_new_card_id;
    END IF;
  END IF;

  -- ── 6. prize_claims 登録 (cd2/ecardの当選時のみ) ──────────
  IF p_create_prize_claim AND p_result = 'win' AND v_result_id IS NOT NULL THEN
    INSERT INTO prize_claims(user_id, gacha_result_id, product_id, prize_name, status)
    VALUES (p_user_id, v_result_id, p_product_id, p_prize_name, 'pending');
  END IF;

  RETURN QUERY SELECT TRUE, NULL::TEXT,
                       v_result_id, v_coins, v_serial, v_new_card_id, v_next_seq;
END;
$$ LANGUAGE plpgsql;

-- ── 実行権限 (service_role から呼び出せるように) ─────────────
GRANT EXECUTE ON FUNCTION play_gacha(UUID, TEXT, INT, BOOLEAN, TEXT, TEXT, JSONB, BOOLEAN) TO service_role;

-- ── コメント ────────────────────────────────────────────────
COMMENT ON FUNCTION play_gacha IS
  '原子的ガチャ実行: コイン減算・在庫減算・結果記録・カード発行を1トランザクションで処理。1000人同時アクセスに対応。';
