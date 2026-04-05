import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * PostgreSQL ベースの Rate Limiter
 *
 * migration 020 の check_rate_limit RPC を呼び出す。
 * Redis 等の外部サービス不要。
 */

export interface RateLimitResult {
  allowed: boolean;
  currentCount: number;
  remaining: number;
  resetAt: string;
}

export interface RateLimitConfig {
  /** バケットキー (IPやユーザーIDなど) */
  key: string;
  /** ウィンドウ内の最大リクエスト数 */
  maxRequests: number;
  /** ウィンドウの秒数 */
  windowSeconds: number;
}

/**
 * Rate Limit チェック。許可=true、拒否=false を返す。
 *
 * エラー時は fail-open (許可) する。Rate Limit 障害でサービス停止を防ぐため。
 */
export async function checkRateLimit(
  client: SupabaseClient,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const { data, error } = await client.rpc('check_rate_limit', {
    p_key:            config.key,
    p_max_requests:   config.maxRequests,
    p_window_seconds: config.windowSeconds,
  });

  if (error) {
    console.error('[ratelimit] RPC failed (fail-open):', error);
    return {
      allowed: true,
      currentCount: 0,
      remaining: config.maxRequests,
      resetAt: new Date().toISOString(),
    };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return {
      allowed: true,
      currentCount: 0,
      remaining: config.maxRequests,
      resetAt: new Date().toISOString(),
    };
  }

  return {
    allowed:       row.allowed as boolean,
    currentCount:  row.current_count as number,
    remaining:     row.remaining as number,
    resetAt:       row.reset_at as string,
  };
}

/**
 * リクエストから IP アドレスを取得
 */
export function getClientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'unknown';
}

/**
 * ガチャ play 用 (10秒に10回まで)
 */
export async function checkGachaRateLimit(
  client: SupabaseClient,
  identifier: string,
): Promise<RateLimitResult> {
  return checkRateLimit(client, {
    key: `gacha:${identifier}`,
    maxRequests: 10,
    windowSeconds: 10,
  });
}
