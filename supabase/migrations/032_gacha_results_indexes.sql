-- gacha_results テーブルのパフォーマンス改善用インデックス
-- winner-feed, ranking, WinnerFeed コンポーネントのクエリを高速化

-- 当選者フィード用（当選のみ・新着順）
CREATE INDEX IF NOT EXISTS idx_gacha_results_win_recent
  ON gacha_results(played_at DESC)
  WHERE result = 'win';

-- ランキング集計用（商品別・結果別）
CREATE INDEX IF NOT EXISTS idx_gacha_results_product_result
  ON gacha_results(product_id, result);

-- ユーザー別プレイ履歴用
CREATE INDEX IF NOT EXISTS idx_gacha_results_user_recent
  ON gacha_results(user_id, played_at DESC);

-- ランキング集計用 RPC（JS側フルスキャンを廃止）
CREATE OR REPLACE FUNCTION get_ranking(p_limit INT DEFAULT 10)
RETURNS TABLE(product_id TEXT, play_count BIGINT, win_count BIGINT)
LANGUAGE sql STABLE
AS $func$
  SELECT
    product_id,
    COUNT(*) AS play_count,
    SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) AS win_count
  FROM gacha_results
  GROUP BY product_id
  ORDER BY play_count DESC
  LIMIT p_limit;
$func$;

GRANT EXECUTE ON FUNCTION get_ranking(INT) TO service_role;
