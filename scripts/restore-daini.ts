/**
 * 誤って削除した「第一抽選会場 (switch)」「第二会場 (daini)」を復旧プロジェクトから本番DBに戻すスクリプト
 *
 * 実行:
 *   npx tsx --env-file=.env.local scripts/restore-daini.ts
 *
 * 必要な環境変数 (.env.local に追加):
 *   SUPABASE_URL                          (本番)
 *   SUPABASE_SERVICE_ROLE_KEY             (本番)
 *   RECOVERY_SUPABASE_URL                 (復旧用 bakugacha-recovery)
 *   RECOVERY_SUPABASE_SERVICE_ROLE_KEY    (復旧用 bakugacha-recovery)
 *
 * 動作:
 *   1. 復旧プロジェクトから switch/daini 関連データを取得
 *   2. 本番DBに upsert(ON CONFLICT DO NOTHING) で戻す
 *   3. FK 依存順:
 *      gacha_products (switch, daini)
 *      → gacha_results (switchの1458件 + dainiの612件)
 *      → prize_claims (switchの500件 + dainiの22件)
 *      → gacha_access_codes (source=switch, target=daini の865件)
 *   4. upsert は既存データをスキップ(ignoreDuplicates)するので冪等
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const PRODUCT_IDS = ['switch', 'daini'];

const PROD_URL = process.env.SUPABASE_URL;
const PROD_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const REC_URL  = process.env.RECOVERY_SUPABASE_URL;
const REC_KEY  = process.env.RECOVERY_SUPABASE_SERVICE_ROLE_KEY;

if (!PROD_URL || !PROD_KEY || !REC_URL || !REC_KEY) {
  console.error('必須環境変数が不足しています:');
  console.error('  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (本番)');
  console.error('  RECOVERY_SUPABASE_URL, RECOVERY_SUPABASE_SERVICE_ROLE_KEY (復旧)');
  process.exit(1);
}

const recovery = createClient(REC_URL, REC_KEY,  { auth: { persistSession: false } });
const prod     = createClient(PROD_URL, PROD_KEY, { auth: { persistSession: false } });

type Row = Record<string, unknown>;

async function fetchAll(client: SupabaseClient, table: string, col: string, values: string[]): Promise<Row[]> {
  const PAGE = 1000;
  const out: Row[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await client
      .from(table)
      .select('*')
      .in(col, values)
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`[fetch ${table}] ${error.message}`);
    if (!data || data.length === 0) break;
    out.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return out;
}

async function upsertBatch(
  client: SupabaseClient,
  table: string,
  rows: Row[],
  conflictKey: string,
): Promise<{ inserted: number; skipped: number }> {
  if (rows.length === 0) return { inserted: 0, skipped: 0 };
  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const { error, count } = await client
      .from(table)
      .upsert(chunk, { onConflict: conflictKey, ignoreDuplicates: true, count: 'exact' });
    if (error) throw new Error(`[upsert ${table}] ${error.message}`);
    inserted += count ?? 0;
    process.stdout.write(`.`);
  }
  process.stdout.write('\n');
  return { inserted, skipped: rows.length - inserted };
}

async function main() {
  console.log('=== switch + daini 復旧スクリプト ===\n');
  console.log('復旧プロジェクト:', REC_URL);
  console.log('本番プロジェクト:', PROD_URL);
  console.log('復旧対象 product_ids:', PRODUCT_IDS);
  console.log('');

  // ① 復旧プロジェクトから取得
  console.log('[1/5] 復旧プロジェクトからデータ取得...');
  const products = await fetchAll(recovery, 'gacha_products',      'id',                PRODUCT_IDS);
  const results  = await fetchAll(recovery, 'gacha_results',       'product_id',        PRODUCT_IDS);
  const claims   = await fetchAll(recovery, 'prize_claims',        'product_id',        PRODUCT_IDS);
  // access_codes は target_product_id が PRODUCT_IDS に含まれる (= daini向け)
  const codes    = await fetchAll(recovery, 'gacha_access_codes',  'target_product_id', PRODUCT_IDS);

  console.log(`  gacha_products:      ${products.length}`);
  console.log(`  gacha_results:       ${results.length}`);
  console.log(`  prize_claims:        ${claims.length}`);
  console.log(`  gacha_access_codes:  ${codes.length}`);
  console.log('');

  if (products.length === 0) {
    console.error('エラー: 復旧プロジェクトに対象商品が見つかりません。');
    process.exit(1);
  }

  // ② 本番DBに戻す (FK 依存順)
  console.log('[2/5] gacha_products を復元...');
  const r1 = await upsertBatch(prod, 'gacha_products',     products, 'id');
  console.log(`  → ${r1.inserted} 件挿入, ${r1.skipped} 件スキップ(既存)\n`);

  console.log('[3/5] gacha_results を復元...');
  const r2 = await upsertBatch(prod, 'gacha_results',      results, 'id');
  console.log(`  → ${r2.inserted} 件挿入, ${r2.skipped} 件スキップ(既存)\n`);

  console.log('[4/5] prize_claims を復元...');
  const r3 = await upsertBatch(prod, 'prize_claims',       claims, 'id');
  console.log(`  → ${r3.inserted} 件挿入, ${r3.skipped} 件スキップ(既存)\n`);

  console.log('[5/5] gacha_access_codes を復元...');
  const r4 = await upsertBatch(prod, 'gacha_access_codes', codes, 'id');
  console.log(`  → ${r4.inserted} 件挿入, ${r4.skipped} 件スキップ(既存)\n`);

  console.log('=== 完了 ===');
  console.log(`合計挿入: ${r1.inserted + r2.inserted + r3.inserted + r4.inserted} 件`);

  // ③ 検証
  console.log('\n[検証] 本番DBの件数確認...');
  const verify = async (table: string, col: string) => {
    const { count } = await prod.from(table).select('id', { count: 'exact', head: true }).in(col, PRODUCT_IDS);
    return count ?? 0;
  };
  const vProducts = await verify('gacha_products', 'id');
  const vResults  = await verify('gacha_results', 'product_id');
  const vClaims   = await verify('prize_claims', 'product_id');
  const vCodes    = await prod.from('gacha_access_codes').select('id', { count: 'exact', head: true }).in('target_product_id', PRODUCT_IDS);

  console.log(`  gacha_products:      ${vProducts} (復旧元: ${products.length})`);
  console.log(`  gacha_results:       ${vResults} (復旧元: ${results.length})`);
  console.log(`  prize_claims:        ${vClaims} (復旧元: ${claims.length})`);
  console.log(`  gacha_access_codes:  ${vCodes.count} (復旧元: ${codes.length})`);

  const ok = vProducts === products.length
          && vResults  === results.length
          && vClaims   === claims.length
          && vCodes.count === codes.length;
  if (ok) {
    console.log('\n✅ 全件一致。復旧成功です。');
  } else {
    console.log('\n⚠️  件数が不一致です。ログを確認してください。');
    process.exit(2);
  }
}

main().catch((err) => {
  console.error('\nエラー:', err);
  process.exit(1);
});
