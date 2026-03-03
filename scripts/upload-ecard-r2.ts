/**
 * Cloudflare R2 ecard動画アップロードスクリプト
 * 実行: npx tsx scripts/upload-ecard-r2.ts
 * 強制上書き: npx tsx scripts/upload-ecard-r2.ts --force
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

// ── 設定 ──────────────────────────────────────────────────────
const SOURCE_DIR = path.resolve(__dirname, '..', 'ROYALカード映像やり直し版');
const ACCOUNT_ID = '954dcc10adf822b50ccceedef0aa97e6';
const ACCESS_KEY = 'eaa0aa3d33af2b2d635d73218e633514';
const SECRET_KEY = '4275dc9a87fb942bc5e28974b31abed5fcbc2b920512869b059ab0e882e6462e';
const BUCKET     = 'bakugacha';

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
});

const REVERSE_DIR = path.resolve(SOURCE_DIR, '皇帝奴隷');

// ── ファイルマッピング ─────────────────────────────────────────
const ECARD_MAP: Array<{ src: string; key: string; srcDir?: string }> = [
  { src: 'ecard_title.mp4',        key: 'ecard/ecard_title.mp4' },
  { src: 'ecard_my_blackout.mp4',  key: 'ecard/ecard_my_blackout.mp4' },
  { src: 'ecard_opp_blackout.mp4', key: 'ecard/ecard_opp_blackout.mp4' },
  { src: 'ecard_my_card_back.mp4', key: 'ecard/ecard_my_card_back.mp4' },
  { src: 'ecard_opp_card_back.mp4',key: 'ecard/ecard_opp_card_back.mp4' },
  { src: 'ecard_my_emperor.mp4',   key: 'ecard/ecard_my_emperor.mp4' },
  { src: 'ecard_my_slave.mp4',     key: 'ecard/ecard_my_slave.mp4' },
  { src: 'ecard_my_citizen.mp4',   key: 'ecard/ecard_my_citizen.mp4' },
  { src: 'ecard_opp_emperor.mp4',  key: 'ecard/ecard_opp_emperor.mp4' },
  { src: 'ecard_opp_slave.mp4',    key: 'ecard/ecard_opp_slave.mp4' },
  { src: 'ecard_opp_citizen.mp4',  key: 'ecard/ecard_opp_citizen.mp4' },
  { src: 'ecard_win.mp4',          key: 'ecard/ecard_win.mp4' },
  { src: 'ecard_lose.mp4',         key: 'ecard/ecard_lose.mp4' },
  { src: 'ecard_draw.mp4',         key: 'ecard/ecard_draw.mp4' },
  { src: 'ecard_donten.mp4',       key: 'ecard/ecard_donten.mp4' },
  { src: 'ecard_final_win.mp4',    key: 'ecard/ecard_final_win.mp4' },
  // 皇帝・奴隷 逆再生用動画（皇帝奴隷サブフォルダから）
  { src: 'ecard_my_emperor_reverse.mp4',  key: 'ecard/ecard_my_emperor_reverse.mp4',  srcDir: REVERSE_DIR },
  { src: 'ecard_my_slave_reverse.mp4',    key: 'ecard/ecard_my_slave_reverse.mp4',    srcDir: REVERSE_DIR },
  { src: 'ecard_opp_king_reverse.mp4',    key: 'ecard/ecard_opp_king_reverse.mp4',    srcDir: REVERSE_DIR },
  { src: 'ecard_opp_joker_reverse.mp4',   key: 'ecard/ecard_opp_joker_reverse.mp4',   srcDir: REVERSE_DIR },
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
  console.log(`\n🚀 ecard R2アップロード開始 (force=${force})\n`);

  console.log('── ROYALカード動画 ──');
  for (const { src, key, srcDir } of ECARD_MAP) {
    const baseDir = srcDir ?? SOURCE_DIR;
    await upload(path.join(baseDir, src), key, force);
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`🎉 完了  ✅ ${uploadCount}件アップロード  ⏭ ${skipCount}件スキップ  ⚠️ ${warnCount}件警告`);
  if (uploadCount > 0) {
    console.log(`\n📡 確認URL:`);
    console.log(`   https://pub-8b35f6e6ba774983a4321944c3771b60.r2.dev/ecard/ecard_title.mp4`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
