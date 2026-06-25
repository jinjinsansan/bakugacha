/**
 * POST /api/kreward
 * netkeita Kリワード転送受取エンドポイント
 * X-Kreward-Secret ヘッダーで認証
 */
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/service';
import { findUserByLineId } from '@/lib/data/users';
import { grantCoins } from '@/lib/data/coins';
import { BRAND } from '@/lib/brand';

const KREWARD_SECRET = process.env.KREWARD_SECRET ?? '';
// 1 回の転送で付与できるコインの上限（環境変数で調整可）
const KREWARD_MAX_COINS = Number(process.env.KREWARD_MAX_COINS ?? 100000);

/** タイミング攻撃に耐性のある文字列比較 */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export async function POST(req: NextRequest) {
  // 内部シークレット認証（timing-safe）
  const secret = req.headers.get('x-kreward-secret') ?? '';
  if (!KREWARD_SECRET || !safeEqual(secret, KREWARD_SECRET)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: { line_user_id?: string; coins?: number; description?: string; transfer_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const { line_user_id, coins, description, transfer_id } = body;
  // 整数・正数・上限の厳格な検証（小数や巨大値・オーバーフローを拒否）
  if (
    !line_user_id ||
    typeof coins !== 'number' ||
    !Number.isInteger(coins) ||
    coins <= 0 ||
    coins > KREWARD_MAX_COINS
  ) {
    return NextResponse.json(
      { success: false, error: `line_user_id と 1〜${KREWARD_MAX_COINS} の整数 coins が必要です` },
      { status: 400 },
    );
  }

  const supabase = getServiceSupabase();
  const user = await findUserByLineId(supabase, line_user_id);
  if (!user) {
    return NextResponse.json(
      { success: false, error: `${BRAND.name}アカウントが見つかりません。${BRAND.name}にLINEログインしてください。` },
      { status: 404 },
    );
  }

  // 冪等性: transfer_id が指定されていれば、同一転送の二重付与(リトライ等)を防ぐ
  const marker = transfer_id ? ` [kreward:${transfer_id}]` : '';
  if (transfer_id) {
    const { data: dup } = await supabase
      .from('coin_transactions')
      .select('id')
      .eq('user_id', user.id as string)
      .ilike('description', `%[kreward:${transfer_id}]%`)
      .maybeSingle();
    if (dup) {
      return NextResponse.json({ success: true, duplicate: true });
    }
  }

  try {
    const newBalance = await grantCoins(
      supabase,
      user.id as string,
      coins,
      `${description ?? 'netkeita Kリワード転送'}${marker}`,
      'kreward',
    );
    return NextResponse.json({ success: true, new_balance: newBalance });
  } catch (e) {
    console.error('[kreward] grantCoins error:', e);
    return NextResponse.json({ success: false, error: 'コイン付与に失敗しました' }, { status: 500 });
  }
}
