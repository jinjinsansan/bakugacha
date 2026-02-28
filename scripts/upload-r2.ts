/**
 * Cloudflare R2 動画アップロードスクリプト
 * 実行: npx tsx scripts/upload-r2.ts
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

// ── 設定 ──────────────────────────────────────────────────────
const SOURCE_DIR   = 'E:/dev/Cusor/tensei/炎映像/カウントダウンチャレンジ２ガチャ';
const FREEZE_DIR   = `${SOURCE_DIR}/フリーズ当たり用カードシャッフル`;
const ACCOUNT_ID   = '954dcc10adf822b50ccceedef0aa97e6';
const ACCESS_KEY   = 'eaa0aa3d33af2b2d635d73218e633514';
const SECRET_KEY   = '4275dc9a87fb942bc5e28974b31abed5fcbc2b920512869b059ab0e882e6462e';
const BUCKET       = 'bakugacha';

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
});

// ── ローカルファイル名 → R2キー のマッピング ──────────────────
// 再修正版がある場合はそちらを優先
const FILE_MAP: Array<{ src: string; key: string }> = [
  // スタンバイ
  { src: 'blackstandby.mp4',          key: 'cd2/standby/blackstandby.mp4' },
  { src: 'bluestandby.mp4',           key: 'cd2/standby/bluestandby.mp4' },
  { src: 'rainbowstandby.mp4',        key: 'cd2/standby/rainbowstandby.mp4' },
  { src: 'redstandby.mp4',            key: 'cd2/standby/redstandby.mp4' },
  { src: 'whitestandby.mp4',          key: 'cd2/standby/whitestandby.mp4' },
  { src: 'yellowstandby.mp4',         key: 'cd2/standby/yellowstandby.mp4' },
  // タイトル
  { src: '1秒タイトル映像赤.mp4',      key: 'cd2/title_red.mp4' },
  // カウントダウン（再修正版優先）
  { src: '1秒赤10.mp4',               key: 'cd2/red_10.mp4' },
  { src: '1秒赤９.mp4',               key: 'cd2/red_9.mp4' },
  { src: '1秒赤８.mp4',               key: 'cd2/red_8.mp4' },
  { src: '1秒赤7.mp4',                key: 'cd2/red_7.mp4' },
  { src: '1秒赤６映像再修正版.mp4',    key: 'cd2/red_6.mp4' },
  { src: '1秒赤５.mp4',               key: 'cd2/red_5.mp4' },
  { src: '1秒赤４.mp4',               key: 'cd2/red_4.mp4' },
  { src: '1秒赤３映像再修正版.mp4',    key: 'cd2/red_3.mp4' },
  { src: '1秒赤２.mp4',               key: 'cd2/red_2.mp4' },
  { src: '1秒赤１.mp4',               key: 'cd2/red_1.mp4' },
  { src: '1秒赤０.mp4',               key: 'cd2/red_0.mp4' },
  // 当たり
  { src: '1秒赤３当たり.mp4',          key: 'cd2/red_3_win.mp4' },
  { src: '1秒赤２当たり.mp4',          key: 'cd2/red_2_win.mp4' },
  { src: '1秒赤１当たり.mp4',          key: 'cd2/red_1_win.mp4' },
  { src: '1秒赤０当たり.mp4',          key: 'cd2/red_0_win.mp4' },
  // ハズレ（再修正版優先）
  { src: '1秒赤３ハズレ映像再修正版.mp4', key: 'cd2/red_3_loss.mp4' },
  { src: '1秒赤２ハズレ.mp4',          key: 'cd2/red_2_loss.mp4' },
  { src: '1秒赤1ハズレ.mp4',           key: 'cd2/red_loss.mp4' },   // red_1_loss も同ファイル
  { src: '1秒赤０ハズレ.mp4',          key: 'cd2/red_0_loss.mp4' },
  // 演出
  { src: '1秒パトライト映像.mp4',      key: 'cd2/patlite.mp4' },
  { src: '1秒どんでん返し映像.mp4',    key: 'cd2/donden.mp4' },
  { src: '1秒ジャックポット映像.mp4',  key: 'cd2/jackpot.mp4' },
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

async function upload(filePath: string, key: string, contentType: string, force = false) {
  if (!force && await exists(key)) {
    console.log(`  ⏭  スキップ（既存）: ${key}`);
    return;
  }
  const body = fs.readFileSync(filePath);
  await client.send(new PutObjectCommand({
    Bucket: BUCKET, Key: key, Body: body, ContentType: contentType,
  }));
  console.log(`  ✅ ${key}`);
}

// ── メイン ────────────────────────────────────────────────────
async function main() {
  const force = process.argv.includes('--force');
  console.log(`\n🚀 R2アップロード開始 (force=${force})\n`);

  let ok = 0, skip = 0, warn = 0;

  // 動画ファイル
  console.log('── 動画ファイル ──');
  for (const { src, key } of FILE_MAP) {
    const filePath = path.join(SOURCE_DIR, src);
    if (!fs.existsSync(filePath)) {
      console.warn(`  ⚠️  見つかりません: ${src}`);
      warn++;
      continue;
    }
    const before = ok;
    await upload(filePath, key, 'video/mp4', force);
    if (ok > before) ok++; else skip++;
  }

  // フリーズカード (.png)
  console.log('\n── フリーズカード ──');
  if (fs.existsSync(FREEZE_DIR)) {
    const files = fs.readdirSync(FREEZE_DIR).filter((f) => f.endsWith('.png'));
    for (const file of files) {
      const filePath = path.join(FREEZE_DIR, file);
      await upload(filePath, `cd2/freeze-cards/${file}`, 'image/png', force);
    }
  } else {
    console.warn(`  ⚠️  フォルダが見つかりません: ${FREEZE_DIR}`);
  }

  console.log(`\n🎉 完了  アップロード: ${ok}件  スキップ: ${skip}件  警告: ${warn}件`);
  console.log(`\n📡 公開URL確認:\n   https://pub-8b35f6e6ba774983a4321944c3771b60.r2.dev/cd2/title_red.mp4`);
}

main().catch((e) => { console.error(e); process.exit(1); });
