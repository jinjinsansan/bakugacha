-- ================================================================
-- 020: Rate Limit (Redis なしで PostgreSQL のみで実装)
--
-- Sliding window ではなく fixed window 方式。
-- 1000人同時でも捌けるよう UPSERT と PRIMARY KEY で高速化。
--
-- 使い方:
--   SELECT check_rate_limit('gacha:1.2.3.4', 10, 10);
--   -> true (OK) / false (制限超過)
-- ================================================================

CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  bucket_key  TEXT PRIMARY KEY,
  count       INT NOT NULL DEFAULT 0,
  expires_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_expires ON rate_limit_buckets(expires_at);

ALTER TABLE rate_limit_buckets DISABLE ROW LEVEL SECURITY;

-- ── check_rate_limit RPC ────────────────────────────────────
-- 指定キーのカウントを +1 し、上限を超えていないか判定する。
-- 期限切れの場合はカウントをリセットする。
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_key             TEXT,
  p_max_requests    INT,
  p_window_seconds  INT
)
RETURNS TABLE(
  allowed    BOOLEAN,
  current_count INT,
  remaining  INT,
  reset_at   TIMESTAMPTZ
) AS $$
DECLARE
  v_count     INT;
  v_expires   TIMESTAMPTZ;
BEGIN
  INSERT INTO rate_limit_buckets(bucket_key, count, expires_at)
  VALUES (p_key, 1, NOW() + (p_window_seconds || ' seconds')::INTERVAL)
  ON CONFLICT (bucket_key) DO UPDATE SET
    count = CASE
      WHEN rate_limit_buckets.expires_at < NOW() THEN 1
      ELSE rate_limit_buckets.count + 1
    END,
    expires_at = CASE
      WHEN rate_limit_buckets.expires_at < NOW() THEN NOW() + (p_window_seconds || ' seconds')::INTERVAL
      ELSE rate_limit_buckets.expires_at
    END
  RETURNING count, expires_at INTO v_count, v_expires;

  RETURN QUERY SELECT
    v_count <= p_max_requests,
    v_count,
    GREATEST(0, p_max_requests - v_count),
    v_expires;
END;
$$ LANGUAGE plpgsql;

-- ── cleanup_rate_limits: 期限切れバケットを削除 ──────────────
-- 定期実行推奨 (1時間に1回程度)。
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS INT AS $$
DECLARE
  v_deleted INT;
BEGIN
  DELETE FROM rate_limit_buckets WHERE expires_at < NOW() - INTERVAL '1 hour';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION check_rate_limit(TEXT, INT, INT) TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_rate_limits() TO service_role;

COMMENT ON FUNCTION check_rate_limit IS
  'Fixed window rate limiter. Returns allowed=true if request is within limit.';
