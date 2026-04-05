# 1000人同時ガチャ負荷テスト ガイド

## 事前準備

### 1. k6 インストール
- Windows: `choco install k6` または https://k6.io/docs/get-started/installation/ から .msi
- macOS: `brew install k6`

### 2. Upstash Redis セットアップ (Rate Limit用)
1. https://console.upstash.com にアクセス
2. Create Database → Region: Tokyo → Free プラン
3. "REST API" タブから以下をコピー:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
4. Vercel ダッシュボード → Settings → Environment Variables に追加
5. 再デプロイ

### 3. Supabase マイグレーション適用
```bash
# Supabase ダッシュボード → SQL Editor で実行
# supabase/migrations/019_play_gacha_atomic.sql の内容をコピペして実行
```

確認:
```sql
SELECT routine_name FROM information_schema.routines WHERE routine_name = 'play_gacha';
-- play_gacha が出れば OK
```

### 4. Supabase Pro プラン + PgBouncer 設定
- Supabase ダッシュボード → Settings → Database
- Connection Pooling: **Transaction mode** を有効化
- Pool Size: **25-50** (ガチャ用の並列度に合わせる)

### 5. テスト用データ準備

#### a. テスト用ユーザーを複数作成 (例: 10-20 人)
通常の新規登録フローから作成し、各ユーザーのセッショントークンを取得:
```bash
# ブラウザDevToolsのApplication → Cookies → bakugatcha_session の値をコピー
```

#### b. テスト用商品を作成
管理画面 (`/admin/products/new`) から:
- ID: `load-test-product`
- 価格: 10 (コイン)
- 在庫: **100000** (オーバーセル検証のため大きめ)
- ガチャタイプ: `cd2`

#### c. 各テストユーザーに十分なコインを付与
```sql
UPDATE app_users SET coins = 1000000 WHERE email LIKE 'loadtest%';
```

---

## 負荷テスト実行

### 基本実行 (1000 VU まで ramp-up)
```bash
k6 run \
  -e BASE_URL=https://your-site.vercel.app \
  -e PRODUCT_ID=load-test-product \
  -e GACHA_TYPE=cd2-gacha \
  -e SESSION_TOKENS=token1,token2,token3,token4,token5 \
  scripts/load-test-gacha.js
```

### 各ガチャ種別をテスト
```bash
# cd2
k6 run -e GACHA_TYPE=cd2-gacha -e BASE_URL=... -e PRODUCT_ID=... scripts/load-test-gacha.js

# keiba (カード発行あり、最重要)
k6 run -e GACHA_TYPE=keiba-gacha -e BASE_URL=... -e PRODUCT_ID=... scripts/load-test-gacha.js

# raise
k6 run -e GACHA_TYPE=raise-gacha -e BASE_URL=... -e PRODUCT_ID=... scripts/load-test-gacha.js
```

---

## 合格基準

| 項目 | 合格基準 |
|------|---------|
| p95レスポンス | < 2000ms |
| p99レスポンス | < 5000ms |
| 5xxエラー率 | < 0.5% |
| ガチャ成功率 | > 80% (※ rate limit分を除く) |
| データ整合性 | 下記SQLチェック全パス |

### データ整合性チェック SQL (テスト後に実行)

```sql
-- 1. コインがマイナスになっていないか
SELECT COUNT(*) FROM app_users WHERE coins < 0;
-- → 0 であるべき

-- 2. 在庫がマイナスになっていないか
SELECT COUNT(*) FROM gacha_products WHERE stock_remaining < 0;
-- → 0 であるべき

-- 3. 商品のgacha_results件数 vs stock減少が一致
SELECT
  p.id,
  p.stock_total - COALESCE(p.stock_remaining, 0) AS stock_consumed,
  COUNT(r.id) AS play_count
FROM gacha_products p
LEFT JOIN gacha_results r ON r.product_id = p.id
WHERE p.id = 'load-test-product'
GROUP BY p.id;
-- → stock_consumed = play_count であるべき

-- 4. coin_transactions の合計 vs app_users.coins が一致
WITH totals AS (
  SELECT user_id, SUM(amount) AS net_coins
  FROM coin_transactions
  GROUP BY user_id
)
SELECT COUNT(*) FROM totals t
JOIN app_users u ON u.id = t.user_id
WHERE u.coins != t.net_coins + 300;  -- 300は新規登録ボーナス
-- → 0 が理想

-- 5. カードシリアルの重複がないか (keiba)
SELECT serial_number, COUNT(*)
FROM keiba_cards
GROUP BY serial_number
HAVING COUNT(*) > 1;
-- → 0行であるべき (UNIQUE制約で発生しないはず)

-- 6. カードシリアルの連番に飛びがないか
SELECT chara_id, COUNT(*), MAX(serial_seq), MIN(serial_seq)
FROM keiba_cards
GROUP BY chara_id;
-- → MAX - MIN + 1 = COUNT であれば完璧
```

---

## トラブルシューティング

### 問題: p95 > 2s
**原因**: Supabase接続数上限、PgBouncer設定、コールドスタート
**対策**:
- PgBouncerをTransactionモードに
- Pool Size を増やす (50-100)
- Vercel の region を Supabase と同じに

### 問題: 429 Too Many Requests が多い
**原因**: Rate Limit 設定が厳しい
**対策**: `src/middleware.ts` の `slidingWindow(10, '10 s')` を調整

### 問題: stock_remaining < 0
**原因**: RPC 関数が適用されていない or アプリ側ロジックが古い
**対策**:
- migration 019 が実行されたか確認
- 全ガチャ route.ts が `callPlayGacha` を使っているか確認

### 問題: 「ユーザー情報が取得できません」が多発
**原因**: セッション取得のレースコンディション or Supabase 接続不足
**対策**: Phase 2+ として Redis セッションキャッシュ導入を検討
