/**
 * Cloudflare R2 競馬ガチャカード画像アップロードスクリプト
 * 実行: npx tsx scripts/upload-keiba-cards.ts
 * 強制上書き: npx tsx scripts/upload-keiba-cards.ts --force
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

// ── 設定 ──────────────────────────────────────────────────────
const BASE_DIR   = path.resolve(__dirname, '..', '競馬ガチャカード');
const ACCOUNT_ID = '954dcc10adf822b50ccceedef0aa97e6';
const ACCESS_KEY = 'eaa0aa3d33af2b2d635d73218e633514';
const SECRET_KEY = '4275dc9a87fb942bc5e28974b31abed5fcbc2b920512869b059ab0e882e6462e';
const BUCKET     = 'bakugacha';

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
});

// ── ファイル定義（[ソースファイル名, R2キー]） ─────────────────
const FILES: [string, string][] = [
  ['A-01_shirogane.png',     'keiba-cards/A-01_shirogane.png'],
  ['A-02_darkbolt.png',      'keiba-cards/A-02_darkbolt.png'],
  ['A-03_aoikaze.png',       'keiba-cards/A-03_aoikaze.png'],
  ['A-04_honoohime.png',     'keiba-cards/A-04_honoohime.png'],
  ['A-05_fuwarin.png',       'keiba-cards/A-05_fuwarin.png'],
  ['A-06_bakugachahime.png', 'keiba-cards/A-06_bakugachahime.png'],
  ['A-07_umaoyaji.png',      'keiba-cards/A-07_umaoyaji.png'],
  ['ハズレ元画像.png',        'keiba-cards/hazure.png'],
];

// ── ユーティリティ ────────────────────────────────────────────
async function exists(key: string): Promise<boolean> {
  try {
    await client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

let uploadCount = 0, skipCount = 0, warnCount = 0;

async function upload(fileName: string, key: string, force: boolean) {
  const filePath = path.join(BASE_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠️  見つかりません: ${fileName}`);
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
    Bucket: BUCKET, Key: key, Body: body, ContentType: 'image/png',
  }));
  console.log(`  ✅ ${key}`);
  uploadCount++;
}

// ── メイン ────────────────────────────────────────────────────
async function main() {
  const force = process.argv.includes('--force');
  console.log(`\n🃏 競馬ガチャカード R2アップロード開始 (force=${force})\n`);

  for (const [fileName, key] of FILES) {
    await upload(fileName, key, force);
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`🎉 完了  ✅ ${uploadCount}件アップロード  ⏭ ${skipCount}件スキップ  ⚠️ ${warnCount}件警告`);
}

main().catch((e) => { console.error(e); process.exit(1); });
