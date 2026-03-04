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
      dontenRate: 15,
      minFloors: 3,
      maxFloors: 6,
      floorRangeMin: 1,
      floorRangeMax: 100,
      bossFloorRate: 20,
      countdownFloorRate: 15,
      multidoorFloorRate: 10,
      chaosFloorRate: 10,
      reverseFloorRate: 10,
      star5Rate: 70,
      star4Rate: 60,
      countdownSeconds: 5,
      chainLoseThreshold: 3,
    };
  }

  const row = data as Record<string, unknown>;
  return {
    id: String(row.id ?? ELEVATOR_SETTINGS_ID),
    isActive:           Boolean(row.is_active),
    winRate:            Number(row.win_rate            ?? 20),
    dontenRate:         Number(row.donten_rate         ?? 15),
    minFloors:          Number(row.min_floors          ?? 3),
    maxFloors:          Number(row.max_floors          ?? 6),
    floorRangeMin:      Number(row.floor_range_min     ?? 1),
    floorRangeMax:      Number(row.floor_range_max     ?? 100),
    bossFloorRate:      Number(row.boss_floor_rate     ?? 20),
    countdownFloorRate: Number(row.countdown_floor_rate ?? 15),
    multidoorFloorRate: Number(row.multidoor_floor_rate ?? 10),
    chaosFloorRate:     Number(row.chaos_floor_rate    ?? 10),
    reverseFloorRate:   Number(row.reverse_floor_rate  ?? 10),
    star5Rate:          Number(row.star5_rate          ?? 70),
    star4Rate:          Number(row.star4_rate          ?? 60),
    countdownSeconds:   Number(row.countdown_seconds   ?? 5),
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
  if (updates.dontenRate         !== undefined) patch.donten_rate          = updates.dontenRate;
  if (updates.minFloors          !== undefined) patch.min_floors           = updates.minFloors;
  if (updates.maxFloors          !== undefined) patch.max_floors           = updates.maxFloors;
  if (updates.floorRangeMin      !== undefined) patch.floor_range_min      = updates.floorRangeMin;
  if (updates.floorRangeMax      !== undefined) patch.floor_range_max      = updates.floorRangeMax;
  if (updates.bossFloorRate      !== undefined) patch.boss_floor_rate      = updates.bossFloorRate;
  if (updates.countdownFloorRate !== undefined) patch.countdown_floor_rate = updates.countdownFloorRate;
  if (updates.multidoorFloorRate !== undefined) patch.multidoor_floor_rate = updates.multidoorFloorRate;
  if (updates.chaosFloorRate     !== undefined) patch.chaos_floor_rate     = updates.chaosFloorRate;
  if (updates.reverseFloorRate   !== undefined) patch.reverse_floor_rate   = updates.reverseFloorRate;
  if (updates.star5Rate          !== undefined) patch.star5_rate           = updates.star5Rate;
  if (updates.star4Rate          !== undefined) patch.star4_rate           = updates.star4Rate;
  if (updates.countdownSeconds   !== undefined) patch.countdown_seconds    = updates.countdownSeconds;
  if (updates.chainLoseThreshold !== undefined) patch.chain_lose_threshold = updates.chainLoseThreshold;

  const { error } = await client.from('elevator_settings').upsert(patch, { onConflict: 'id' });
  if (error) {
    console.error('[elevator-gacha] upsertElevatorSettings failed:', error);
    throw new Error(`設定の保存に失敗しました: ${error.message}`);
  }
}
