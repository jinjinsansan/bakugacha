import type { SupabaseClient } from '@supabase/supabase-js';
import type { RaiseCharacterId, RaiseSettings } from '@/lib/raise-gacha/types';

const SETTINGS_IDS: Record<RaiseCharacterId, string> = {
  kenta: '00000000-0000-0000-0000-000000000010',
  shoichi: '00000000-0000-0000-0000-000000000011',
};

const TABLE_NAMES: Record<RaiseCharacterId, string> = {
  kenta: 'raise_kenta_settings',
  shoichi: 'raise_shoichi_settings',
};

const DEFAULT_STAR_DISTRIBUTION = [30, 25, 15, 10, 7, 5, 3, 2, 1.5, 0.5, 0.5, 0.5];

export async function fetchRaiseSettings(
  client: SupabaseClient,
  characterId: RaiseCharacterId,
): Promise<RaiseSettings> {
  const table = TABLE_NAMES[characterId];
  const settingsId = SETTINGS_IDS[characterId];

  const { data } = await client
    .from(table)
    .select('*')
    .eq('id', settingsId)
    .maybeSingle();

  if (!data) {
    return {
      id: settingsId,
      isActive: true,
      lossRate: 60,
      starDistribution: DEFAULT_STAR_DISTRIBUTION,
      dondenRate: 20,
      cardMaxIssuance: {},
    };
  }

  const row = data as Record<string, unknown>;
  const parseDist = (val: unknown): number[] => {
    if (Array.isArray(val)) return val.map(Number);
    if (typeof val === 'string') {
      try { return JSON.parse(val).map(Number); } catch { /* fall through */ }
    }
    return DEFAULT_STAR_DISTRIBUTION;
  };
  const parseJson = <T>(val: unknown, fallback: T): T => {
    if (val && typeof val === 'object') return val as T;
    return fallback;
  };

  return {
    id: String(row.id ?? settingsId),
    isActive: Boolean(row.is_active),
    lossRate: Number(row.loss_rate ?? 60),
    starDistribution: parseDist(row.star_distribution),
    dondenRate: Number(row.donden_rate ?? 20),
    cardMaxIssuance: parseJson(row.card_max_issuance, {}),
  };
}

export async function upsertRaiseSettings(
  client: SupabaseClient,
  characterId: RaiseCharacterId,
  updates: Partial<Omit<RaiseSettings, 'id'>>,
): Promise<void> {
  const table = TABLE_NAMES[characterId];
  const settingsId = SETTINGS_IDS[characterId];

  const patch: Record<string, unknown> = {
    id: settingsId,
    updated_at: new Date().toISOString(),
  };
  if (updates.isActive !== undefined)         patch.is_active = updates.isActive;
  if (updates.lossRate !== undefined)          patch.loss_rate = updates.lossRate;
  if (updates.starDistribution !== undefined)  patch.star_distribution = updates.starDistribution;
  if (updates.dondenRate !== undefined)        patch.donden_rate = updates.dondenRate;
  if (updates.cardMaxIssuance !== undefined)   patch.card_max_issuance = updates.cardMaxIssuance;

  const { error } = await client.from(table).upsert(patch, { onConflict: 'id' });
  if (error) {
    console.error(`[raise-gacha] upsertRaiseSettings(${characterId}) failed:`, error);
    throw new Error(`設定の保存に失敗しました: ${error.message}`);
  }
}
