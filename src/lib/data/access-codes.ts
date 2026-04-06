import type { SupabaseClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

function generateCode(): string {
  return randomBytes(4).toString('hex').toUpperCase();
}

export interface GenerateAccessCodeParams {
  sourceProductId: string;
  targetProductId: string;
  winnerUserId: string;
  gachaResultId: string | null;
}

export async function generateAccessCode(
  client: SupabaseClient,
  params: GenerateAccessCodeParams,
): Promise<string> {
  let code = generateCode();
  let attempts = 0;

  while (attempts < 5) {
    const { error } = await client.from('gacha_access_codes').insert({
      code,
      source_product_id: params.sourceProductId,
      target_product_id: params.targetProductId,
      winner_user_id: params.winnerUserId,
      gacha_result_id: params.gachaResultId,
    });

    if (!error) return code;
    if (error.code === '23505') {
      code = generateCode();
      attempts++;
      continue;
    }
    throw new Error(`権利コード生成に失敗: ${error.message}`);
  }
  throw new Error('権利コード生成に失敗: ユニークなコードを生成できませんでした');
}

export type ValidateAccessCodeResult = {
  ok: true;
  codeId: string;
  code: string;
} | {
  ok: false;
  error: string;
}

export async function validateAndUseAccessCode(
  client: SupabaseClient,
  code: string,
  targetProductId: string,
  userId: string,
): Promise<ValidateAccessCodeResult> {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) return { ok: false, error: '権利コードを入力してください。' };

  const { data: row, error: fetchErr } = await client
    .from('gacha_access_codes')
    .select('id, code, target_product_id, is_used')
    .eq('code', trimmed)
    .maybeSingle();

  if (fetchErr || !row) {
    return { ok: false, error: '無効な権利コードです。' };
  }

  if (row.is_used) {
    return { ok: false, error: 'この権利コードは使用済みです。' };
  }

  if (row.target_product_id !== targetProductId) {
    return { ok: false, error: 'この権利コードはこの商品には使用できません。' };
  }

  const now = new Date().toISOString();
  const { data: updated, error: updateErr } = await client
    .from('gacha_access_codes')
    .update({ is_used: true, used_by_user_id: userId, used_at: now })
    .eq('id', row.id)
    .eq('is_used', false)
    .select('id')
    .maybeSingle();

  if (updateErr || !updated) {
    return { ok: false, error: 'この権利コードは既に使用されました。' };
  }

  return { ok: true, codeId: row.id, code: trimmed };
}

export interface AccessCodeForUser {
  id: string;
  code: string;
  targetProductId: string;
  targetProductTitle: string;
  isUsed: boolean;
  createdAt: string;
}

export async function fetchUnusedAccessCodes(
  client: SupabaseClient,
  userId: string,
): Promise<AccessCodeForUser[]> {
  const { data } = await client
    .from('gacha_access_codes')
    .select('id, code, target_product_id, is_used, created_at, gacha_products!gacha_access_codes_target_product_id_fkey(title)')
    .eq('winner_user_id', userId)
    .eq('is_used', false)
    .order('created_at', { ascending: false });

  if (!data) return [];

  return data.map((row: Record<string, unknown>) => {
    const target = row.gacha_products as Record<string, unknown> | null;
    return {
      id: row.id as string,
      code: row.code as string,
      targetProductId: row.target_product_id as string,
      targetProductTitle: (target?.title as string) ?? '不明',
      isUsed: row.is_used as boolean,
      createdAt: row.created_at as string,
    };
  });
}
