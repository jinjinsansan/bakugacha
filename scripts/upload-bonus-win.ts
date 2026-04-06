/**
 * 大当たりボーナス映像を R2 にアップロードし、第一抽選会場の bonus_win_video_url を更新する
 * 実行: npx tsx --env-file=.env.local scripts/upload-bonus-win.ts
 */
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const ACCOUNT_ID  = process.env.R2_ACCOUNT_ID!;
const ACCESS_KEY  = process.env.R2_ACCESS_KEY_ID!;
const SECRET_KEY  = process.env.R2_SECRET_ACCESS_KEY!;
const BUCKET      = process.env.R2_BUCKET_NAME ?? 'bakugacha';
const PUBLIC_BASE = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL!;

const SUPABASE_URL      = process.env.SUPABASE_URL!;
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!ACCOUNT_ID || !ACCESS_KEY || !SECRET_KEY || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('必要な環境変数が設定されていません。');
  process.exit(1);
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
});

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const BASE_DIR = path.join(process.cwd());

const UPLOADS = [
  { file: '大当たり_encoded.mp4', dest: 'cd2/bonus_win.mp4' },
  { file: '大当たり_low.mp4',     dest: 'cd2-mobile/bonus_win.mp4' },
];

async function uploadFile(filePath: string, dest: string) {
  if (!fs.existsSync(filePath)) {
    console.error(`ファイルが見つかりません: ${filePath}`);
    process.exit(1);
  }
  const body = fs.readFileSync(filePath);
  const sizeMB = (body.length / 1024 / 1024).toFixed(1);
  console.log(`  ⬆ ${dest} (${sizeMB} MB)`);
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: dest,
    Body: body,
    ContentType: 'video/mp4',
  }));
  console.log(`  ✅ ${PUBLIC_BASE}/${dest}`);
}

async function main() {
  console.log('\n🚀 ボーナス映像アップロード開始\n');

  for (const { file, dest } of UPLOADS) {
    await uploadFile(path.join(BASE_DIR, file), dest);
  }

  // 第一抽選会場の product ID を検索
  const { data: products, error } = await supabase
    .from('gacha_products')
    .select('id, title')
    .ilike('title', '%第一抽選会場%');

  if (error) { console.error('DB エラー:', error.message); process.exit(1); }
  if (!products || products.length === 0) {
    console.log('\n⚠ 「第一抽選会場」という商品が見つかりませんでした。');
    console.log('   管理者パネルで bonus_win_video_url に「bonus_win.mp4」と入力してください。');
    return;
  }

  console.log(`\n🔍 見つかった商品:`);
  for (const p of products) {
    console.log(`   id=${p.id}  title=${p.title}`);
  }

  if (products.length === 1) {
    const { error: updateError } = await supabase
      .from('gacha_products')
      .update({ bonus_win_video_url: 'bonus_win.mp4' })
      .eq('id', products[0].id);

    if (updateError) {
      console.error('DB 更新エラー:', updateError.message);
      process.exit(1);
    }
    console.log(`\n✅ bonus_win_video_url = 'bonus_win.mp4' を ${products[0].id} に設定しました`);
  } else {
    console.log('\n複数の商品が見つかりました。手動で設定してください。');
  }

  console.log('\n完了！');
}

main().catch((e) => { console.error(e); process.exit(1); });
