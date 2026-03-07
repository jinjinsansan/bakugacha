import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/service';
import { getUserFromSession } from '@/lib/data/session';
import { fetchUserRaiseCards } from '@/lib/data/raise-cards';

export async function GET() {
  try {
    const supabase = getServiceSupabase();
    const user = await getUserFromSession(supabase);

    if (!user) {
      return NextResponse.json({ success: false, error: 'ログインが必要です。' }, { status: 401 });
    }

    const cards = await fetchUserRaiseCards(supabase, user.id as string);

    return NextResponse.json({ success: true, cards });
  } catch (error) {
    console.error('[raise-gacha/cards]', error);
    return NextResponse.json(
      { success: false, error: 'カード情報の取得に失敗しました。' },
      { status: 500 },
    );
  }
}
