import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/service';

export const revalidate = 60;

export async function GET() {
  const supabase = getServiceSupabase();

  // SQL集計で取得（JS側での5000件フルスキャンを廃止）
  const { data: aggregated, error } = await supabase.rpc('get_ranking', { p_limit: 10 });

  if (error || !aggregated?.length) {
    return NextResponse.json([]);
  }

  const productIds = aggregated.map((r: { product_id: string }) => r.product_id);
  const { data: products } = await supabase
    .from('gacha_products')
    .select('id, title, image_url, thumbnail_emoji, thumbnail_gradient')
    .in('id', productIds);

  const productMap = new Map((products ?? []).map((p) => [p.id, p]));

  const ranking = aggregated.map((r: { product_id: string; play_count: number; win_count: number }, index: number) => {
    const p = productMap.get(r.product_id);
    return {
      rank: index + 1,
      productId: r.product_id,
      title: p?.title ?? '不明',
      imageUrl: p?.image_url ?? '',
      thumbnailEmoji: p?.thumbnail_emoji ?? '🎰',
      thumbnailGradient: p?.thumbnail_gradient ?? '',
      playCount: Number(r.play_count),
      winCount: Number(r.win_count),
    };
  });

  return NextResponse.json(ranking);
}
