import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/service';
import { getUserFromSession } from '@/lib/data/session';
import { requestBuyback, cancelBuyback } from '@/lib/data/keiba-cards';
import { requestRaiseBuyback, cancelRaiseBuyback } from '@/lib/data/raise-cards';
import { checkRateLimit } from '@/lib/ratelimit-db';

/** 買取申請 */
export async function POST(request: Request) {
  try {
    const supabase = getServiceSupabase();
    const user = await getUserFromSession(supabase);
    if (!user) {
      return NextResponse.json({ success: false, error: 'ログインが必要です。' }, { status: 401 });
    }

    // レート制限: ユーザー単位 60秒に30回
    const rl = await checkRateLimit(supabase, { key: `buyback:${user.id}`, maxRequests: 30, windowSeconds: 60 });
    if (!rl.allowed) {
      return NextResponse.json({ success: false, error: 'リクエストが多すぎます。' }, { status: 429 });
    }

    const body = await request.json();
    const { cardId, cardType } = body as { cardId: string; cardType: 'keiba' | 'raise' };

    if (!cardId || !cardType) {
      return NextResponse.json({ success: false, error: 'パラメータが不足しています。' }, { status: 400 });
    }

    let result: { buybackCode: string } | null = null;
    if (cardType === 'keiba') {
      result = await requestBuyback(supabase, cardId, user.id as string);
    } else {
      result = await requestRaiseBuyback(supabase, cardId, user.id as string);
    }

    if (!result) {
      return NextResponse.json({ success: false, error: '買取申請に失敗しました。' }, { status: 400 });
    }

    return NextResponse.json({ success: true, buybackCode: result.buybackCode });
  } catch (error) {
    console.error('[cards/buyback]', error);
    return NextResponse.json({ success: false, error: '処理中にエラーが発生しました。' }, { status: 500 });
  }
}

/** 買取キャンセル */
export async function DELETE(request: Request) {
  try {
    const supabase = getServiceSupabase();
    const user = await getUserFromSession(supabase);
    if (!user) {
      return NextResponse.json({ success: false, error: 'ログインが必要です。' }, { status: 401 });
    }

    const body = await request.json();
    const { cardId, cardType } = body as { cardId: string; cardType: 'keiba' | 'raise' };

    if (!cardId || !cardType) {
      return NextResponse.json({ success: false, error: 'パラメータが不足しています。' }, { status: 400 });
    }

    let ok = false;
    if (cardType === 'keiba') {
      ok = await cancelBuyback(supabase, cardId, user.id as string);
    } else {
      ok = await cancelRaiseBuyback(supabase, cardId, user.id as string);
    }

    if (!ok) {
      return NextResponse.json({ success: false, error: 'キャンセルに失敗しました。' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[cards/buyback]', error);
    return NextResponse.json({ success: false, error: '処理中にエラーが発生しました。' }, { status: 500 });
  }
}
