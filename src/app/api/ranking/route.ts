import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/service';

export async function GET() {
  const supabase = getServiceSupabase();

  const { data: results } = await supabase
    .from('gacha_results')
    .select('product_id, result')
    .limit(5000);

  if (!results?.length) {
    return NextResponse.json([]);
  }

  const playCounts = new Map<string, number>();
  const winCounts  = new Map<string, number>();
  for (const r of results) {
    playCounts.set(r.product_id, (playCounts.get(r.product_id) ?? 0) + 1);
    if (r.result === 'win') winCounts.set(r.product_id, (winCounts.get(r.product_id) ?? 0) + 1);
  }

  const top10 = Array.from(playCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (!top10.length) return NextResponse.json([]);

  const { data: products } = await supabase
    .from('gacha_products')
    .select('id, title, image_url, thumbnail_emoji, thumbnail_gradient')
    .in('id', top10.map(([id]) => id));

  const productMap = new Map((products ?? []).map((p) => [p.id, p]));

  const ranking = top10.map(([productId, playCount], index) => {
    const p = productMap.get(productId);
    return {
      rank: index + 1,
      productId,
      title: p?.title ?? '不明',
      imageUrl: p?.image_url ?? '',
      thumbnailEmoji: p?.thumbnail_emoji ?? '🎰',
      thumbnailGradient: p?.thumbnail_gradient ?? '',
      playCount,
      winCount: winCounts.get(productId) ?? 0,
    };
  });

  return NextResponse.json(ranking);
}
