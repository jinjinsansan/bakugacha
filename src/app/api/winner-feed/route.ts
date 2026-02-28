import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/service';

function maskName(name: string): string {
  if (name.length <= 1) return name + '***';
  if (name.length <= 3) return name[0] + '***';
  return name.slice(0, 2) + '***';
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'たった今';
  if (mins < 60) return `${mins}分前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  return `${days}日前`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50);

  const supabase = getServiceSupabase();
  const { data } = await supabase
    .from('gacha_results')
    .select('id, prize_name, played_at, app_users(display_name, email), gacha_products(title)')
    .eq('result', 'win')
    .order('played_at', { ascending: false })
    .limit(limit);

  type UserRow = { display_name: string | null; email: string };
  type ProductRow = { title: string };

  const feed = (data ?? []).map((row) => {
    const uRaw = row.app_users as unknown;
    const u: UserRow | null = (Array.isArray(uRaw) ? uRaw[0] : uRaw) as UserRow | null;
    const pRaw = row.gacha_products as unknown;
    const p: ProductRow | null = (Array.isArray(pRaw) ? pRaw[0] : pRaw) as ProductRow | null;
    const rawName = u ? (u.display_name ?? u.email.split('@')[0]) : '???';
    return {
      id: row.id,
      displayName: maskName(rawName),
      productTitle: p?.title ?? '???',
      playedAt: row.played_at,
      timeAgo: timeAgo(row.played_at),
    };
  });

  return NextResponse.json(feed);
}
