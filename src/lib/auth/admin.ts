import { redirect } from 'next/navigation';
import { getServiceSupabase } from '@/lib/supabase/service';
import { getUserFromSession } from '@/lib/data/session';

export async function requireAdmin(): Promise<Record<string, unknown>> {
  const supabase = getServiceSupabase();
  const user = await getUserFromSession(supabase);

  if (!user) {
    redirect('/login?from=/admin');
  }

  const email = user.email as string | undefined;
  const lineId = user.line_user_id as string | undefined;
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim()).filter(Boolean);
  const adminLineIds = (process.env.ADMIN_LINE_IDS ?? '').split(',').map((e) => e.trim()).filter(Boolean);

  const isAdmin = (!!email && adminEmails.includes(email)) || (!!lineId && adminLineIds.includes(lineId));
  if (!isAdmin) {
    redirect('/home');
  }

  return user as Record<string, unknown>;
}
