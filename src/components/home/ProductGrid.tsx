import { ProductCard } from './ProductCard';
import { fetchFeaturedProducts, fetchRegularProducts } from '@/lib/data/gacha';
import { getServiceSupabase } from '@/lib/supabase/service';

export async function ProductGrid() {
  const supabase = getServiceSupabase();
  const [featuredProducts, regularProducts] = await Promise.all([
    fetchFeaturedProducts(supabase),
    fetchRegularProducts(supabase),
  ]);

  const isEmpty = featuredProducts.length === 0 && regularProducts.length === 0;

  return (
    <div className="max-w-[860px] w-full mx-auto px-2 sm:px-4">
      {/* 空状態 */}
      {isEmpty && (
        <div className="py-16 text-center text-white/40 text-sm leading-relaxed">
          現在販売中のガチャはありません。
          <br />
          新しいガチャの登場をお楽しみに！
        </div>
      )}

      {/* 登録後限定セクション */}
      {featuredProducts.length > 0 && (
        <div
          className="relative mb-10 rounded-2xl overflow-hidden p-px"
          style={{ background: 'linear-gradient(135deg, rgba(255,46,154,0.5), rgba(56,210,255,0.3), rgba(255,46,154,0.2))' }}
        >
          <div className="rounded-2xl p-3 sm:p-6" style={{ background: '#06070f' }}>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="divider-gold flex-1" />
              <p className="text-xs font-black tracking-[0.3em] text-gold uppercase whitespace-nowrap">
                ✦ 登録後限定 Special Gacha ✦
              </p>
              <div className="divider-gold flex-1" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5">
              {featuredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 通常ガチャ */}
      {regularProducts.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="divider-gold flex-1" />
            <p className="text-xs font-black tracking-[0.3em] text-gold uppercase whitespace-nowrap">
              ✦ All Gacha ✦
            </p>
            <div className="divider-gold flex-1" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5">
            {regularProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
