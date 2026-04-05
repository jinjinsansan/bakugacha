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

export async function findUserByReferralCode(
  client: SupabaseClient,
  referralCode: string,
): Promise<AppUser | null> {
  const { data } = await client
    .from('app_users')
    .select('*')
    .eq('referral_code', referralCode.trim().toUpperCase())
    .maybeSingle();
  return data ?? null;
}

export async function findUserByLineId(
  client: SupabaseClient,
  lineUserId: string,
): Promise<AppUser | null> {
  const { data } = await client
    .from('app_users')
    .select('*')
    .eq('line_user_id', lineUserId)
    .maybeSingle();
  return data ?? null;
}

export async function createLineUser(
  client: SupabaseClient,
  payload: {
    lineUserId: string;
    displayName?: string;
    pictureUrl?: string;
    initialCoins?: number;
  },
): Promise<AppUser> {
  const now = new Date().toISOString();
  const { data, error } = await client
    .from('app_users')
    .insert({
      line_user_id: payload.lineUserId,
      line_display_name: payload.displayName ?? null,
      line_picture_url: payload.pictureUrl ?? null,
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

export async function isUserBlocked(
  client: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data } = await client
    .from('app_users')
    .select('is_blocked')
    .eq('id', userId)
    .maybeSingle();
  return data?.is_blocked === true;
}

export async function touchLastLogin(
  client: SupabaseClient,
  userId: string,
): Promise<void> {
  const now = new Date().toISOString();
  // UPDATE と INSERT を並列実行
  await Promise.all([
    client.from('app_users').update({ last_login_at: now, updated_at: now }).eq('id', userId),
    client.from('login_history').insert({ user_id: userId, logged_in_at: now }),
  ]);
}

/**
 * fire-and-forget 版: レスポンスをブロックせずに最終ログイン時刻と履歴を更新。
 * ログイン後のリダイレクトを高速化するために使用する。
 */
export function touchLastLoginFireAndForget(
  client: SupabaseClient,
  userId: string,
): void {
  const now = new Date().toISOString();
  Promise.all([
    client.from('app_users').update({ last_login_at: now, updated_at: now }).eq('id', userId),
    client.from('login_history').insert({ user_id: userId, logged_in_at: now }),
  ]).catch((err) => {
    console.warn('[touchLastLoginFireAndForget]', err);
  });
}

/**
 * セッションから user_id だけ取得する軽量版。
 * app_users のフルフェッチが不要な場面で使用。
 */
export async function getUserIdFromSessionToken(
  client: SupabaseClient,
  token: string,
): Promise<string | null> {
  const { data } = await client
    .from('sessions')
    .select('user_id, expires_at')
    .eq('token', token)
    .maybeSingle();

  if (!data) return null;
  if (new Date(data.expires_at as string) < new Date()) return null;
  return data.user_id as string;
}
