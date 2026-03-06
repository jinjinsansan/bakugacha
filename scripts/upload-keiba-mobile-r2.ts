/**
 * Cloudflare R2 競馬ガチャ軽量版アップロードスクリプト
 * 事前に encode-keiba-mobile.sh でエンコードしておくこと
 * 実行: npx tsx scripts/upload-keiba-mobile-r2.ts
 * 強制上書き: npx tsx scripts/upload-keiba-mobile-r2.ts --force
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

// ── 設定 ──────────────────────────────────────────────────────
const SOURCE_DIR = '/tmp/keiba-mobile';
const ACCOUNT_ID = '954dcc10adf822b50ccceedef0aa97e6';
const ACCESS_KEY = 'eaa0aa3d33af2b2d635d73218e633514';
const SECRET_KEY = '4275dc9a87fb942bc5e28974b31abed5fcbc2b920512869b059ab0e882e6462e';
const BUCKET     = 'bakugacha';

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
});

// ── ファイル一覧 ──────────────────────────────────────────────
const FILES = [
  // タイトル演出（コース別ファンファーレ）
  'title_sunny_turf.mp4',
  'title_sunny_dirt.mp4',
  'title_soft_turf.mp4',
  'title_soft_dirt.mp4',
  'title_heavy_turf.mp4',
  'title_rain_turf.mp4',
  'title_rain_dirt.mp4',
  // キャラ紹介
  'A-01_chara_shirogane.mp4',
  'A-02_chara_darkbolt.mp4',
  'A-03_chara_aoikaze.mp4',
  'A-04_chara_honohime.mp4',
  'A-05_chara_fuwarin.mp4',
  'A-06_chara_bakugachahime.mp4',
  'A-07_chara_umaoyaji.mp4',
  // ゲートスタート
  'E-01_gate_start_sunny_turf.mp4',
  'E-01b_gate_start_sunny_turf_umaoyaji.mp4',
  'E-02_gate_start_sunny_dirt.mp4',
  'E-03_gate_start_soft_turf.mp4',
  'E-04_gate_start_soft_dirt.mp4',
  'E-05_gate_start_heavy_turf.mp4',
  'E-06_gate_start_rain_turf.mp4',
  'E-07_gate_start_rain_dirt.mp4',
  // 集団走行
  'F-01_pack_side_sunny_turf.mp4',
  'F-01b_pack_side_sunny_turf_umaoyaji.mp4',
  'F-02_pack_side_sunny_dirt.mp4',
  'F-03_pack_side_soft_turf.mp4',
  'F-04_pack_side_soft_dirt.mp4',
  'F-05_pack_side_heavy_turf.mp4',
  'F-06_pack_side_rain_turf.mp4',
  'F-07_pack_side_rain_dirt.mp4',
  // 最終コーナー
  'G-01_final_corner_sunny_turf.mp4',
  'G-01b_final_corner_sunny_turf_umaoyaji.mp4',
  'G-02_final_corner_sunny_dirt.mp4',
  'G-03_final_corner_soft_turf.mp4',
  'G-04_final_corner_soft_dirt.mp4',
  'G-05_final_corner_heavy_turf.mp4',
  'G-06_final_corner_rain_turf.mp4',
  'G-07_final_corner_rain_dirt.mp4',
  // ゴール直前
  'H-01_goal_front_sunny_turf.mp4',
  'H-01b_goal_front_sunny_turf_umaoyaji.mp4',
  'H-02_goal_front_sunny_dirt.mp4',
  'H-03_goal_front_soft_turf.mp4',
  'H-04_goal_front_soft_dirt.mp4',
  'H-05_goal_front_heavy_turf.mp4',
  'H-06_goal_front_rain_turf.mp4',
  'H-07_goal_front_rain_dirt.mp4',
  // 当たり演出
  'WIN-01_shirogane.mp4',
  'WIN-02_darkbolt.mp4',
  'WIN-03_aoikaze.mp4',
  'WIN-04_honohime.mp4',
  'WIN-05_fuwarin.mp4',
  'WIN-06_bakugachahime.mp4',
  'WIN-07_umaoyaji.mp4',
  // ハズレ演出
  'LOSE-01_shirogane.mp4',
  'LOSE-02_darkbolt.mp4',
  'LOSE-03_aoikaze.mp4',
  'LOSE-04_honohime.mp4',
  'LOSE-05_fuwarin.mp4',
  'LOSE-06_bakugachahime.mp4',
  'LOSE-07_umaoyaji.mp4',
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
  console.log(`\n🚀 競馬ガチャ軽量版 R2アップロード開始 (force=${force})\n`);

  for (const file of FILES) {
    await upload(path.join(SOURCE_DIR, file), `keiba-mobile/${file}`, force);
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`🎉 完了  ✅ ${uploadCount}件アップロード  ⏭ ${skipCount}件スキップ  ⚠️ ${warnCount}件警告`);
}

main().catch((e) => { console.error(e); process.exit(1); });
