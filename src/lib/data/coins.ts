import type { SupabaseClient } from '@supabase/supabase-js';

// migration 035: grant_coins RPC で原子的に UPDATE coins = coins + amount を実行
export async function grantCoins(
  client: SupabaseClient,
  userId: string,
  amount: number,
  description: string,
  type: string = 'bonus',
): Promise<number> {
  const { data, error } = await client.rpc('grant_coins', {
    p_user_id:    userId,
    p_amount:     amount,
    p_description: description,
    p_type:       type,
  });

  if (error) {
    console.error('[grantCoins] rpc error:', error);
    throw new Error(`コイン付与に失敗しました: ${error.message}`);
  }

  const row = Array.isArray(data) ? data[0] : data;
  return Number(row?.new_balance ?? 0);
}

// NOTE: 旧 deductCoins() は非アトミック(TOCTOU)な死蔵コードだったため削除。
// コイン減算はすべて play_gacha RPC(FOR UPDATE で原子的)経由で行う。
