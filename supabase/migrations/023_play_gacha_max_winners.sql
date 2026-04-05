-- ================================================================
-- 023: play_gacha RPC に「当選上限 (max_winners) チェック」を追加
--
-- 仕様:
--   商品の gacha_products.max_winners が設定されていて、
--   かつ当該商品の gacha_results の result='win' 件数 >= max_winners の場合、
--   呼び出し側から p_result='win' が渡されても、強制的に 'loss' に上書きして処理する。
--
-- 実装ポイント:
--   - 在庫ロック (SELECT ... FOR UPDATE) を取得した直後に当選数を集計して判定
--     → 同一トランザクション内で原子的に判定できるため、
--       1000人同時アクセスでも max_winners を超えない
--   - 当選上限到達時は:
--       * 在庫は通常通り減算 (ガチャ自体は回せる)
--       * コインは通常通り消費 (演出は回る)
--       * p_result を 'loss' に書き換え
--       * prize_claims は作成しない
--       * カード発行 (p_card_info) も行わない
-- ================================================================

CREATE OR REPLACE FUNCTION play_gacha(
  p_user_id             UUID,
  p_product_id          TEXT,
  p_price               INT,
  p_is_admin            BOOLEAN,
  p_result              TEXT,
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
  v_max_winners    INT;
  v_current_wins   INT;
  v_effective_result TEXT;
  v_effective_card_info JSONB;
  v_effective_create_claim BOOLEAN;
BEGIN
  v_effective_result := p_result;
  v_effective_card_info := p_card_info;
  v_effective_create_claim := p_create_prize_claim;

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

  -- ── 2. 在庫を原子的にデクリメント + 当選上限取得 ──────────
  IF p_product_id IS NOT NULL THEN
    UPDATE gacha_products
    SET stock_remaining = CASE WHEN stock_remaining IS NULL THEN NULL ELSE stock_remaining - 1 END,
        status = CASE
          WHEN stock_remaining IS NOT NULL AND stock_remaining - 1 <= 0 THEN 'sold-out'
          ELSE status
        END
    WHERE id = p_product_id
      AND (stock_remaining IS NULL OR stock_remaining > 0)
    RETURNING max_winners INTO v_max_winners;

    GET DIAGNOSTICS v_stock_exists = ROW_COUNT;

    IF v_stock_exists = 0 THEN
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

    -- ── 2b. 当選上限チェック ───────────────────────────────
    -- max_winners が設定されていて、かつ呼び出し側が 'win' を渡している場合のみチェック
    IF v_max_winners IS NOT NULL AND v_effective_result = 'win' THEN
      SELECT COUNT(*) INTO v_current_wins
      FROM gacha_results
      WHERE product_id = p_product_id AND result = 'win';

      IF v_current_wins >= v_max_winners THEN
        -- 当選上限到達 → 強制ハズレ
        v_effective_result := 'loss';
        v_effective_card_info := NULL;
        v_effective_create_claim := FALSE;
      END IF;
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
    VALUES (p_user_id, p_product_id, v_effective_result, p_prize_name, p_price)
    RETURNING id INTO v_result_id;
  END IF;

  -- ── 5. カード発行 (card_info 指定時 + 実際の結果が win) ──
  IF v_effective_card_info IS NOT NULL AND v_result_id IS NOT NULL THEN
    v_card_type := v_effective_card_info->>'type';

    IF v_card_type = 'keiba' THEN
      v_chara_id    := v_effective_card_info->>'chara_id';
      v_card_number := v_effective_card_info->>'card_number';
      v_max_issuance := COALESCE((v_effective_card_info->>'max_issuance')::INT, 0);

      PERFORM pg_advisory_xact_lock(hashtext('keiba_card:' || v_chara_id));

      IF v_max_issuance > 0 THEN
        SELECT COUNT(*) INTO v_current_count
        FROM keiba_cards
        WHERE chara_id = v_chara_id;

        IF v_current_count >= v_max_issuance THEN
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

    ELSIF v_card_type = 'raise' THEN
      v_character_id  := v_effective_card_info->>'character_id';
      v_card_id_text  := v_effective_card_info->>'card_id';
      v_card_number   := v_effective_card_info->>'card_number';
      v_rarity        := v_effective_card_info->>'rarity';
      v_star_level    := (v_effective_card_info->>'star_level')::INT;
      v_max_issuance  := COALESCE((v_effective_card_info->>'max_issuance')::INT, 0);

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
  IF v_effective_create_claim AND v_effective_result = 'win' AND v_result_id IS NOT NULL THEN
    INSERT INTO prize_claims(user_id, gacha_result_id, product_id, prize_name, status)
    VALUES (p_user_id, v_result_id, p_product_id, p_prize_name, 'pending');
  END IF;

  RETURN QUERY SELECT TRUE, NULL::TEXT,
                       v_result_id, v_coins, v_serial, v_new_card_id, v_next_seq;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION play_gacha(UUID, TEXT, INT, BOOLEAN, TEXT, TEXT, JSONB, BOOLEAN) TO service_role;

COMMENT ON FUNCTION play_gacha IS
  '原子的ガチャ実行: コイン減算・在庫減算・結果記録・カード発行・当選上限チェックを1トランザクションで処理。';
