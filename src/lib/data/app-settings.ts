import type { SupabaseClient } from '@supabase/supabase-js';

const APP_SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

const DEFAULT_MAINTENANCE_TITLE = 'ただいまメンテナンス中です';
const DEFAULT_MAINTENANCE_MESSAGE =
  'より良いサービスをご提供するため、ただいまメンテナンスを実施しております。ご不便をおかけして申し訳ございません。';

export interface AppSettings {
  id: string;
  referralBonusReferrer: number;
  referralBonusReferee: number;
  winnerDummyEnabled: boolean;
  maintenanceMode: boolean;
  maintenanceTitle: string;
  maintenanceMessage: string;
  dailyLoginBonusAmount: number;
}

export async function fetchAppSettings(client: SupabaseClient): Promise<AppSettings> {
  const { data } = await client
    .from('app_settings')
    .select('*')
    .eq('id', APP_SETTINGS_ID)
    .maybeSingle();

  if (!data) {
    return {
      id: APP_SETTINGS_ID,
      referralBonusReferrer: 200,
      referralBonusReferee: 100,
      winnerDummyEnabled: true,
      maintenanceMode: false,
      maintenanceTitle: DEFAULT_MAINTENANCE_TITLE,
      maintenanceMessage: DEFAULT_MAINTENANCE_MESSAGE,
      dailyLoginBonusAmount: 0,
    };
  }

  const row = data as Record<string, unknown>;
  return {
    id: String(row.id ?? APP_SETTINGS_ID),
    referralBonusReferrer: Number(row.referral_bonus_referrer ?? 200),
    referralBonusReferee: Number(row.referral_bonus_referee ?? 100),
    winnerDummyEnabled: Boolean(row.winner_dummy_enabled ?? true),
    maintenanceMode: Boolean(row.maintenance_mode ?? false),
    maintenanceTitle: String(row.maintenance_title ?? DEFAULT_MAINTENANCE_TITLE),
    maintenanceMessage: String(row.maintenance_message ?? DEFAULT_MAINTENANCE_MESSAGE),
    dailyLoginBonusAmount: Number(row.daily_login_bonus_amount ?? 0),
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
  if (updates.maintenanceMode !== undefined) patch.maintenance_mode = updates.maintenanceMode;
  if (updates.maintenanceTitle !== undefined) patch.maintenance_title = updates.maintenanceTitle;
  if (updates.maintenanceMessage !== undefined) patch.maintenance_message = updates.maintenanceMessage;
  if (updates.dailyLoginBonusAmount !== undefined) patch.daily_login_bonus_amount = updates.dailyLoginBonusAmount;

  const { error } = await client.from('app_settings').upsert(patch, { onConflict: 'id' });
  if (error) {
    console.error('[app-settings] upsertAppSettings failed:', error);
    throw new Error(`設定の保存に失敗しました: ${error.message}`);
  }
}
