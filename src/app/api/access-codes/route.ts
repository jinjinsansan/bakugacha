export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/service';
import { getUserFromSession } from '@/lib/data/session';
import { fetchUnusedAccessCodes } from '@/lib/data/access-codes';

export async function GET() {
  const supabase = getServiceSupabase();
  const user = await getUserFromSession(supabase);
  if (!user) {
    return NextResponse.json({ success: false, error: 'ログインが必要です。' }, { status: 401 });
  }

  const codes = await fetchUnusedAccessCodes(supabase, user.id as string);
  return NextResponse.json({ success: true, codes });
}
