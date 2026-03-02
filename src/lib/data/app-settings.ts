import type { SupabaseClient } from '@supabase/supabase-js';

const APP_SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

export interface AppSettings {
  id: string;
  referralBonusReferrer: number;
  referralBonusReferee: number;
  winnerDummyEnabled: boolean;
}

export async function fetchAppSettings(client: SupabaseClient): Promise<AppSettings> {
  const { data } = await client
    .from('app_settings')
    .select('*')
    .eq('id', APP_SETTINGS_ID)
    .maybeSingle();

  if (!data) {
    return { id: APP_SETTINGS_ID, referralBonusReferrer: 200, referralBonusReferee: 100, winnerDummyEnabled: false };
  }

  const row = data as Record<string, unknown>;
  return {
    id: String(row.id ?? APP_SETTINGS_ID),
    referralBonusReferrer: Number(row.referral_bonus_referrer ?? 200),
    referralBonusReferee: Number(row.referral_bonus_referee ?? 100),
    winnerDummyEnabled: Boolean(row.winner_dummy_enabled ?? false),
  };
}

export async function upsertAppSettings(
  client: SupabaseClient,
  updates: Partial<Omit<AppSettings, 'id'>>,
): Promise<void> {
  const patch: Record<string, unknown> = {
    id: APP_SETTINGS_ID,
    updated_at: new Date().toISOString(),
  };
  if (updates.referralBonusReferrer !== undefined) patch.referral_bonus_referrer = updates.referralBonusReferrer;
  if (updates.referralBonusReferee !== undefined) patch.referral_bonus_referee = updates.referralBonusReferee;
  if (updates.winnerDummyEnabled !== undefined) patch.winner_dummy_enabled = updates.winnerDummyEnabled;

  const { error } = await client.from('app_settings').upsert(patch, { onConflict: 'id' });
  if (error) {
    console.error('[app-settings] upsertAppSettings failed:', error);
    throw new Error(`設定の保存に失敗しました: ${error.message}`);
  }
}
