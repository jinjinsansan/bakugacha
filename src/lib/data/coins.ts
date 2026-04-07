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

export async function deductCoins(
  client: SupabaseClient,
  userId: string,
  amount: number,
  description: string,
): Promise<number> {
  const { data: user } = await client
    .from('app_users')
    .select('coins')
    .eq('id', userId)
    .single();

  const currentCoins = (user?.coins as number) ?? 0;
  if (currentCoins < amount) {
    throw new Error('コインが不足しています。');
  }

  const newBalance = currentCoins - amount;

  await client
    .from('app_users')
    .update({ coins: newBalance, updated_at: new Date().toISOString() })
    .eq('id', userId);

  await client.from('coin_transactions').insert({
    user_id: userId,
    type: 'gacha',
    amount: -amount,
    balance_after: newBalance,
    description,
  });

  return newBalance;
}
