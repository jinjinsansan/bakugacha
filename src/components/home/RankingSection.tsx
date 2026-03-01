import Link from 'next/link';
import { getServiceSupabase } from '@/lib/supabase/service';

export async function RankingSection() {
  const supabase = getServiceSupabase();

  const { data: results } = await supabase
    .from('gacha_results')
    .select('product_id')
    .limit(5000);

  if (!results?.length) return null;

  const counts = new Map<string, number>();
  for (const r of results) {
    counts.set(r.product_id, (counts.get(r.product_id) ?? 0) + 1);
  }

  const top5 = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (!top5.length) return null;

  const { data: products } = await supabase
    .from('gacha_products')
    .select('id, title, image_url, thumbnail_emoji, thumbnail_gradient')
    .in('id', top5.map(([id]) => id));

  const productMap = new Map((products ?? []).map((p) => [p.id, p]));

  const RANK_COLORS = ['text-yellow-300', 'text-zinc-300', 'text-amber-600', 'text-white/40', 'text-white/40'];

  return (
    <section className="px-4 py-6">
      <div className="max-w-[860px] w-full mx-auto">
        <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--gold)' }}>
          🔥 人気ランキング
        </h2>
        <div className="flex flex-col gap-2">
        {top5.map(([productId, count], i) => {
          const product = productMap.get(productId);
          if (!product) return null;
          return (
            <Link key={productId} href={`/gacha/${productId}`}>
              <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 hover:bg-white/10 transition-colors">
                <span className={`text-lg font-black w-6 text-center shrink-0 ${RANK_COLORS[i]}`}>
                  {i + 1}
                </span>
                <div
                  className="w-10 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center text-xl"
                  style={{ background: product.thumbnail_gradient ?? 'linear-gradient(135deg,#1a1a2e,#16213e)' }}
                >
                  {product.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    product.thumbnail_emoji ?? '🎰'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{product.title}</p>
                  <p className="text-xs text-white/40">{count.toLocaleString()} 回プレイ</p>
                </div>
              </div>
            </Link>
          );
        })}
        </div>
      </div>
    </section>
  );
}
