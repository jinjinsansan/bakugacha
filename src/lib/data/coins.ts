import type { SupabaseClient } from '@supabase/supabase-js';

export async function grantCoins(
  client: SupabaseClient,
  userId: string,
  amount: number,
  description: string,
): Promise<number> {
  // 現在の残高取得
  const { data: user } = await client
    .from('app_users')
    .select('coins')
    .eq('id', userId)
    .single();

  const currentCoins = (user?.coins as number) ?? 0;
  const newBalance = currentCoins + amount;

  // コイン更新
  await client
    .from('app_users')
    .update({ coins: newBalance, updated_at: new Date().toISOString() })
    .eq('id', userId);

  // トランザクション記録
  await client.from('coin_transactions').insert({
    user_id: userId,
    type: 'bonus',
    amount,
    balance_after: newBalance,
    description,
  });

  return newBalance;
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
