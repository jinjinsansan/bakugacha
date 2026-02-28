import type { SupabaseClient } from '@supabase/supabase-js';
import { getSessionToken } from '@/lib/session/cookie';

const SESSION_EXPIRE_DAYS = 90;

function expiresAt(): string {
  const d = new Date();
  d.setDate(d.getDate() + SESSION_EXPIRE_DAYS);
  return d.toISOString();
}

export async function createSession(
  client: SupabaseClient,
  token: string,
  userId: string,
): Promise<void> {
  const { error } = await client.from('sessions').insert({
    token,
    user_id: userId,
    expires_at: expiresAt(),
  });
  if (error) throw error;
}

export async function deleteSession(
  client: SupabaseClient,
  token: string,
): Promise<void> {
  await client.from('sessions').delete().eq('token', token);
}

export async function getUserFromSession(
  client: SupabaseClient,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<Record<string, any> | null> {
  const token = await getSessionToken();
  if (!token) return null;

  const { data: session } = await client
    .from('sessions')
    .select('user_id, expires_at')
    .eq('token', token)
    .maybeSingle();

  if (!session) return null;

  // 有効期限チェック
  if (new Date(session.expires_at) < new Date()) {
    await client.from('sessions').delete().eq('token', token);
    return null;
  }

  const { data: user } = await client
    .from('app_users')
    .select('*')
    .eq('id', session.user_id)
    .maybeSingle();

  return user ?? null;
}
