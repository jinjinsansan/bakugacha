'use client';

import { useMemo, useState } from 'react';
import { ProductCard } from './ProductCard';
import { categories } from '@/lib/data/categories';
import type { Product } from '@/types/product';

// カテゴリ id → product.category に格納される日本語ラベル
const ID_TO_LABEL: Record<string, string> = {
  pokemon: 'ポケモン',
  onepiece: 'ワンピース',
  yugioh: '遊戯王',
  gift: 'ギフト券',
  game: 'ゲーム機',
};

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="divider-gold flex-1" />
      <p className="text-xs font-black tracking-[0.3em] text-gold uppercase whitespace-nowrap">{children}</p>
      <div className="divider-gold flex-1" />
    </div>
  );
}

export function ProductBrowser({ featured, regular }: { featured: Product[]; regular: Product[] }) {
  const [activeCat, setActiveCat] = useState('all');

  const all = useMemo(() => [...featured, ...regular], [featured, regular]);
  const isEmpty = all.length === 0;

  // 実際に商品が存在するカテゴリのみタブ表示（「すべて」は常時）
  const visibleCategories = useMemo(() => {
    const present = new Set(all.map((p) => p.category).filter(Boolean));
    return categories.filter((c) => c.id === 'all' || present.has(ID_TO_LABEL[c.id]));
  }, [all]);

  // フィルタ結果（「すべて」以外は featured も含めて該当カテゴリで絞り込み）
  const filtered = useMemo(() => {
    if (activeCat === 'all') return null;
    const label = ID_TO_LABEL[activeCat];
    return all.filter((p) => p.category === label);
  }, [activeCat, all]);

  if (isEmpty) {
    return (
      <div className="max-w-[860px] w-full mx-auto px-2 sm:px-4">
        <div className="py-16 text-center text-white/40 text-sm leading-relaxed">
          現在販売中のガチャはありません。
          <br />
          新しいガチャの登場をお楽しみに！
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[860px] w-full mx-auto px-2 sm:px-4">
      {/* ── カテゴリタブ（実フィルタ） ── */}
      <div
        role="tablist"
        aria-label="カテゴリで絞り込み"
        className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-6 -mx-2 px-2"
      >
        {visibleCategories.map((c) => {
          const active = activeCat === c.id;
          return (
            <button
              key={c.id}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => setActiveCat(c.id)}
              className="shrink-0 px-4 sm:px-5 py-2 rounded-full text-xs font-bold tracking-wide whitespace-nowrap transition-all duration-200"
              style={
                active
                  ? { color: '#fff', background: 'linear-gradient(135deg, #ff2e9a, #9a7bff)', boxShadow: '0 0 14px rgba(255,46,154,0.4)' }
                  : { color: '#a6aecb', background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.08)' }
              }
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* ── 「すべて」表示: 登録後限定（featured）＋ All Gacha（regular） ── */}
      {activeCat === 'all' ? (
        <>
          {featured.length > 0 && (
            <div
              className="relative mb-10 rounded-2xl overflow-hidden p-px"
              style={{ background: 'linear-gradient(135deg, rgba(255,46,154,0.5), rgba(56,210,255,0.3), rgba(255,46,154,0.2))' }}
            >
              <div className="rounded-2xl p-3 sm:p-6" style={{ background: '#06070f' }}>
                <SectionHeading>✦ 登録後限定 Special Gacha ✦</SectionHeading>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5">
                  {featured.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {regular.length > 0 && (
            <div className="mb-8">
              <SectionHeading>✦ All Gacha ✦</SectionHeading>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5">
                {regular.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        /* ── カテゴリ絞り込み表示 ── */
        <div className="mb-8">
          {filtered && filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-white/40 text-sm">
              このカテゴリのガチャは現在ありません。
            </div>
          )}
        </div>
      )}
    </div>
  );
}
