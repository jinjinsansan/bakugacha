import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/service';
import { getUserFromSession } from '@/lib/data/session';
import { convertToCoins } from '@/lib/data/keiba-cards';
import { convertRaiseToCoins, fetchExchangeRates } from '@/lib/data/raise-cards';

export async function POST(request: Request) {
  try {
    const supabase = getServiceSupabase();
    const user = await getUserFromSession(supabase);
    if (!user) {
      return NextResponse.json({ success: false, error: 'ログインが必要です。' }, { status: 401 });
    }

    const body = await request.json();
    const { cardId, cardType } = body as { cardId: string; cardType: 'keiba' | 'raise_kenta' | 'raise_shoichi' };

    if (!cardId || !cardType) {
      return NextResponse.json({ success: false, error: 'パラメータが不足しています。' }, { status: 400 });
    }

    // 交換レート取得
    const rates = await fetchExchangeRates(supabase, cardType);

    // カードのcard_id/charaIdを取得してレートを確認
    let cardKey: string | null = null;
    if (cardType === 'keiba') {
      const { data } = await supabase.from('keiba_cards').select('chara_id').eq('id', cardId).single();
      cardKey = data?.chara_id as string | null;
    } else {
      const { data } = await supabase.from('raise_cards').select('card_id').eq('id', cardId).single();
      cardKey = data?.card_id as string | null;
    }

    if (!cardKey) {
      return NextResponse.json({ success: false, error: 'カードが見つかりません。' }, { status: 404 });
    }

    const coins = rates[cardKey] ?? 0;
    if (coins <= 0) {
      return NextResponse.json({ success: false, error: 'このカードは交換できません。' }, { status: 400 });
    }

    let ok = false;
    if (cardType === 'keiba') {
      ok = await convertToCoins(supabase, cardId, user.id as string, coins);
    } else {
      ok = await convertRaiseToCoins(supabase, cardId, user.id as string, coins);
    }

    if (!ok) {
      return NextResponse.json({ success: false, error: '交換に失敗しました。' }, { status: 400 });
    }

    return NextResponse.json({ success: true, coins });
  } catch (error) {
    console.error('[cards/exchange]', error);
    return NextResponse.json({ success: false, error: '交換処理中にエラーが発生しました。' }, { status: 500 });
  }
}
