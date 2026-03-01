import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getR2Client } from './client';

const BUCKET = process.env.R2_BUCKET_NAME ?? 'bakugacha';
const PUBLIC_BASE = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL ?? '';

/**
 * Upload a buffer to R2 and return the public URL.
 */
export async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string,
): Promise<string> {
  const client = getR2Client();

  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  return `${PUBLIC_BASE}/${key}`;
}
