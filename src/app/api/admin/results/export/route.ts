import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/service';
import { isCurrentUserAdmin } from '@/lib/auth/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EXPORT_LIMIT = 10000;

function sinceFor(period: string): string | null {
  const now = Date.now();
  switch (period) {
    case '24h': return new Date(now - 24 * 60 * 60 * 1000).toISOString();
    case '7d': return new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    case '30d': return new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    default: return null;
  }
}

function csvCell(v: unknown): string {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function pick<T>(raw: unknown): T | null {
  return (Array.isArray(raw) ? raw[0] : raw) as T | null;
}

export async function GET(req: NextRequest) {
  // 管理者のみ
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const period = new URL(req.url).searchParams.get('period') ?? 'all';
  const since = sinceFor(period);
  const supabase = getServiceSupabase();

  let q = supabase
    .from('gacha_results')
    .select('played_at, result, prize_name, coins_spent, app_users(email), gacha_products(title)')
    .order('played_at', { ascending: false })
    .limit(EXPORT_LIMIT);
  if (since) q = q.gte('played_at', since);

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: 'export failed' }, { status: 500 });
  }

  const header = ['日時', '結果', '商品', '景品名', 'コスト', 'ユーザー'];
  const lines = [header.join(',')];
  for (const r of data ?? []) {
    const product = pick<{ title: string }>(r.gacha_products);
    const user = pick<{ email: string }>(r.app_users);
    lines.push([
      csvCell(r.played_at),
      csvCell(r.result === 'win' ? '当選' : 'ハズレ'),
      csvCell(product?.title ?? ''),
      csvCell(r.prize_name ?? ''),
      csvCell(r.coins_spent),
      csvCell(user?.email ?? ''),
    ].join(','));
  }

  // 先頭に BOM を付与（Excel での文字化け防止）
  const csv = '﻿' + lines.join('\r\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="results_${period}.csv"`,
    },
  });
}
