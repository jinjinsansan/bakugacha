import type { SupabaseClient } from '@supabase/supabase-js';
import type { ElevatorSettings } from '@/lib/elevator-gacha/types';

const ELEVATOR_SETTINGS_ID = '00000000-0000-0000-0000-000000000007';

export async function fetchElevatorSettings(client: SupabaseClient): Promise<ElevatorSettings> {
  const { data } = await client
    .from('elevator_settings')
    .select('*')
    .eq('id', ELEVATOR_SETTINGS_ID)
    .maybeSingle();

  if (!data) {
    return {
      id: ELEVATOR_SETTINGS_ID,
      isActive: true,
      winRate: 20,
      chainLoseThreshold: 3,
    };
  }

  const row = data as Record<string, unknown>;
  return {
    id:                 String(row.id ?? ELEVATOR_SETTINGS_ID),
    isActive:           Boolean(row.is_active),
    winRate:            Number(row.win_rate ?? 20),
    chainLoseThreshold: Number(row.chain_lose_threshold ?? 3),
  };
}

export async function upsertElevatorSettings(
  client: SupabaseClient,
  updates: Partial<Omit<ElevatorSettings, 'id'>>,
): Promise<void> {
  const patch: Record<string, unknown> = {
    id: ELEVATOR_SETTINGS_ID,
    updated_at: new Date().toISOString(),
  };
  if (updates.isActive           !== undefined) patch.is_active            = updates.isActive;
  if (updates.winRate            !== undefined) patch.win_rate             = updates.winRate;
  if (updates.chainLoseThreshold !== undefined) patch.chain_lose_threshold = updates.chainLoseThreshold;

  const { error } = await client.from('elevator_settings').upsert(patch, { onConflict: 'id' });
  if (error) {
    console.error('[elevator-gacha] upsertElevatorSettings failed:', error);
    throw new Error(`設定の保存に失敗しました: ${error.message}`);
  }
}
