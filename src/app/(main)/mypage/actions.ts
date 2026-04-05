'use server';

import { revalidatePath } from 'next/cache';
import { getServiceSupabase } from '@/lib/supabase/service';
import { getUserFromSession } from '@/lib/data/session';
import { fetchAppSettings } from '@/lib/data/app-settings';

// JSTで日付 (YYYY-MM-DD) を取得
function getJstDateString(date: Date): string {
  const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

export type DailyBonusResult =
  | { ok: true; amount: number; newBalance: number }
  | { ok: false; error: string };

export async function claimDailyLoginBonus(): Promise<DailyBonusResult> {
  const supabase = getServiceSupabase();

  const user = await getUserFromSession(supabase);
  if (!user) {
    return { ok: false, error: 'ログインが必要です。' };
  }

  const settings = await fetchAppSettings(supabase);
  const amount = settings.dailyLoginBonusAmount;

  if (amount <= 0) {
    return { ok: false, error: '現在ログインボーナスは実施していません。' };
  }

  const todayJst = getJstDateString(new Date());
  const lastAt = user.last_login_bonus_at as string | null;
  const lastJst = lastAt ? getJstDateString(new Date(lastAt)) : null;

  if (lastJst === todayJst) {
    return { ok: false, error: '本日のログインボーナスは既に受け取り済みです。' };
  }

  // 原子的な更新: 同じ日に受け取り済みでないことを再確認
  const nowIso = new Date().toISOString();
  const currentCoins = Number(user.coins ?? 0);
  const newBalance = currentCoins + amount;

  // last_login_bonus_at が user の値と一致している場合のみ更新 (optimistic lock)
  const { data: updated, error: updateError } = await supabase
    .from('app_users')
    .update({
      coins: newBalance,
      last_login_bonus_at: nowIso,
      updated_at: nowIso,
    })
    .eq('id', user.id as string)
    .or(lastAt ? `last_login_bonus_at.eq.${lastAt}` : 'last_login_bonus_at.is.null')
    .select('id')
    .maybeSingle();

  if (updateError) {
    console.error('[claimDailyLoginBonus] update failed:', updateError);
    return { ok: false, error: 'ログインボーナスの付与に失敗しました。' };
  }

  if (!updated) {
    // 競合: 既に別のリクエストで受け取り済み
    return { ok: false, error: '本日のログインボーナスは既に受け取り済みです。' };
  }

  await supabase.from('coin_transactions').insert({
    user_id: user.id as string,
    type: 'daily_login',
    amount,
    balance_after: newBalance,
    description: `デイリーログインボーナス (+${amount})`,
  });

  revalidatePath('/mypage');
  return { ok: true, amount, newBalance };
}

// ── プロモコード引換 ─────────────────────────────────────────
export type PromoRedeemResult =
  | { ok: true; amount: number; newBalance: number }
  | { ok: false; error: string };

const PROMO_ERROR_MESSAGES: Record<string, string> = {
  NOT_FOUND: '無効なプロモコードです。',
  INACTIVE: 'このプロモコードは現在利用できません。',
  EXPIRED: 'このプロモコードは有効期限が切れています。',
  LIMIT_REACHED: 'このプロモコードは利用上限に達しました。',
  ALREADY_REDEEMED: 'このプロモコードは既に利用済みです。',
  USER_NOT_FOUND: 'ユーザー情報の取得に失敗しました。',
};

export async function redeemPromoCode(code: string): Promise<PromoRedeemResult> {
  const supabase = getServiceSupabase();

  const user = await getUserFromSession(supabase);
  if (!user) {
    return { ok: false, error: 'ログインが必要です。' };
  }

  const trimmed = code.trim();
  if (!trimmed) {
    return { ok: false, error: 'プロモコードを入力してください。' };
  }

  const { data, error } = await supabase.rpc('redeem_promo_code', {
    p_user_id: user.id as string,
    p_code: trimmed,
  });

  if (error) {
    console.error('[redeemPromoCode] rpc error:', error);
    return { ok: false, error: 'プロモコードの引換に失敗しました。' };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return { ok: false, error: 'プロモコードの引換に失敗しました。' };
  }

  if (!row.success) {
    const code = String(row.error_code ?? '');
    return {
      ok: false,
      error: PROMO_ERROR_MESSAGES[code] ?? 'プロモコードの引換に失敗しました。',
    };
  }

  revalidatePath('/mypage');
  return {
    ok: true,
    amount: Number(row.coin_amount ?? 0),
    newBalance: Number(row.new_balance ?? 0),
  };
}
