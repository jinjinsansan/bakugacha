import type { SupabaseClient } from '@supabase/supabase-js';
import type { EcardSettings } from '@/lib/ecard-gacha/types';

const ECARD_SETTINGS_ID = '00000000-0000-0000-0000-000000000006';

export async function fetchEcardSettings(client: SupabaseClient): Promise<EcardSettings> {
  const { data } = await client
    .from('ecard_settings')
    .select('*')
    .eq('id', ECARD_SETTINGS_ID)
    .maybeSingle();

  if (!data) {
    return {
      id: ECARD_SETTINGS_ID,
      winRate: 40,
      axisARate: 20,
      axisBRate: 30,
      axisCRate: 15,
      axisDRate: 20,
      axisERate: 15,
      dontenRate: 15,
      star5Rate: 70,
      star4Rate: 60,
      isActive: true,
    };
  }

  const row = data as Record<string, unknown>;
  return {
    id: String(row.id ?? ECARD_SETTINGS_ID),
    winRate:    Number(row.win_rate    ?? 40),
    axisARate:  Number(row.axis_a_rate ?? 20),
    axisBRate:  Number(row.axis_b_rate ?? 30),
    axisCRate:  Number(row.axis_c_rate ?? 15),
    axisDRate:  Number(row.axis_d_rate ?? 20),
    axisERate:  Number(row.axis_e_rate ?? 15),
    dontenRate: Number(row.donten_rate ?? 15),
    star5Rate:  Number(row.star5_rate  ?? 70),
    star4Rate:  Number(row.star4_rate  ?? 60),
    isActive:   Boolean(row.is_active),
  };
}

export async function upsertEcardSettings(
  client: SupabaseClient,
  updates: Partial<Omit<EcardSettings, 'id'>>,
): Promise<void> {
  const patch: Record<string, unknown> = {
    id: ECARD_SETTINGS_ID,
    updated_at: new Date().toISOString(),
  };
  if (updates.winRate    !== undefined) patch.win_rate    = updates.winRate;
  if (updates.axisARate  !== undefined) patch.axis_a_rate = updates.axisARate;
  if (updates.axisBRate  !== undefined) patch.axis_b_rate = updates.axisBRate;
  if (updates.axisCRate  !== undefined) patch.axis_c_rate = updates.axisCRate;
  if (updates.axisDRate  !== undefined) patch.axis_d_rate = updates.axisDRate;
  if (updates.axisERate  !== undefined) patch.axis_e_rate = updates.axisERate;
  if (updates.dontenRate !== undefined) patch.donten_rate = updates.dontenRate;
  if (updates.star5Rate  !== undefined) patch.star5_rate  = updates.star5Rate;
  if (updates.star4Rate  !== undefined) patch.star4_rate  = updates.star4Rate;
  if (updates.isActive   !== undefined) patch.is_active   = updates.isActive;

  const { error } = await client.from('ecard_settings').upsert(patch, { onConflict: 'id' });
  if (error) {
    console.error('[ecard-gacha] upsertEcardSettings failed:', error);
    throw new Error(`設定の保存に失敗しました: ${error.message}`);
  }
}
