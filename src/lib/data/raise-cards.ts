import type { SupabaseClient } from '@supabase/supabase-js';
import type { RaiseCharacterId, RaiseCardIssued, RaiseSettings } from '@/lib/raise-gacha/types';
import { getCardDef } from '@/lib/raise-gacha/scenarios';
import { grantCoins } from './coins';

const SERIAL_PREFIX: Record<RaiseCharacterId, string> = {
  kenta: 'RK',
  shoichi: 'RS',
};

const CARD_COLUMNS = 'id, user_id, gacha_result_id, character_id, card_id, serial_number, serial_seq, card_number, rarity, star_level, issued_at, status, buyback_code';

/**
 * カード発行 + シリアル自動採番
 * シリアル: RK26-C01-0042 / RS26-C01-0042
 * 発行上限超過時は null を返す
 */
export async function issueRaiseCard(
  client: SupabaseClient,
  userId: string,
  characterId: RaiseCharacterId,
  cardId: string,
  gachaResultId: string | null,
  settings: RaiseSettings,
): Promise<RaiseCardIssued | null> {
  const def = getCardDef(characterId, cardId);
  if (!def) return null;

  // 発行上限チェック
  const maxIssuance = settings.cardMaxIssuance?.[cardId] ?? 0;
  if (maxIssuance > 0) {
    const { count } = await client
      .from('raise_cards')
      .select('id', { count: 'exact', head: true })
      .eq('character_id', characterId)
      .eq('card_id', cardId);
    if ((count ?? 0) >= maxIssuance) return null;
  }

  // 次のシリアル番号を取得
  const { data: maxRow } = await client
    .from('raise_cards')
    .select('serial_seq')
    .eq('character_id', characterId)
    .eq('card_id', cardId)
    .order('serial_seq', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSeq = ((maxRow?.serial_seq as number) ?? 0) + 1;
  const prefix = SERIAL_PREFIX[characterId];
  const serialNumber = `${prefix}26-${def.cardNumber}-${String(nextSeq).padStart(4, '0')}`;

  const { data, error } = await client
    .from('raise_cards')
    .insert({
      user_id: userId,
      gacha_result_id: gachaResultId,
      character_id: characterId,
      card_id: cardId,
      serial_number: serialNumber,
      serial_seq: nextSeq,
      card_number: def.cardNumber,
      rarity: def.rarity,
      star_level: def.starLevel,
    })
    .select(CARD_COLUMNS)
    .single();

  if (error) {
    console.error('[raise-cards] issueRaiseCard failed:', error);
    return null;
  }

  return mapRow(data);
}

/** ユーザーのカード一覧を取得（converted除外） */
export async function fetchUserRaiseCards(
  client: SupabaseClient,
  userId: string,
  characterId?: RaiseCharacterId,
): Promise<RaiseCardIssued[]> {
  let query = client
    .from('raise_cards')
    .select(CARD_COLUMNS)
    .eq('user_id', userId)
    .neq('status', 'converted')
    .order('issued_at', { ascending: false });

  if (characterId) {
    query = query.eq('character_id', characterId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[raise-cards] fetchUserRaiseCards failed:', error);
    return [];
  }

  return (data ?? []).map(mapRow);
}

/** カード別発行数（管理画面用） */
export async function fetchRaiseCardIssuanceCounts(
  client: SupabaseClient,
  characterId: RaiseCharacterId,
): Promise<Record<string, number>> {
  const { data } = await client
    .from('raise_cards')
    .select('card_id')
    .eq('character_id', characterId);

  if (!data) return {};

  const counts: Record<string, number> = {};
  for (const row of data) {
    const cid = row.card_id as string;
    counts[cid] = (counts[cid] ?? 0) + 1;
  }
  return counts;
}

/** 買取申請 */
export async function requestRaiseBuyback(
  client: SupabaseClient,
  cardId: string,
  userId: string,
): Promise<{ buybackCode: string } | null> {
  const { data: card } = await client
    .from('raise_cards')
    .select('id, status')
    .eq('id', cardId)
    .eq('user_id', userId)
    .single();

  if (!card || card.status !== 'held') return null;

  const buybackCode = `BG-${generateCode(8)}`;

  const { error } = await client
    .from('raise_cards')
    .update({
      status: 'buyback_pending',
      buyback_code: buybackCode,
      buyback_requested_at: new Date().toISOString(),
    })
    .eq('id', cardId);

  if (error) {
    console.error('[raise-cards] requestBuyback failed:', error);
    return null;
  }

  return { buybackCode };
}

/** 買取キャンセル */
export async function cancelRaiseBuyback(
  client: SupabaseClient,
  cardId: string,
  userId: string,
): Promise<boolean> {
  const { error } = await client
    .from('raise_cards')
    .update({
      status: 'held',
      buyback_code: null,
      buyback_requested_at: null,
    })
    .eq('id', cardId)
    .eq('user_id', userId)
    .eq('status', 'buyback_pending');

  return !error;
}

/** ポイント交換 */
export async function convertRaiseToCoins(
  client: SupabaseClient,
  cardId: string,
  userId: string,
  coins: number,
): Promise<boolean> {
  const { data: card } = await client
    .from('raise_cards')
    .select('id, status, character_id, card_id')
    .eq('id', cardId)
    .eq('user_id', userId)
    .single();

  if (!card || card.status !== 'held') return false;

  const def = getCardDef(card.character_id as RaiseCharacterId, card.card_id as string);
  const cardName = def?.name ?? card.card_id;

  const { error } = await client
    .from('raise_cards')
    .update({
      status: 'converted',
      converted_at: new Date().toISOString(),
    })
    .eq('id', cardId);

  if (error) {
    console.error('[raise-cards] convertToCoins failed:', error);
    return false;
  }

  await grantCoins(client, userId, coins, `カード交換: ${cardName}`);
  return true;
}

/** 外部検証用 */
export async function verifyRaiseCard(
  client: SupabaseClient,
  serialNumber: string,
  buybackCode: string,
): Promise<{
  valid: boolean;
  characterId?: string;
  cardId?: string;
  rarity?: string;
  serialNumber?: string;
  status?: string;
} | null> {
  const { data } = await client
    .from('raise_cards')
    .select('id, character_id, card_id, rarity, serial_number, status, buyback_code')
    .eq('serial_number', serialNumber)
    .single();

  if (!data) return { valid: false };
  if (data.buyback_code !== buybackCode) return { valid: false };

  return {
    valid: true,
    characterId: data.character_id,
    cardId: data.card_id,
    rarity: data.rarity,
    serialNumber: data.serial_number,
    status: data.status,
  };
}

// ── 交換レート ────────────────────────────────────────────────

export async function fetchExchangeRates(
  client: SupabaseClient,
  gachaType: string,
): Promise<Record<string, number>> {
  const { data } = await client
    .from('card_exchange_rates')
    .select('card_id, exchange_coins')
    .eq('gacha_type', gachaType);

  if (!data) return {};
  const rates: Record<string, number> = {};
  for (const row of data) {
    rates[row.card_id as string] = row.exchange_coins as number;
  }
  return rates;
}

export async function upsertExchangeRates(
  client: SupabaseClient,
  gachaType: string,
  rates: Record<string, number>,
): Promise<void> {
  const rows = Object.entries(rates).map(([cardId, coins]) => ({
    gacha_type: gachaType,
    card_id: cardId,
    exchange_coins: coins,
  }));

  if (rows.length === 0) return;

  const { error } = await client
    .from('card_exchange_rates')
    .upsert(rows, { onConflict: 'gacha_type,card_id' });

  if (error) {
    console.error('[exchange-rates] upsert failed:', error);
    throw error;
  }
}

// ── ヘルパー ──────────────────────────────────────────────────

function generateCode(length: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function mapRow(row: Record<string, unknown>): RaiseCardIssued {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    gachaResultId: row.gacha_result_id as string | null,
    characterId: row.character_id as string,
    cardId: row.card_id as string,
    serialNumber: row.serial_number as string,
    serialSeq: row.serial_seq as number,
    cardNumber: row.card_number as string,
    rarity: row.rarity as string,
    starLevel: row.star_level as number,
    issuedAt: row.issued_at as string,
    status: (row.status as string as RaiseCardIssued['status']) ?? 'held',
    buybackCode: (row.buyback_code as string) ?? null,
  };
}
