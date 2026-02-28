import { ProductCard } from './ProductCard';
import { featuredProducts, regularProducts } from '@/lib/data/products';

export function ProductGrid() {
  return (
    <div className="max-w-[860px] w-full mx-auto px-4">
      {/* 登録後限定セクション */}
      <div
        className="relative mb-10 rounded-2xl overflow-hidden p-px"
        style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.5), rgba(32,96,240,0.3), rgba(201,168,76,0.2))' }}
      >
        <div className="rounded-2xl p-6" style={{ background: '#080820' }}>
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="divider-gold flex-1" />
            <p className="text-xs font-black tracking-[0.3em] text-gold uppercase whitespace-nowrap">
              ✦ 登録後限定 Special Gacha ✦
            </p>
            <div className="divider-gold flex-1" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {featuredProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </div>

      {/* 通常ガチャ */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="divider-gold flex-1" />
          <p className="text-xs font-black tracking-[0.3em] text-gold uppercase whitespace-nowrap">
            ✦ All Gacha ✦
          </p>
          <div className="divider-gold flex-1" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {regularProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </div>
  );
}
