import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getServerEnv } from '@/lib/env';
import { getServiceSupabase } from '@/lib/supabase/service';
import { findUserByLineId } from '@/lib/data/users';
import { grantCoins } from '@/lib/data/coins';

const LINE_REWARD_COINS = Number(process.env.LINE_REWARD_COINS ?? 300);

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

type LineEvent = {
  type: string;
  source?: { type: string; userId?: string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

async function handleFollowEvent(lineUserId: string) {
  const supabase = getServiceSupabase();

  const user = await findUserByLineId(supabase, lineUserId);
  if (!user) {
    console.log('Follow event: no matching user for', lineUserId);
    return;
  }

  if (user.line_friend_bonus_at) {
    console.log('Follow event: bonus already granted for', lineUserId);
    return;
  }

  // 300コイン付与
  if (LINE_REWARD_COINS > 0) {
    await grantCoins(supabase, user.id as string, LINE_REWARD_COINS, `公式LINE友だち追加ボーナス (+${LINE_REWARD_COINS}コイン)`);
  }

  // ボーナス付与済みフラグ
  await supabase
    .from('app_users')
    .update({ line_friend_bonus_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', user.id);

  console.log('Follow event: granted', LINE_REWARD_COINS, 'coins to user', user.id);
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-line-signature');
  const { LINE_CHANNEL_SECRET } = getServerEnv();

  if (!verifyLineSignature(rawBody, signature, LINE_CHANNEL_SECRET)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody) as { events?: LineEvent[] };
    const events = payload.events ?? [];

    for (const event of events) {
      if (event.type === 'follow' && event.source?.userId) {
        await handleFollowEvent(event.source.userId);
      }
    }
  } catch (err) {
    console.error('Webhook processing error', err);
  }

  return NextResponse.json({ ok: true });
}

export function GET() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}
