/**
 * Cloudflare R2 エレベーターガチャ軽量版アップロードスクリプト
 * 事前に encode-elevator-mobile.sh でエンコードしておくこと
 * 実行: npx tsx scripts/upload-elevator-mobile-r2.ts
 * 強制上書き: npx tsx scripts/upload-elevator-mobile-r2.ts --force
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

// ── 設定 ──────────────────────────────────────────────────────
// WSLエンコード出力先（Windowsからのアクセスパス）
const SOURCE_DIR = '\\\\wsl$\\Ubuntu\\tmp\\elevator-mobile';
const ACCOUNT_ID = '954dcc10adf822b50ccceedef0aa97e6';
const ACCESS_KEY = 'eaa0aa3d33af2b2d635d73218e633514';
const SECRET_KEY = '4275dc9a87fb942bc5e28974b31abed5fcbc2b920512869b059ab0e882e6462e';
const BUCKET     = 'bakugacha';

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
});

// ── ファイル一覧（エンコード済みファイル名 = R2キーのサフィックス）──
const FILES = [
  'eelev_title.mp4',
  'eelev_rise.mp4',
  'eelev_rise_down.mp4',
  'eelev_rise_fast.mp4',
  'eelev_stop.mp4',
  'eelev_stop_boss.mp4',
  'eelev_stop_countdown.mp4',
  'eelev_stop_multidoor.mp4',
  'eelev_stop_numchaos.mp4',
  'eelev_stop_numreverse.mp4',
  'eelev_stop_vibration.mp4',
  'eelev_stop_emergency.mp4',
  'eelev_stop_transparent.mp4',
  'eelev_stop_halfopen.mp4',
  'eelev_stop_mirror.mp4',
  'eelev_stop_ghost.mp4',
  'eelev_stop_ice.mp4',
  'eelev_stop_fire.mp4',
  'eelev_open_skip.mp4',
  'eelev_open_wall.mp4',
  'eelev_open_wall_collapse.mp4',
  'eelev_open_hole.mp4',
  'eelev_open_coin.mp4',
  'eelev_open_coin_explosion.mp4',
  'eelev_open_coin_boss.mp4',
  'eelev_final_lose.mp4',
  'eelev_final_win.mp4',
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
  console.log(`\n🚀 エレベーター軽量版 R2アップロード開始 (force=${force})\n`);

  console.log('── elevator-mobile 動画 ──');
  for (const file of FILES) {
    await upload(path.join(SOURCE_DIR, file), `elevator-mobile/${file}`, force);
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`🎉 完了  ✅ ${uploadCount}件アップロード  ⏭ ${skipCount}件スキップ  ⚠️ ${warnCount}件警告`);
  if (uploadCount > 0) {
    console.log(`\n📡 確認URL:`);
    console.log(`   https://pub-8b35f6e6ba774983a4321944c3771b60.r2.dev/elevator-mobile/eelev_title.mp4`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
