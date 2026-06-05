-- ================================================================
-- 043: 結果一覧(分析)用の集計 RPC
--
--   指定期間(p_since 以降。NULL なら全期間)の
--   総プレイ・総当選・総コイン消費 + 商品別内訳(上位50) を
--   1回のクエリ(jsonb)で返す。
--
--   返却 jsonb:
--   {
--     total_plays, total_wins, total_coins_spent,
--     by_product: [ { product_id, title, plays, wins, coins_spent }, ... ]
--   }
-- ================================================================

CREATE OR REPLACE FUNCTION admin_results_summary(p_since TIMESTAMPTZ DEFAULT NULL)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT jsonb_build_object(
    'total_plays',       (SELECT count(*) FROM gacha_results WHERE p_since IS NULL OR played_at >= p_since),
    'total_wins',        (SELECT count(*) FROM gacha_results WHERE result = 'win' AND (p_since IS NULL OR played_at >= p_since)),
    'total_coins_spent', (SELECT COALESCE(sum(coins_spent), 0) FROM gacha_results WHERE p_since IS NULL OR played_at >= p_since),
    'by_product', (
      SELECT COALESCE(jsonb_agg(r.row), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object(
          'product_id',  gr.product_id,
          'title',       COALESCE(gp.title, gr.product_id),
          'plays',       count(*),
          'wins',        count(*) FILTER (WHERE gr.result = 'win'),
          'coins_spent', COALESCE(sum(gr.coins_spent), 0)
        ) AS row
        FROM gacha_results gr
        LEFT JOIN gacha_products gp ON gp.id = gr.product_id
        WHERE p_since IS NULL OR gr.played_at >= p_since
        GROUP BY gr.product_id, gp.title
        ORDER BY count(*) DESC
        LIMIT 50
      ) r
    )
  );
$$;

GRANT EXECUTE ON FUNCTION admin_results_summary(TIMESTAMPTZ) TO service_role;
