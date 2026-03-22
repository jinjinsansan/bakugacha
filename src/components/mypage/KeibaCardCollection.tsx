'use client';

import { useCallback, useEffect, useState } from 'react';
import { KeibaDigitalCard } from '@/components/gacha/keiba/KeibaDigitalCard';
import { KeibaCardReveal } from '@/components/gacha/keiba/KeibaCardReveal';
import { ALL_KEIBA_CARDS } from '@/lib/keiba-gacha/cards';
import type { KeibaCardIssued } from '@/lib/keiba-gacha/types';

/** レアリティ順ソート用（高い順） */
const RARITY_ORDER: Record<string, number> = {
  rainbow: 0, gold: 1, silver: 2, bronze: 3, simple: 4,
};

interface CardGroup {
  charaId: string;
  cards: KeibaCardIssued[];
}

function groupAndSort(cards: KeibaCardIssued[]): CardGroup[] {
  const map = new Map<string, KeibaCardIssued[]>();
  for (const c of cards) {
    const arr = map.get(c.charaId) ?? [];
    arr.push(c);
    map.set(c.charaId, arr);
  }

  const groups: CardGroup[] = Array.from(map.entries()).map(([charaId, cards]) => ({ charaId, cards }));

  // レアリティ順ソート、ハズレは最後
  const defMap = new Map(ALL_KEIBA_CARDS.map((d) => [d.charaId, d]));
  groups.sort((a, b) => {
    const da = defMap.get(a.charaId);
    const db = defMap.get(b.charaId);
    if (a.charaId === 'hazure') return 1;
    if (b.charaId === 'hazure') return -1;
    const ra = RARITY_ORDER[da?.rarity ?? 'simple'] ?? 99;
    const rb = RARITY_ORDER[db?.rarity ?? 'simple'] ?? 99;
    return ra - rb;
  });

  return groups;
}

export function KeibaCardCollection() {
  const [cards, setCards] = useState<KeibaCardIssued[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<KeibaCardIssued | null>(null);
  const [expandedCharaId, setExpandedCharaId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/keiba-gacha/cards')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setCards(data.cards);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleClose = useCallback(() => setSelected(null), []);

  if (loading) {
    return (
      <div className="rounded-2xl overflow-hidden mb-6"
        style={{ background: '#0a0a1c', border: '1px solid rgba(201,168,76,0.25)' }}>
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="text-sm font-black text-white tracking-wider">🃏 カードコレクション</h2>
        </div>
        <div className="px-5 py-8 text-center text-gray-600 text-sm">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white mx-auto" />
        </div>
      </div>
    );
  }

  const groups = groupAndSort(cards);

  return (
    <>
      <div className="rounded-2xl overflow-hidden mb-6"
        style={{ background: '#0a0a1c', border: '1px solid rgba(201,168,76,0.25)' }}>
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="text-sm font-black text-white tracking-wider">
            🃏 競馬ガチャ カードコレクション
            {cards.length > 0 && (
              <span className="ml-2 text-xs font-bold text-gold">{cards.length}枚</span>
            )}
          </h2>
        </div>

        {cards.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-600 text-sm">
            まだカードを持っていません。競馬ガチャで当選するとカードが発行されます。
          </div>
        ) : (
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {groups.map((group) => {
              const isHazure = group.charaId === 'hazure';
              const isExpanded = expandedCharaId === group.charaId;

              return (
                <div key={group.charaId} className="flex flex-col items-center gap-1">
                  {/* 代表カード + 枚数バッジ */}
                  <div className="relative w-full">
                    <div
                      className={`transition-opacity ${isHazure ? 'opacity-60' : ''}`}
                      style={isHazure ? { filter: 'brightness(0.7)' } : undefined}
                    >
                      <KeibaDigitalCard
                        charaId={group.charaId}
                        serialNumber={group.cards[0].serialNumber}
                        size="collection"
                        onClick={() => {
                          if (group.cards.length === 1) {
                            setSelected(group.cards[0]);
                          } else {
                            setExpandedCharaId(isExpanded ? null : group.charaId);
                          }
                        }}
                      />
                    </div>
                    {/* 枚数バッジ */}
                    <div
                      className="absolute -top-2 -right-2 z-10 flex items-center justify-center rounded-full text-xs font-black min-w-[28px] h-7 px-1.5"
                      style={{
                        background: isHazure
                          ? 'linear-gradient(135deg, #555, #333)'
                          : 'linear-gradient(135deg, #c9a84c, #8a6e1e)',
                        color: isHazure ? '#aaa' : '#0a0800',
                        boxShadow: isHazure
                          ? '0 2px 8px rgba(0,0,0,0.5)'
                          : '0 2px 8px rgba(180,140,40,0.5)',
                      }}
                    >
                      ×{group.cards.length}
                    </div>
                  </div>

                  {/* カード名 */}
                  <p className={`text-[10px] font-bold tracking-wider ${isHazure ? 'text-white/30' : 'text-white/60'}`}>
                    {ALL_KEIBA_CARDS.find((d) => d.charaId === group.charaId)?.name ?? group.charaId}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 展開モーダル: 同種カードのシリアル一覧 */}
      {expandedCharaId && (
        <div
          className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80"
          onClick={() => setExpandedCharaId(null)}
        >
          <div
            className="relative max-w-md w-[90vw] max-h-[80vh] rounded-2xl overflow-hidden"
            style={{ background: '#0a0a1c', border: '1px solid rgba(201,168,76,0.3)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-sm font-black text-white tracking-wider">
                {ALL_KEIBA_CARDS.find((d) => d.charaId === expandedCharaId)?.name}
                <span className="ml-2 text-xs font-bold text-gold">
                  {groups.find((g) => g.charaId === expandedCharaId)?.cards.length}枚
                </span>
              </h3>
              <button
                className="text-white/40 hover:text-white text-lg"
                onClick={() => setExpandedCharaId(null)}
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-60px)]">
              <div className="grid grid-cols-2 gap-3">
                {groups
                  .find((g) => g.charaId === expandedCharaId)
                  ?.cards.map((card) => (
                    <div key={card.id} className="flex flex-col items-center gap-1">
                      <KeibaDigitalCard
                        charaId={card.charaId}
                        serialNumber={card.serialNumber}
                        size="collection"
                        onClick={() => {
                          setExpandedCharaId(null);
                          setSelected(card);
                        }}
                      />
                      <p className="text-[9px] text-white/40 font-bold tracking-wider">
                        {card.serialNumber}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* カード詳細モーダル */}
      {selected && (
        <KeibaCardReveal
          charaId={selected.charaId}
          serialNumber={selected.serialNumber}
          onClose={handleClose}
        />
      )}
    </>
  );
}
