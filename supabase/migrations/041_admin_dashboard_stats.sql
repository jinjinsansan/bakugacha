-- ================================================================
-- 041: 管理ダッシュボード用の集計 RPC
--
--   全期間の累計 + 直近24時間/7日/30日(ローリング)の指標を
--   1回のクエリ(jsonb)で返す。ダッシュボードの高速化のため。
--
--   返却 jsonb:
--   {
--     total_users, total_plays, total_wins, total_coins, pending_claims,
--     windows: {
--       d1:  { plays, wins, new_users, coins_granted, coins_spent },
--       d7:  { ... },
--       d30: { ... }
--     }
--   }
--   coins_granted = 期間内の coin_transactions の amount>0 合計
--   coins_spent   = 期間内の coin_transactions の amount<0 合計の絶対値
-- ================================================================

CREATE OR REPLACE FUNCTION admin_dashboard_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT jsonb_build_object(
    'total_users',    (SELECT count(*) FROM app_users),
    'total_plays',    (SELECT count(*) FROM gacha_results),
    'total_wins',     (SELECT count(*) FROM gacha_results WHERE result = 'win'),
    'total_coins',    (SELECT COALESCE(sum(coins), 0) FROM app_users),
    'pending_claims', (SELECT count(*) FROM prize_claims WHERE status = 'pending'),
    'windows', (
      SELECT jsonb_object_agg(p.key, (
        SELECT jsonb_build_object(
          'plays',         (SELECT count(*) FROM gacha_results WHERE played_at >= now() - p.span),
          'wins',          (SELECT count(*) FROM gacha_results WHERE result = 'win' AND played_at >= now() - p.span),
          'new_users',     (SELECT count(*) FROM app_users WHERE created_at >= now() - p.span),
          'coins_granted', (SELECT COALESCE(sum(amount), 0) FROM coin_transactions WHERE amount > 0 AND created_at >= now() - p.span),
          'coins_spent',   (SELECT COALESCE(-sum(amount), 0) FROM coin_transactions WHERE amount < 0 AND created_at >= now() - p.span)
        )
      ))
      FROM (VALUES
        ('d1',  interval '1 day'),
        ('d7',  interval '7 days'),
        ('d30', interval '30 days')
      ) AS p(key, span)
    )
  );
$$;

GRANT EXECUTE ON FUNCTION admin_dashboard_stats() TO service_role;
