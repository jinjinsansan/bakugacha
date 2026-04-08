/**
 * POST /api/kreward
 * netkeita Kリワード転送受取エンドポイント
 * X-Kreward-Secret ヘッダーで認証
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/service';
import { findUserByLineId } from '@/lib/data/users';
import { grantCoins } from '@/lib/data/coins';

const KREWARD_SECRET = process.env.KREWARD_SECRET ?? '';

export async function POST(req: NextRequest) {
  // 内部シークレット認証
  const secret = req.headers.get('x-kreward-secret') ?? '';
  if (!KREWARD_SECRET || secret !== KREWARD_SECRET) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: { line_user_id?: string; coins?: number; description?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const { line_user_id, coins, description } = body;
  if (!line_user_id || !coins || coins <= 0) {
    return NextResponse.json({ success: false, error: 'line_user_id と coins が必要です' }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const user = await findUserByLineId(supabase, line_user_id);
  if (!user) {
    return NextResponse.json(
      { success: false, error: '爆ガチャアカウントが見つかりません。爆ガチャにLINEログインしてください。' },
      { status: 404 },
    );
  }

  try {
    const newBalance = await grantCoins(
      supabase,
      user.id as string,
      coins,
      description ?? 'netkeita Kリワード転送',
      'kreward',
    );
    return NextResponse.json({ success: true, new_balance: newBalance });
  } catch (e) {
    console.error('[kreward] grantCoins error:', e);
    return NextResponse.json({ success: false, error: 'コイン付与に失敗しました' }, { status: 500 });
  }
}
