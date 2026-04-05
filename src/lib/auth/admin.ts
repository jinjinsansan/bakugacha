import { redirect } from 'next/navigation';
import { getServiceSupabase } from '@/lib/supabase/service';
import { getUserFromSession } from '@/lib/data/session';

function matchesAdmin(user: Record<string, unknown> | null): boolean {
  if (!user) return false;
  const email = user.email as string | undefined;
  const lineId = user.line_user_id as string | undefined;
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim()).filter(Boolean);
  const adminLineIds = (process.env.ADMIN_LINE_IDS ?? '').split(',').map((e) => e.trim()).filter(Boolean);
  return (!!email && adminEmails.includes(email)) || (!!lineId && adminLineIds.includes(lineId));
}

/**
 * 現在のセッションユーザーが管理者かどうかを返す (リダイレクトしない)。
 * メンテナンスモード時のバイパス判定などで使用する。
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = getServiceSupabase();
  const user = await getUserFromSession(supabase);
  return matchesAdmin(user as Record<string, unknown> | null);
}

export async function requireAdmin(): Promise<Record<string, unknown>> {
  const supabase = getServiceSupabase();
  const user = await getUserFromSession(supabase);

  if (!user) {
    redirect('/login?from=/admin');
  }

  if (!matchesAdmin(user as Record<string, unknown>)) {
    redirect('/');
  }

  return user as Record<string, unknown>;
}
