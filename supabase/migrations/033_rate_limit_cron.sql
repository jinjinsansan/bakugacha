-- rate_limit_buckets の定期クリーンアップを pg_cron でスケジューリング
-- 期限切れバケットが蓄積してUPSERT速度が低下するのを防ぐ

SELECT cron.schedule(
  'cleanup-rate-limits',
  '0 * * * *',
  'SELECT cleanup_rate_limits()'
);
