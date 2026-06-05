const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Load .env.local
const envPath = path.resolve(__dirname, '..', '.env.local');
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const eqIdx = line.indexOf('=');
  if (eqIdx > 0 && !line.startsWith('#')) {
    process.env[line.substring(0, eqIdx).trim()] = line.substring(eqIdx + 1).trim();
  }
}

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME || 'bakugacha';

async function upload(localFile, r2Key) {
  const body = fs.readFileSync(localFile);
  await client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: r2Key,
    Body: body,
    ContentType: 'video/mp4',
  }));
  console.log(`Uploaded: ${r2Key} (${(body.length / 1024).toFixed(0)} KB)`);
}

(async () => {
  const root = path.resolve(__dirname, '..');
  await upload(path.join(root, '第二会場大当たり_encoded.mp4'), 'cd2/bonus_win_daini.mp4');
  await upload(path.join(root, '第二会場大当たり_low.mp4'), 'cd2-mobile/bonus_win_daini.mp4');
  console.log('Done!');
})();
