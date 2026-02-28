import type { SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AppUser = Record<string, any>;

export async function findUserByEmail(
  client: SupabaseClient,
  email: string,
): Promise<AppUser | null> {
  const { data } = await client
    .from('app_users')
    .select('*')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();
  return data ?? null;
}

export async function findUserById(
  client: SupabaseClient,
  userId: string,
): Promise<AppUser | null> {
  const { data } = await client
    .from('app_users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  return data ?? null;
}

export async function createUser(
  client: SupabaseClient,
  payload: {
    email: string;
    passwordHash: string;
    displayName?: string;
    initialCoins?: number;
  },
): Promise<AppUser> {
  const now = new Date().toISOString();
  const { data, error } = await client
    .from('app_users')
    .insert({
      email: payload.email.trim().toLowerCase(),
      password_hash: payload.passwordHash,
      display_name: payload.displayName ?? null,
      coins: payload.initialCoins ?? 0,
      referral_code: randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase(),
      created_at: now,
      updated_at: now,
    })
    .select('*')
    .single();

  if (error || !data) throw error ?? new Error('ユーザー作成に失敗しました。');
  return data;
}

export async function updateCoins(
  client: SupabaseClient,
  userId: string,
  coins: number,
): Promise<void> {
  const { error } = await client
    .from('app_users')
    .update({ coins, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw error;
}

export async function touchLastLogin(
  client: SupabaseClient,
  userId: string,
): Promise<void> {
  await client
    .from('app_users')
    .update({ last_login_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', userId);
}
