import type { SupabaseClient } from '@supabase/supabase-js';
import type { KeibaCardIssued, KeibaSettings } from '@/lib/keiba-gacha/types';
import { KEIBA_CARD_MAP } from '@/lib/keiba-gacha/cards';
import { grantCoins } from './coins';

const CARD_COLUMNS = 'id, user_id, gacha_result_id, chara_id, serial_number, serial_seq, card_number, issued_at, status, buyback_code';

/**
 * カード発行 + シリアル自動採番
 * 発行上限超過時は null を返す
 */
export async function issueCard(
  client: SupabaseClient,
  userId: string,
  charaId: string,
  gachaResultId: string | null,
  settings: KeibaSettings,
): Promise<KeibaCardIssued | null> {
  const def = KEIBA_CARD_MAP.get(charaId);
  if (!def) return null;

  // 発行上限チェック
  const maxIssuance = settings.cardMaxIssuance?.[charaId] ?? 0;
  if (maxIssuance > 0) {
    const { count } = await client
      .from('keiba_cards')
      .select('id', { count: 'exact', head: true })
      .eq('chara_id', charaId);
    if ((count ?? 0) >= maxIssuance) return null;
  }

  // 次のシリアル番号を取得
  const { data: maxRow } = await client
    .from('keiba_cards')
    .select('serial_seq')
    .eq('chara_id', charaId)
    .order('serial_seq', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSeq = ((maxRow?.serial_seq as number) ?? 0) + 1;
  const serialNumber = `KG24-${def.cardNumber}-${String(nextSeq).padStart(4, '0')}`;

  const { data, error } = await client
    .from('keiba_cards')
    .insert({
      user_id: userId,
      gacha_result_id: gachaResultId,
      chara_id: charaId,
      serial_number: serialNumber,
      serial_seq: nextSeq,
      card_number: def.cardNumber,
    })
    .select(CARD_COLUMNS)
    .single();

  if (error) {
    console.error('[keiba-cards] issueCard failed:', error);
    return null;
  }

  return mapRow(data);
}

/** ユーザーのカード一覧を取得（converted除外） */
export async function fetchUserCards(
  client: SupabaseClient,
  userId: string,
): Promise<KeibaCardIssued[]> {
  const { data, error } = await client
    .from('keiba_cards')
    .select(CARD_COLUMNS)
    .eq('user_id', userId)
    .neq('status', 'converted')
    .order('issued_at', { ascending: false });

  if (error) {
    console.error('[keiba-cards] fetchUserCards failed:', error);
    return [];
  }

  return (data ?? []).map(mapRow);
}

/** キャラ別発行数（管理画面用） */
export async function fetchCardIssuanceCounts(
  client: SupabaseClient,
): Promise<Record<string, number>> {
  const { data } = await client
    .from('keiba_cards')
    .select('chara_id');

  if (!data) return {};

  const counts: Record<string, number> = {};
  for (const row of data) {
    const cid = row.chara_id as string;
    counts[cid] = (counts[cid] ?? 0) + 1;
  }
  return counts;
}

/** 買取申請 */
export async function requestBuyback(
  client: SupabaseClient,
  cardId: string,
  userId: string,
): Promise<{ buybackCode: string } | null> {
  // カード所有権確認
  const { data: card } = await client
    .from('keiba_cards')
    .select('id, status')
    .eq('id', cardId)
    .eq('user_id', userId)
    .single();

  if (!card || card.status !== 'held') return null;

  const buybackCode = `BG-${generateCode(8)}`;

  const { error } = await client
    .from('keiba_cards')
    .update({
      status: 'buyback_pending',
      buyback_code: buybackCode,
      buyback_requested_at: new Date().toISOString(),
    })
    .eq('id', cardId);

  if (error) {
    console.error('[keiba-cards] requestBuyback failed:', error);
    return null;
  }

  return { buybackCode };
}

/** 買取キャンセル */
export async function cancelBuyback(
  client: SupabaseClient,
  cardId: string,
  userId: string,
): Promise<boolean> {
  const { error } = await client
    .from('keiba_cards')
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
export async function convertToCoins(
  client: SupabaseClient,
  cardId: string,
  userId: string,
  coins: number,
): Promise<boolean> {
  // カード所有権・ステータス確認
  const { data: card } = await client
    .from('keiba_cards')
    .select('id, status, chara_id')
    .eq('id', cardId)
    .eq('user_id', userId)
    .single();

  if (!card || card.status !== 'held') return false;

  const def = KEIBA_CARD_MAP.get(card.chara_id);
  const cardName = def?.name ?? card.chara_id;

  // カードを変換済みに
  const { error } = await client
    .from('keiba_cards')
    .update({
      status: 'converted',
      converted_at: new Date().toISOString(),
    })
    .eq('id', cardId);

  if (error) {
    console.error('[keiba-cards] convertToCoins failed:', error);
    return false;
  }

  // コイン付与
  await grantCoins(client, userId, coins, `カード交換: ${cardName}`);
  return true;
}

/** 外部検証用: シリアル+買取コードで検証 */
export async function verifyCard(
  client: SupabaseClient,
  serialNumber: string,
  buybackCode: string,
): Promise<{
  valid: boolean;
  charaId?: string;
  serialNumber?: string;
  status?: string;
} | null> {
  const { data } = await client
    .from('keiba_cards')
    .select('id, chara_id, serial_number, status, buyback_code')
    .eq('serial_number', serialNumber)
    .single();

  if (!data) return { valid: false };
  if (data.buyback_code !== buybackCode) return { valid: false };

  return {
    valid: true,
    charaId: data.chara_id,
    serialNumber: data.serial_number,
    status: data.status,
  };
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

function mapRow(row: Record<string, unknown>): KeibaCardIssued {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    gachaResultId: row.gacha_result_id as string | null,
    charaId: row.chara_id as string,
    serialNumber: row.serial_number as string,
    serialSeq: row.serial_seq as number,
    cardNumber: row.card_number as string,
    issuedAt: row.issued_at as string,
    status: (row.status as string as KeibaCardIssued['status']) ?? 'held',
    buybackCode: (row.buyback_code as string) ?? null,
  };
}
