import type { SupabaseClient } from '@supabase/supabase-js';
import type { KeibaSettings } from '@/lib/keiba-gacha/types';

const KEIBA_SETTINGS_ID = '00000000-0000-0000-0000-000000000008';

export async function fetchKeibaSettings(client: SupabaseClient): Promise<KeibaSettings> {
  const { data } = await client
    .from('keiba_settings')
    .select('*')
    .eq('id', KEIBA_SETTINGS_ID)
    .maybeSingle();

  if (!data) {
    return {
      id: KEIBA_SETTINGS_ID,
      isActive: true,
      winRate: 30,
      umaoyajiWinRate: 95,
      bakugachahimeWinRate: 90,
      fuwarinWinRate: 20,
      charaRates: {},
      courseRates: {},
      chainLoseThreshold: 5,
    };
  }

  const row = data as Record<string, unknown>;
  return {
    id:                   String(row.id ?? KEIBA_SETTINGS_ID),
    isActive:             Boolean(row.is_active),
    winRate:              Number(row.win_rate ?? 30),
    umaoyajiWinRate:      Number(row.umaoyaji_win_rate ?? 95),
    bakugachahimeWinRate: Number(row.bakugachahime_win_rate ?? 90),
    fuwarinWinRate:       Number(row.fuwarin_win_rate ?? 20),
    charaRates:           (row.chara_rates as Record<string, number>) ?? {},
    courseRates:           (row.course_rates as Record<string, number>) ?? {},
    chainLoseThreshold:   Number(row.chain_lose_threshold ?? 5),
  };
}

export async function upsertKeibaSettings(
  client: SupabaseClient,
  updates: Partial<Omit<KeibaSettings, 'id'>>,
): Promise<void> {
  const patch: Record<string, unknown> = {
    id: KEIBA_SETTINGS_ID,
    updated_at: new Date().toISOString(),
  };
  if (updates.isActive              !== undefined) patch.is_active              = updates.isActive;
  if (updates.winRate               !== undefined) patch.win_rate               = updates.winRate;
  if (updates.umaoyajiWinRate       !== undefined) patch.umaoyaji_win_rate      = updates.umaoyajiWinRate;
  if (updates.bakugachahimeWinRate   !== undefined) patch.bakugachahime_win_rate = updates.bakugachahimeWinRate;
  if (updates.fuwarinWinRate         !== undefined) patch.fuwarin_win_rate       = updates.fuwarinWinRate;
  if (updates.charaRates             !== undefined) patch.chara_rates            = updates.charaRates;
  if (updates.courseRates            !== undefined) patch.course_rates           = updates.courseRates;
  if (updates.chainLoseThreshold     !== undefined) patch.chain_lose_threshold   = updates.chainLoseThreshold;

  const { error } = await client.from('keiba_settings').upsert(patch, { onConflict: 'id' });
  if (error) {
    console.error('[keiba-gacha] upsertKeibaSettings failed:', error);
    throw new Error(`設定の保存に失敗しました: ${error.message}`);
  }
}
