import type { SupabaseClient } from '@supabase/supabase-js';
import type { RaiseCharacterId, RaiseCardIssued, RaiseSettings } from '@/lib/raise-gacha/types';
import { getCardDef } from '@/lib/raise-gacha/scenarios';

const SERIAL_PREFIX: Record<RaiseCharacterId, string> = {
  kenta: 'RK',
  shoichi: 'RS',
};

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
    .select('id, user_id, gacha_result_id, character_id, card_id, serial_number, serial_seq, card_number, rarity, star_level, issued_at')
    .single();

  if (error) {
    console.error('[raise-cards] issueRaiseCard failed:', error);
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    gachaResultId: data.gacha_result_id,
    characterId: data.character_id,
    cardId: data.card_id,
    serialNumber: data.serial_number,
    serialSeq: data.serial_seq,
    cardNumber: data.card_number,
    rarity: data.rarity,
    starLevel: data.star_level,
    issuedAt: data.issued_at,
  };
}

/** ユーザーのカード一覧を取得 */
export async function fetchUserRaiseCards(
  client: SupabaseClient,
  userId: string,
  characterId?: RaiseCharacterId,
): Promise<RaiseCardIssued[]> {
  let query = client
    .from('raise_cards')
    .select('id, user_id, gacha_result_id, character_id, card_id, serial_number, serial_seq, card_number, rarity, star_level, issued_at')
    .eq('user_id', userId)
    .order('issued_at', { ascending: false });

  if (characterId) {
    query = query.eq('character_id', characterId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[raise-cards] fetchUserRaiseCards failed:', error);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    gachaResultId: row.gacha_result_id,
    characterId: row.character_id,
    cardId: row.card_id,
    serialNumber: row.serial_number,
    serialSeq: row.serial_seq,
    cardNumber: row.card_number,
    rarity: row.rarity,
    starLevel: row.star_level,
    issuedAt: row.issued_at,
  }));
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
