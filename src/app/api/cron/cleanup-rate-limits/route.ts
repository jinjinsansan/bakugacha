import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * rate_limit_buckets の期限切れ行を削除する (migration 020 の cleanup_rate_limits RPC)。
 *
 * Supabase の pg_cron (migration 033) が使えない環境向けのフォールバック。
 * vercel.json の crons から1時間ごとに呼ばれる。
 * Vercel Cron は CRON_SECRET を Authorization: Bearer で自動送信する。
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 503 });
  }
  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase.rpc('cleanup_rate_limits');
  if (error) {
    console.error('[cron] cleanup_rate_limits failed:', error);
    return NextResponse.json({ error: 'cleanup failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, deleted: data ?? null });
}
