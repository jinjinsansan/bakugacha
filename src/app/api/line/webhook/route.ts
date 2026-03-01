import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getServerEnv } from '@/lib/env';

function verifyLineSignature(body: string, signature: string | null, channelSecret?: string) {
  if (!channelSecret) return true;
  if (!signature) return false;
  const hmac = crypto.createHmac('sha256', channelSecret);
  hmac.update(body);
  const expected = Buffer.from(hmac.digest('base64'));
  const provided = Buffer.from(signature);
  if (expected.length !== provided.length) return false;
  return crypto.timingSafeEqual(expected, provided);
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-line-signature');
  const { LINE_CHANNEL_SECRET } = getServerEnv();

  if (!verifyLineSignature(rawBody, signature, LINE_CHANNEL_SECRET)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  if (process.env.NODE_ENV !== 'production') {
    try {
      const payload = JSON.parse(rawBody);
      console.log('LINE webhook payload', payload);
    } catch { /* ignore */ }
  }

  return NextResponse.json({ ok: true });
}

export function GET() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}
