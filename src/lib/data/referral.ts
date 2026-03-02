import type { SupabaseClient } from '@supabase/supabase-js';
import { findUserByReferralCode } from '@/lib/data/users';
import { fetchAppSettings } from '@/lib/data/app-settings';
import { grantCoins } from '@/lib/data/coins';

/**
 * 紹介コードを処理し、紹介者・被紹介者の両方にコインを付与する。
 * 新規ユーザー作成直後に呼び出す。
 */
export async function processReferral(
  client: SupabaseClient,
  newUserId: string,
  referralCode: string,
): Promise<void> {
  if (!referralCode) return;

  try {
    // 紹介者を検索
    const referrer = await findUserByReferralCode(client, referralCode);
    if (!referrer) return;

    // 自分自身の紹介コードでないか確認
    if (referrer.id === newUserId) return;

    // referred_by をセット
    await client
      .from('app_users')
      .update({ referred_by: referrer.id, updated_at: new Date().toISOString() })
      .eq('id', newUserId);

    // ボーナス額を取得
    const settings = await fetchAppSettings(client);

    // 紹介者にコイン付与
    if (settings.referralBonusReferrer > 0) {
      await grantCoins(client, referrer.id as string, settings.referralBonusReferrer, '友達紹介ボーナス');
    }

    // 被紹介者にコイン付与
    if (settings.referralBonusReferee > 0) {
      await grantCoins(client, newUserId, settings.referralBonusReferee, '紹介されたボーナス');
    }
  } catch (err) {
    // 紹介処理の失敗でユーザー登録自体を止めない
    console.error('[referral] processReferral failed:', err);
  }
}
