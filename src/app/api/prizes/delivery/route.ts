import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/service';
import { getUserFromSession } from '@/lib/data/session';
import { requestDelivery } from '@/lib/data/prize-claims';

export async function POST(request: Request) {
  try {
    const supabase = getServiceSupabase();
    const user = await getUserFromSession(supabase);
    if (!user) {
      return NextResponse.json({ success: false, error: 'ログインが必要です。' }, { status: 401 });
    }

    const body = await request.json();
    const { claimId, recipientName, postalCode, address, phone } = body as {
      claimId: string; recipientName: string; postalCode: string; address: string; phone: string;
    };

    if (!claimId || !recipientName || !postalCode || !address || !phone) {
      return NextResponse.json({ success: false, error: '全ての項目を入力してください。' }, { status: 400 });
    }

    const ok = await requestDelivery(supabase, claimId, user.id as string, {
      recipientName, postalCode, address, phone,
    });

    if (!ok) {
      return NextResponse.json({ success: false, error: '配送申請に失敗しました。' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[prizes/delivery]', error);
    return NextResponse.json({ success: false, error: '処理中にエラーが発生しました。' }, { status: 500 });
  }
}
