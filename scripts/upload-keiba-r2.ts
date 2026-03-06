/**
 * Cloudflare R2 競馬ガチャ動画アップロードスクリプト
 * 実行: npx tsx scripts/upload-keiba-r2.ts
 * 強制上書き: npx tsx scripts/upload-keiba-r2.ts --force
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

// ── 設定 ──────────────────────────────────────────────────────
const BASE_DIR  = path.resolve(__dirname, '..', '競馬ガチャ映像');
const NARR_DIR  = path.join(BASE_DIR, 'ナレーション付き');
const ACCOUNT_ID = '954dcc10adf822b50ccceedef0aa97e6';
const ACCESS_KEY = 'eaa0aa3d33af2b2d635d73218e633514';
const SECRET_KEY = '4275dc9a87fb942bc5e28974b31abed5fcbc2b920512869b059ab0e882e6462e';
const BUCKET     = 'bakugacha';

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
});

// ── ファイル定義（[ソースパス, R2キー]） ─────────────────────
function narr(file: string): [string, string] {
  return [path.join(NARR_DIR, file), `keiba/${file}`];
}
function base(file: string): [string, string] {
  return [path.join(BASE_DIR, file), `keiba/${file}`];
}

const FILES: [string, string][] = [
  // ── 新タイトル映像（コース別ファンファーレ） ──
  narr('title_sunny_turf.mp4'),
  narr('title_sunny_dirt.mp4'),
  narr('title_soft_turf.mp4'),
  narr('title_soft_dirt.mp4'),
  narr('title_heavy_turf.mp4'),
  narr('title_rain_turf.mp4'),
  narr('title_rain_dirt.mp4'),

  // ── キャラ紹介（ナレーション付き） ──
  narr('A-01_chara_shirogane.mp4'),
  narr('A-02_chara_darkbolt.mp4'),
  narr('A-03_chara_aoikaze.mp4'),
  narr('A-04_chara_honohime.mp4'),
  narr('A-05_chara_fuwarin.mp4'),
  narr('A-06_chara_bakugachahime.mp4'),
  narr('A-07_chara_umaoyaji.mp4'),

  // ── ゲートスタート（ナレーション付き） ──
  narr('E-01_gate_start_sunny_turf.mp4'),
  narr('E-01b_gate_start_sunny_turf_umaoyaji.mp4'),
  narr('E-02_gate_start_sunny_dirt.mp4'),
  narr('E-03_gate_start_soft_turf.mp4'),
  narr('E-04_gate_start_soft_dirt.mp4'),
  narr('E-05_gate_start_heavy_turf.mp4'),
  narr('E-06_gate_start_rain_turf.mp4'),
  narr('E-07_gate_start_rain_dirt.mp4'),

  // ── 集団走行（ナレーション付き） ──
  narr('F-01_pack_side_sunny_turf.mp4'),
  narr('F-01b_pack_side_sunny_turf_umaoyaji.mp4'),
  narr('F-02_pack_side_sunny_dirt.mp4'),
  narr('F-03_pack_side_soft_turf.mp4'),
  narr('F-04_pack_side_soft_dirt.mp4'),
  narr('F-05_pack_side_heavy_turf.mp4'),
  narr('F-06_pack_side_rain_turf.mp4'),
  narr('F-07_pack_side_rain_dirt.mp4'),

  // ── 最終コーナー（ナレーション付き） ──
  narr('G-01_final_corner_sunny_turf.mp4'),
  narr('G-01b_final_corner_sunny_turf_umaoyaji.mp4'),
  narr('G-02_final_corner_sunny_dirt.mp4'),
  narr('G-03_final_corner_soft_turf.mp4'),
  narr('G-04_final_corner_soft_dirt.mp4'),
  narr('G-05_final_corner_heavy_turf.mp4'),
  narr('G-06_final_corner_rain_turf.mp4'),
  narr('G-07_final_corner_rain_dirt.mp4'),

  // ── ゴール直前（ナレーション付き） ──
  narr('H-01_goal_front_sunny_turf.mp4'),
  narr('H-01b_goal_front_sunny_turf_umaoyaji.mp4'),
  narr('H-02_goal_front_sunny_dirt.mp4'),
  narr('H-03_goal_front_soft_turf.mp4'),
  narr('H-04_goal_front_soft_dirt.mp4'),
  narr('H-05_goal_front_heavy_turf.mp4'),
  narr('H-06_goal_front_rain_turf.mp4'),
  narr('H-07_goal_front_rain_dirt.mp4'),

  // ── 当たり演出（ナレーション付き） ──
  narr('WIN-01_shirogane.mp4'),
  narr('WIN-02_darkbolt.mp4'),
  narr('WIN-03_aoikaze.mp4'),
  narr('WIN-04_honohime.mp4'),
  narr('WIN-05_fuwarin.mp4'),
  narr('WIN-06_bakugachahime.mp4'),
  narr('WIN-07_umaoyaji.mp4'),

  // ── ハズレ演出（ナレーション版なし・既存ファイルを使用） ──
  base('LOSE-01_shirogane.mp4'),
  base('LOSE-02_darkbolt.mp4'),
  base('LOSE-03_aoikaze.mp4'),
  base('LOSE-04_honohime.mp4'),
  base('LOSE-05_fuwarin.mp4'),
  base('LOSE-06_bakugachahime.mp4'),
  base('LOSE-07_umaoyaji.mp4'),

  // ── 旧演出（保存用） ──
  base('C-01_standby_loop.mp4'),
  base('D-01_win_jockey.mp4'),
  base('D-02_win_bakugachahime.mp4'),
  base('D-03_win_umaoyaji.mp4'),
  base('D-04_lose_grayout.mp4'),
  base('D-05a_title_normal.mp4'),
  base('D-05b_title_heatup.mp4'),
  base('D-05c_title_hot.mp4'),
  base('D-05d_title_ssr.mp4'),
];

// ── アップロード関数 ───────────────────────────────────────────
async function exists(key: string): Promise<boolean> {
  try {
    await client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

let uploadCount = 0, skipCount = 0, warnCount = 0;

async function upload(filePath: string, key: string, force: boolean) {
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠️  見つかりません: ${path.basename(filePath)}`);
    warnCount++;
    return;
  }
  if (!force && await exists(key)) {
    console.log(`  ⏭  スキップ: ${key}`);
    skipCount++;
    return;
  }
  const body = fs.readFileSync(filePath);
  await client.send(new PutObjectCommand({
    Bucket: BUCKET, Key: key, Body: body, ContentType: 'video/mp4',
  }));
  console.log(`  ✅ ${key}`);
  uploadCount++;
}

// ── メイン ────────────────────────────────────────────────────
async function main() {
  const force = process.argv.includes('--force');
  console.log(`\n🚀 競馬ガチャ R2アップロード開始 (force=${force})\n`);

  for (const [filePath, key] of FILES) {
    await upload(filePath, key, force);
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`🎉 完了  ✅ ${uploadCount}件アップロード  ⏭ ${skipCount}件スキップ  ⚠️ ${warnCount}件警告`);
}

main().catch((e) => { console.error(e); process.exit(1); });
