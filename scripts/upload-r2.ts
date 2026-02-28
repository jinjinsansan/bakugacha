/**
 * Cloudflare R2 動画アップロードスクリプト
 * 実行: npx tsx scripts/upload-r2.ts
 * 強制上書き: npx tsx scripts/upload-r2.ts --force
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

// ── 設定 ──────────────────────────────────────────────────────
const BASE_DIR     = 'E:/dev/Cusor/tensei/炎映像/カウントダウンチャレンジ２ガチャ';
const ENCODED_DIR  = `${BASE_DIR}/_reencoded`;   // エンコード済み動画
const FREEZE_DIR   = `${BASE_DIR}/フリーズ当たり用カードシャッフル`;
const ACCOUNT_ID   = '954dcc10adf822b50ccceedef0aa97e6';
const ACCESS_KEY   = 'eaa0aa3d33af2b2d635d73218e633514';
const SECRET_KEY   = '4275dc9a87fb942bc5e28974b31abed5fcbc2b920512869b059ab0e882e6462e';
const BUCKET       = 'bakugacha';

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
});

// ── ファイルマッピング ─────────────────────────────────────────
// src: ソースファイル名（_reencoded フォルダ内）
// key: R2 のキー（アップロード先パス）
// 再修正版がある場合はそちらを使用
const ENCODED_MAP: Array<{ src: string; key: string }> = [
  // タイトル
  { src: '1秒タイトル映像赤.mp4',           key: 'cd2/title_red.mp4' },
  // カウントダウン（再修正版優先）
  { src: '1秒赤10.mp4',                    key: 'cd2/red_10.mp4' },
  { src: '1秒赤９.mp4',                    key: 'cd2/red_9.mp4' },
  { src: '1秒赤８.mp4',                    key: 'cd2/red_8.mp4' },
  { src: '1秒赤7.mp4',                     key: 'cd2/red_7.mp4' },
  { src: '1秒赤６映像再修正版.mp4',         key: 'cd2/red_6.mp4' },  // 再修正版
  { src: '1秒赤５.mp4',                    key: 'cd2/red_5.mp4' },
  { src: '1秒赤４.mp4',                    key: 'cd2/red_4.mp4' },
  { src: '1秒赤３映像再修正版.mp4',         key: 'cd2/red_3.mp4' },  // 再修正版
  { src: '1秒赤２.mp4',                    key: 'cd2/red_2.mp4' },
  { src: '1秒赤１.mp4',                    key: 'cd2/red_1.mp4' },
  { src: '1秒赤０.mp4',                    key: 'cd2/red_0.mp4' },
  // 当たり
  { src: '1秒赤３当たり.mp4',              key: 'cd2/red_3_win.mp4' },
  { src: '1秒赤２当たり.mp4',              key: 'cd2/red_2_win.mp4' },
  { src: '1秒赤１当たり.mp4',              key: 'cd2/red_1_win.mp4' },
  { src: '1秒赤０当たり.mp4',              key: 'cd2/red_0_win.mp4' },
  // ハズレ（再修正版優先）
  { src: '1秒赤３ハズレ映像再修正版.mp4',   key: 'cd2/red_3_loss.mp4' },  // 再修正版
  { src: '1秒赤２ハズレ.mp4',              key: 'cd2/red_2_loss.mp4' },
  { src: '1秒赤1ハズレ.mp4',               key: 'cd2/red_loss.mp4' },
  { src: '1秒赤０ハズレ.mp4',              key: 'cd2/red_0_loss.mp4' },
  // 演出
  { src: '1秒パトライト映像.mp4',          key: 'cd2/patlite.mp4' },
  { src: '1秒どんでん返し映像.mp4',        key: 'cd2/donden.mp4' },
  { src: '1秒ジャックポット映像.mp4',      key: 'cd2/jackpot.mp4' },
];

// スタンバイ動画は _reencoded に含まれないため親フォルダから
const STANDBY_MAP: Array<{ src: string; key: string }> = [
  { src: 'blackstandby.mp4',   key: 'cd2/standby/blackstandby.mp4' },
  { src: 'bluestandby.mp4',    key: 'cd2/standby/bluestandby.mp4' },
  { src: 'rainbowstandby.mp4', key: 'cd2/standby/rainbowstandby.mp4' },
  { src: 'redstandby.mp4',     key: 'cd2/standby/redstandby.mp4' },
  { src: 'whitestandby.mp4',   key: 'cd2/standby/whitestandby.mp4' },
  { src: 'yellowstandby.mp4',  key: 'cd2/standby/yellowstandby.mp4' },
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

async function upload(filePath: string, key: string, contentType: string, force: boolean) {
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
    Bucket: BUCKET, Key: key, Body: body, ContentType: contentType,
  }));
  console.log(`  ✅ ${key}`);
  uploadCount++;
}

// ── メイン ────────────────────────────────────────────────────
async function main() {
  const force = process.argv.includes('--force');
  console.log(`\n🚀 R2アップロード開始 (force=${force})\n`);

  console.log('── カウントダウン・演出動画（_reencoded）──');
  for (const { src, key } of ENCODED_MAP) {
    await upload(path.join(ENCODED_DIR, src), key, 'video/mp4', force);
  }

  console.log('\n── スタンバイ動画（親フォルダ）──');
  for (const { src, key } of STANDBY_MAP) {
    await upload(path.join(BASE_DIR, src), key, 'video/mp4', force);
  }

  console.log('\n── フリーズカード（.png）──');
  if (fs.existsSync(FREEZE_DIR)) {
    const files = fs.readdirSync(FREEZE_DIR).filter((f) => f.endsWith('.png')).sort();
    for (const file of files) {
      await upload(path.join(FREEZE_DIR, file), `cd2/freeze-cards/${file}`, 'image/png', force);
    }
  } else {
    console.warn(`  ⚠️  フォルダが見つかりません: ${FREEZE_DIR}`);
    warnCount++;
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`🎉 完了  ✅ ${uploadCount}件アップロード  ⏭ ${skipCount}件スキップ  ⚠️ ${warnCount}件警告`);
  if (uploadCount > 0) {
    console.log(`\n📡 確認URL:`);
    console.log(`   https://pub-8b35f6e6ba774983a4321944c3771b60.r2.dev/cd2/title_red.mp4`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
