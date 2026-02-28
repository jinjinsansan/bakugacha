import { redirect } from 'next/navigation';
import { getServiceSupabase } from '@/lib/supabase/service';
import { getUserFromSession } from '@/lib/data/session';

export async function requireAdmin(): Promise<Record<string, unknown>> {
  const supabase = getServiceSupabase();
  const user = await getUserFromSession(supabase);

  if (!user) {
    redirect('/login?from=/admin');
  }

  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);

  if (!adminEmails.includes(user.email as string)) {
    redirect('/home');
  }

  return user as Record<string, unknown>;
}
