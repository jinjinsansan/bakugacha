import type { SupabaseClient } from '@supabase/supabase-js';
import type { KeibaCardIssued, KeibaSettings } from '@/lib/keiba-gacha/types';
import { KEIBA_CARD_MAP } from '@/lib/keiba-gacha/cards';

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
    .select('id, user_id, gacha_result_id, chara_id, serial_number, serial_seq, card_number, issued_at')
    .single();

  if (error) {
    console.error('[keiba-cards] issueCard failed:', error);
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    gachaResultId: data.gacha_result_id,
    charaId: data.chara_id,
    serialNumber: data.serial_number,
    serialSeq: data.serial_seq,
    cardNumber: data.card_number,
    issuedAt: data.issued_at,
  };
}

/** ユーザーのカード一覧を取得 */
export async function fetchUserCards(
  client: SupabaseClient,
  userId: string,
): Promise<KeibaCardIssued[]> {
  const { data, error } = await client
    .from('keiba_cards')
    .select('id, user_id, gacha_result_id, chara_id, serial_number, serial_seq, card_number, issued_at')
    .eq('user_id', userId)
    .order('issued_at', { ascending: false });

  if (error) {
    console.error('[keiba-cards] fetchUserCards failed:', error);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    gachaResultId: row.gacha_result_id,
    charaId: row.chara_id,
    serialNumber: row.serial_number,
    serialSeq: row.serial_seq,
    cardNumber: row.card_number,
    issuedAt: row.issued_at,
  }));
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
