import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/service';
import { getUserFromSession } from '@/lib/data/session';
import { fetchUserPrizeClaims } from '@/lib/data/prize-claims';

export async function GET() {
  try {
    const supabase = getServiceSupabase();
    const user = await getUserFromSession(supabase);
    if (!user) {
      return NextResponse.json({ success: false, error: 'ログインが必要です。' }, { status: 401 });
    }

    const claims = await fetchUserPrizeClaims(supabase, user.id as string);
    return NextResponse.json({ success: true, claims });
  } catch (error) {
    console.error('[prizes]', error);
    return NextResponse.json({ success: false, error: '取得に失敗しました。' }, { status: 500 });
  }
}
