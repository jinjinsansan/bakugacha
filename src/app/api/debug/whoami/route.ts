import { NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/data/session';
import { getServiceSupabase } from '@/lib/supabase/service';

export async function GET() {
  const supabase = getServiceSupabase();
  const user = await getUserFromSession(supabase);

  const adminLineIds = (process.env.ADMIN_LINE_IDS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const adminEmails  = (process.env.ADMIN_EMAILS ?? '').split(',').map((s) => s.trim()).filter(Boolean);

  if (!user) {
    return NextResponse.json({ loggedIn: false, isAdmin: false });
  }

  const lineId = user.line_user_id as string | null;
  const email  = user.email as string | null;
  const isAdmin = (!!lineId && adminLineIds.includes(lineId)) || (!!email && adminEmails.includes(email));

  return NextResponse.json({
    loggedIn: true,
    isAdmin,
    lineId: lineId ?? null,
    email: email ?? null,
    adminLineIdsCount: adminLineIds.length,
    lineIdInList: lineId ? adminLineIds.includes(lineId) : false,
  });
}
