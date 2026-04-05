/**
 * k6 負荷テスト: 1000人同時ガチャアクセス
 *
 * インストール:
 *   Windows: choco install k6  (または https://k6.io/docs/get-started/installation/)
 *   macOS:   brew install k6
 *
 * 実行 (本番URL):
 *   k6 run -e BASE_URL=https://your-site.vercel.app -e PRODUCT_ID=test-product scripts/load-test-gacha.js
 *
 * 注意事項:
 *   - 事前に "テスト用商品" を作成しておくこと (stock_remaining を大きめに)
 *   - 事前に "テスト用ユーザー" を複数作成し、セッショントークンを用意すること
 *   - 本番DBに対してなので、test環境 or 専用商品IDで実施
 *
 * 合格基準:
 *   - p95レスポンス < 2000ms
 *   - エラー率 < 0.1%
 *   - 429 (Rate Limit) は意図的に発生するので成功扱い
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ── カスタムメトリクス ───────────────────────────────────────
const errorRate = new Rate('errors');
const rateLimitRate = new Rate('rate_limited');
const outOfStockRate = new Rate('out_of_stock');
const successRate = new Rate('gacha_success');
const gachaLatency = new Trend('gacha_latency');

// ── 環境変数 ─────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const PRODUCT_ID = __ENV.PRODUCT_ID || 'test-product';
const GACHA_TYPE = __ENV.GACHA_TYPE || 'cd2-gacha';
// カンマ区切りでセッショントークンを複数指定: ?SESSION_TOKENS=token1,token2,...
const SESSION_TOKENS = (__ENV.SESSION_TOKENS || '').split(',').filter(Boolean);

// ── ロードテストシナリオ ─────────────────────────────────────
export const options = {
  scenarios: {
    // Scenario 1: ramp up to 1000 VUs (バーストテスト)
    burst: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 100 },   // 0-30s: 0→100
        { duration: '30s', target: 500 },   // 30-60s: 100→500
        { duration: '1m',  target: 1000 },  // 60-120s: 500→1000
        { duration: '2m',  target: 1000 },  // 120-240s: 1000 持続
        { duration: '30s', target: 0 },     // 240-270s: 終了
      ],
      gracefulRampDown: '30s',
    },
  },

  thresholds: {
    // p95 が 2秒以内
    http_req_duration: ['p(95)<2000'],
    // 5xx 系エラーは 0.5% 以下
    errors: ['rate<0.005'],
    // ガチャ成功率 80% 以上 (rate limit や stock は除く)
    gacha_success: ['rate>0.80'],
  },

  // サマリー表示
  summaryTrendStats: ['min', 'avg', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

// ── テスト本体 ───────────────────────────────────────────────
export default function () {
  // 複数のユーザーを模擬するため、VU ID でセッショントークンを切り替え
  const token = SESSION_TOKENS.length > 0
    ? SESSION_TOKENS[__VU % SESSION_TOKENS.length]
    : null;

  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Cookie'] = `bakugatcha_session=${token}`;
  }

  const payload = JSON.stringify({
    productId: PRODUCT_ID,
    quality: 'low',
  });

  const startTime = Date.now();
  const res = http.post(`${BASE_URL}/api/${GACHA_TYPE}/play`, payload, {
    headers,
    tags: { name: 'gacha_play' },
  });
  const duration = Date.now() - startTime;
  gachaLatency.add(duration);

  // ── 結果判定 ───────────────────────────────────────────
  const isRateLimited = res.status === 429;
  const is5xx = res.status >= 500;
  const is4xx = res.status >= 400 && res.status < 500 && !isRateLimited;

  rateLimitRate.add(isRateLimited);
  errorRate.add(is5xx);

  let body = null;
  try {
    body = res.json();
  } catch (e) {
    // JSON parse エラー
  }

  const isOutOfStock = body && body.error && body.error.includes('売り切れ');
  const isSuccess = res.status === 200 && body && body.success === true;

  outOfStockRate.add(isOutOfStock);
  successRate.add(isSuccess);

  check(res, {
    'status is 200 or 429': (r) => r.status === 200 || r.status === 429,
    'response time < 3s':   (r) => r.timings.duration < 3000,
    'no 5xx errors':        (r) => r.status < 500,
  });

  // 0〜1秒のランダムな待機 (実ユーザーを模擬)
  sleep(Math.random());
}

// ── テスト終了時のサマリー ───────────────────────────────────
export function handleSummary(data) {
  const summary = {
    'テスト対象': `${BASE_URL}/api/${GACHA_TYPE}/play`,
    '商品ID': PRODUCT_ID,
    '総リクエスト': data.metrics.http_reqs.values.count,
    '成功率': `${(data.metrics.gacha_success.values.rate * 100).toFixed(2)}%`,
    'エラー率 (5xx)': `${(data.metrics.errors.values.rate * 100).toFixed(2)}%`,
    'Rate Limit率': `${(data.metrics.rate_limited.values.rate * 100).toFixed(2)}%`,
    '在庫切れ率': `${(data.metrics.out_of_stock.values.rate * 100).toFixed(2)}%`,
    'p50 レスポンス': `${data.metrics.http_req_duration.values.med.toFixed(0)}ms`,
    'p95 レスポンス': `${data.metrics.http_req_duration.values['p(95)'].toFixed(0)}ms`,
    'p99 レスポンス': `${data.metrics.http_req_duration.values['p(99)'].toFixed(0)}ms`,
    '最大レスポンス': `${data.metrics.http_req_duration.values.max.toFixed(0)}ms`,
  };

  const text = Object.entries(summary)
    .map(([k, v]) => `  ${k}: ${v}`)
    .join('\n');

  return {
    stdout: `\n========== ガチャ負荷テスト結果 ==========\n${text}\n==========================================\n`,
    'load-test-report.json': JSON.stringify(data, null, 2),
  };
}
