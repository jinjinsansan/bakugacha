import type { SupabaseClient } from '@supabase/supabase-js';
import type { KeibaSettings } from '@/lib/keiba-gacha/types';

const KEIBA_SETTINGS_ID = '00000000-0000-0000-0000-000000000008';

const DEFAULT_COURSE_WIN_RATES: Record<string, number> = {
  '01': 60, '02': 45, '03': 35, '04': 25, '05': 15, '06': 70, '07': 75,
};
const DEFAULT_COURSE_APPEARANCE_RATES: Record<string, number> = {
  '01': 30, '02': 20, '03': 15, '04': 15, '05': 10, '06': 5, '07': 5,
};
const DEFAULT_CHARA_COURSE_BONUSES: Record<string, Record<string, number>> = {
  aoikaze:       { '01': 20, '07': -10 },
  darkbolt:      { '02': 20, '04': 20, '01': -10 },
  shirogane:     { '01': 10, '03': 10 },
  fuwarin:       { '*': -20 },
  bakugachahime: { '06': 10, '07': 10 },
};

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
      courseWinRates: DEFAULT_COURSE_WIN_RATES,
      courseAppearanceRates: DEFAULT_COURSE_APPEARANCE_RATES,
      charaRates: {},
      charaCourseBonuses: DEFAULT_CHARA_COURSE_BONUSES,
      umaoyajiWinRate: 95,
      bakugachahimeWinRate: 90,
      fuwarinWinRate: 20,
      chainLoseThreshold: 5,
      starHonestRate: 60,
      cardMaxIssuance: {},
      dontenRate: 20,
      dontenUpRate: 70,
      dontenDownRate: 20,
      dontenComedyRate: 10,
    };
  }

  const row = data as Record<string, unknown>;
  const parseJson = <T>(val: unknown, fallback: T): T => {
    if (val && typeof val === 'object') return val as T;
    return fallback;
  };

  return {
    id:                   String(row.id ?? KEIBA_SETTINGS_ID),
    isActive:             Boolean(row.is_active),
    courseWinRates:        parseJson(row.course_win_rates, DEFAULT_COURSE_WIN_RATES),
    courseAppearanceRates: parseJson(row.course_appearance_rates, DEFAULT_COURSE_APPEARANCE_RATES),
    charaRates:           parseJson(row.chara_rates, {}),
    charaCourseBonuses:   parseJson(row.chara_course_bonuses, DEFAULT_CHARA_COURSE_BONUSES),
    umaoyajiWinRate:      Number(row.umaoyaji_win_rate ?? 95),
    bakugachahimeWinRate: Number(row.bakugachahime_win_rate ?? 90),
    fuwarinWinRate:       Number(row.fuwarin_win_rate ?? 20),
    chainLoseThreshold:   Number(row.chain_lose_threshold ?? 5),
    starHonestRate:       Number(row.star_honest_rate ?? 60),
    cardMaxIssuance:      parseJson(row.card_max_issuance, {}),
    dontenRate:           Number(row.donten_rate ?? 20),
    dontenUpRate:         Number(row.donten_up_rate ?? 70),
    dontenDownRate:       Number(row.donten_down_rate ?? 20),
    dontenComedyRate:     Number(row.donten_comedy_rate ?? 10),
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
  if (updates.isActive              !== undefined) patch.is_active               = updates.isActive;
  if (updates.courseWinRates        !== undefined) patch.course_win_rates         = updates.courseWinRates;
  if (updates.courseAppearanceRates !== undefined) patch.course_appearance_rates  = updates.courseAppearanceRates;
  if (updates.charaRates            !== undefined) patch.chara_rates              = updates.charaRates;
  if (updates.charaCourseBonuses    !== undefined) patch.chara_course_bonuses     = updates.charaCourseBonuses;
  if (updates.umaoyajiWinRate       !== undefined) patch.umaoyaji_win_rate        = updates.umaoyajiWinRate;
  if (updates.bakugachahimeWinRate  !== undefined) patch.bakugachahime_win_rate   = updates.bakugachahimeWinRate;
  if (updates.fuwarinWinRate        !== undefined) patch.fuwarin_win_rate         = updates.fuwarinWinRate;
  if (updates.chainLoseThreshold    !== undefined) patch.chain_lose_threshold     = updates.chainLoseThreshold;
  if (updates.starHonestRate        !== undefined) patch.star_honest_rate         = updates.starHonestRate;
  if (updates.cardMaxIssuance       !== undefined) patch.card_max_issuance        = updates.cardMaxIssuance;
  if (updates.dontenRate            !== undefined) patch.donten_rate              = updates.dontenRate;
  if (updates.dontenUpRate          !== undefined) patch.donten_up_rate           = updates.dontenUpRate;
  if (updates.dontenDownRate        !== undefined) patch.donten_down_rate         = updates.dontenDownRate;
  if (updates.dontenComedyRate      !== undefined) patch.donten_comedy_rate       = updates.dontenComedyRate;

  const { error } = await client.from('keiba_settings').upsert(patch, { onConflict: 'id' });
  if (error) {
    console.error('[keiba-gacha] upsertKeibaSettings failed:', error);
    throw new Error(`設定の保存に失敗しました: ${error.message}`);
  }
}
