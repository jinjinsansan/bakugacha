import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServiceSupabase } from '@/lib/supabase/service';
import { getUserFromSession } from '@/lib/data/session';
import { requestDelivery } from '@/lib/data/prize-claims';
import { checkRateLimit } from '@/lib/ratelimit-db';

// PII を保存するため長さ・形式を検証する
const deliverySchema = z.object({
  claimId: z.string().min(1).max(100),
  recipientName: z.string().min(1).max(100),
  postalCode: z.string().min(1).max(10),
  address: z.string().min(1).max(300),
  phone: z.string().min(1).max(20),
});

export async function POST(request: Request) {
  try {
    const supabase = getServiceSupabase();
    const user = await getUserFromSession(supabase);
    if (!user) {
      return NextResponse.json({ success: false, error: 'ログインが必要です。' }, { status: 401 });
    }

    // レート制限: ユーザー単位 60秒に20回
    const rl = await checkRateLimit(supabase, { key: `delivery:${user.id}`, maxRequests: 20, windowSeconds: 60 });
    if (!rl.allowed) {
      return NextResponse.json({ success: false, error: 'リクエストが多すぎます。' }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = deliverySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: '入力内容をご確認ください。' }, { status: 400 });
    }
    const { claimId, recipientName, postalCode, address, phone } = parsed.data;

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
