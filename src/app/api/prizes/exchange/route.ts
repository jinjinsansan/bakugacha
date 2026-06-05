import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/service';
import { getUserFromSession } from '@/lib/data/session';
import { convertPrizeToCoins } from '@/lib/data/prize-claims';
import { checkRateLimit } from '@/lib/ratelimit-db';

export async function POST(request: Request) {
  try {
    const supabase = getServiceSupabase();
    const user = await getUserFromSession(supabase);
    if (!user) {
      return NextResponse.json({ success: false, error: 'ログインが必要です。' }, { status: 401 });
    }

    // レート制限: ユーザー単位 60秒に30回
    const rl = await checkRateLimit(supabase, { key: `prize-exchange:${user.id}`, maxRequests: 30, windowSeconds: 60 });
    if (!rl.allowed) {
      return NextResponse.json({ success: false, error: 'リクエストが多すぎます。' }, { status: 429 });
    }

    const body = await request.json();
    const { claimId } = body as { claimId: string };

    if (!claimId) {
      return NextResponse.json({ success: false, error: 'パラメータが不足しています。' }, { status: 400 });
    }

    const result = await convertPrizeToCoins(supabase, claimId, user.id as string);

    if (!result.ok) {
      return NextResponse.json({ success: false, error: '交換に失敗しました。商品の交換コインが未設定の可能性があります。' }, { status: 400 });
    }

    return NextResponse.json({ success: true, coins: result.coins });
  } catch (error) {
    console.error('[prizes/exchange]', error);
    return NextResponse.json({ success: false, error: '処理中にエラーが発生しました。' }, { status: 500 });
  }
}
