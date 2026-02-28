import type { SupabaseClient } from '@supabase/supabase-js';
import type { Cd2Settings } from '@/lib/cd2-gacha/types';

const CD2_SETTINGS_ID = '00000000-0000-0000-0000-000000000005';

export async function fetchCd2Settings(client: SupabaseClient): Promise<Cd2Settings> {
  const { data } = await client
    .from('cd2_gacha_settings')
    .select('*')
    .eq('id', CD2_SETTINGS_ID)
    .maybeSingle();

  if (!data) {
    return { id: CD2_SETTINGS_ID, isEnabled: true, lossRate: 60, dondenRate: 10, patliteRate: 5, freezeRate: 2 };
  }

  const row = data as Record<string, unknown>;
  return {
    id: String(row.id ?? CD2_SETTINGS_ID),
    isEnabled: Boolean(row.is_enabled),
    lossRate:   Number(row.loss_rate   ?? 60),
    dondenRate: Number(row.donden_rate ?? 10),
    patliteRate: Number(row.patlite_rate ?? 5),
    freezeRate: Number(row.freeze_rate ?? 2),
  };
}
