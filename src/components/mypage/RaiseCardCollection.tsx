'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { RaiseDigitalCard } from '@/components/gacha/raise/RaiseDigitalCard';
import { downloadRaiseCardAsPng } from '@/lib/raise-gacha/card-download';
import { ALL_KENTA_CARDS } from '@/lib/raise-gacha/cards-kenta';
import { ALL_SHOICHI_CARDS } from '@/lib/raise-gacha/cards-shoichi';
import type { RaiseCardIssued, RaiseCharacterId, RaiseCardDef } from '@/lib/raise-gacha/types';

/** レアリティ順ソート用（高い順） */
const RARITY_ORDER: Record<string, number> = {
  LR: 0, UR: 1, SSR: 2, SR: 3, R: 4, N: 5,
};

type TabId = 'kenta' | 'shoichi';

interface CardGroup {
  cardId: string;
  characterId: string;
  cards: RaiseCardIssued[];
}

function getCardDefs(characterId: string): RaiseCardDef[] {
  return characterId === 'kenta' ? ALL_KENTA_CARDS : ALL_SHOICHI_CARDS;
}

function groupAndSort(cards: RaiseCardIssued[]): CardGroup[] {
  const map = new Map<string, RaiseCardIssued[]>();
  for (const c of cards) {
    const key = c.cardId;
    const arr = map.get(key) ?? [];
    arr.push(c);
    map.set(key, arr);
  }

  const groups: CardGroup[] = Array.from(map.entries()).map(([cardId, cards]) => ({
    cardId,
    characterId: cards[0].characterId,
    cards,
  }));

  const defs = getCardDefs(groups[0]?.characterId ?? 'kenta');
  const defMap = new Map(defs.map((d) => [d.cardId, d]));

  groups.sort((a, b) => {
    if (a.cardId === 'hazure') return 1;
    if (b.cardId === 'hazure') return -1;
    const da = defMap.get(a.cardId);
    const db = defMap.get(b.cardId);
    const ra = RARITY_ORDER[da?.rarity ?? 'N'] ?? 99;
    const rb = RARITY_ORDER[db?.rarity ?? 'N'] ?? 99;
    if (ra !== rb) return ra - rb;
    return (db?.starLevel ?? 0) - (da?.starLevel ?? 0);
  });

  return groups;
}

export function RaiseCardCollection() {
  const [cards, setCards] = useState<RaiseCardIssued[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('kenta');
  const [selected, setSelected] = useState<RaiseCardIssued | null>(null);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/raise-gacha/cards')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setCards(data.cards);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleClose = useCallback(() => setSelected(null), []);

  const handleDownload = useCallback(async () => {
    if (!cardRef.current || !selected || downloading) return;
    setDownloading(true);
    try {
      await downloadRaiseCardAsPng(cardRef.current, selected.serialNumber);
    } catch (e) {
      console.error('[card-download]', e);
    } finally {
      setDownloading(false);
    }
  }, [selected, downloading]);

  if (loading) {
    return (
      <div className="rounded-2xl overflow-hidden mb-6"
        style={{ background: '#0a0a1c', border: '1px solid rgba(123,104,238,0.25)' }}>
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="text-sm font-black text-white tracking-wider">🔮 来世ガチャ カードコレクション</h2>
        </div>
        <div className="px-5 py-8 text-center text-gray-600 text-sm">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white mx-auto" />
        </div>
      </div>
    );
  }

  const kentaCards = cards.filter((c) => c.characterId === 'kenta');
  const shoichiCards = cards.filter((c) => c.characterId === 'shoichi');
  const tabCards = activeTab === 'kenta' ? kentaCards : shoichiCards;
  const groups = groupAndSort(tabCards);
  const tabDefs = getCardDefs(activeTab);

  return (
    <>
      <div className="rounded-2xl overflow-hidden mb-6"
        style={{ background: '#0a0a1c', border: '1px solid rgba(123,104,238,0.25)' }}>
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="text-sm font-black text-white tracking-wider">
            🔮 来世ガチャ カードコレクション
            {cards.length > 0 && (
              <span className="ml-2 text-xs font-bold" style={{ color: '#9370db' }}>{cards.length}枚</span>
            )}
          </h2>
        </div>

        {/* タブ切り替え */}
        <div className="flex border-b border-white/5">
          {([
            { id: 'kenta' as TabId, label: '健太編', count: kentaCards.length },
            { id: 'shoichi' as TabId, label: '正一編', count: shoichiCards.length },
          ]).map((tab) => (
            <button
              key={tab.id}
              className={`flex-1 py-3 text-xs font-bold tracking-wider transition-colors ${
                activeTab === tab.id
                  ? 'text-white border-b-2'
                  : 'text-white/40 hover:text-white/60'
              }`}
              style={activeTab === tab.id ? { borderColor: '#9370db' } : undefined}
              onClick={() => {
                setActiveTab(tab.id);
                setExpandedCardId(null);
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1.5 text-[10px]" style={{ color: '#9370db' }}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {tabCards.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-600 text-sm">
            まだカードを持っていません。来世ガチャで当選するとカードが発行されます。
          </div>
        ) : (
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {groups.map((group) => {
              const isHazure = group.cardId === 'hazure';
              const def = tabDefs.find((d) => d.cardId === group.cardId);

              return (
                <div key={group.cardId} className="flex flex-col items-center gap-1">
                  {/* 代表カード + 枚数バッジ */}
                  <div className="relative w-full">
                    <div
                      className={`transition-opacity ${isHazure ? 'opacity-60' : ''}`}
                      style={isHazure ? { filter: 'brightness(0.7)' } : undefined}
                    >
                      <RaiseDigitalCard
                        characterId={activeTab as RaiseCharacterId}
                        cardId={group.cardId}
                        serialNumber={group.cards[0].serialNumber}
                        size="collection"
                        onClick={() => {
                          if (group.cards.length === 1) {
                            setSelected(group.cards[0]);
                          } else {
                            setExpandedCardId(expandedCardId === group.cardId ? null : group.cardId);
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
                          : 'linear-gradient(135deg, #7b68ee, #5a4fcf)',
                        color: isHazure ? '#aaa' : '#fff',
                        boxShadow: isHazure
                          ? '0 2px 8px rgba(0,0,0,0.5)'
                          : '0 2px 8px rgba(123,104,238,0.4)',
                      }}
                    >
                      ×{group.cards.length}
                    </div>
                  </div>

                  {/* カード名 + レアリティ */}
                  <p className={`text-[10px] font-bold tracking-wider ${isHazure ? 'text-white/30' : 'text-white/60'}`}>
                    {def?.name ?? group.cardId}
                    {def && !isHazure && (
                      <span className="ml-1" style={{ color: '#9370db' }}>{def.rarity}</span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 展開モーダル: 同種カードのシリアル一覧 */}
      {expandedCardId && (
        <div
          className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80"
          onClick={() => setExpandedCardId(null)}
        >
          <div
            className="relative max-w-md w-[90vw] max-h-[80vh] rounded-2xl overflow-hidden"
            style={{ background: '#0a0a1c', border: '1px solid rgba(123,104,238,0.3)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-sm font-black text-white tracking-wider">
                {tabDefs.find((d) => d.cardId === expandedCardId)?.name}
                <span className="ml-2 text-xs font-bold" style={{ color: '#9370db' }}>
                  {groups.find((g) => g.cardId === expandedCardId)?.cards.length}枚
                </span>
              </h3>
              <button
                className="text-white/40 hover:text-white text-lg"
                onClick={() => setExpandedCardId(null)}
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-60px)]">
              <div className="grid grid-cols-2 gap-3">
                {groups
                  .find((g) => g.cardId === expandedCardId)
                  ?.cards.map((card) => (
                    <div key={card.id} className="flex flex-col items-center gap-1">
                      <RaiseDigitalCard
                        characterId={card.characterId as RaiseCharacterId}
                        cardId={card.cardId}
                        serialNumber={card.serialNumber}
                        size="collection"
                        onClick={() => {
                          setExpandedCardId(null);
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
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80"
          onClick={handleClose}
        >
          <div className="flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
            <RaiseDigitalCard
              characterId={selected.characterId as RaiseCharacterId}
              cardId={selected.cardId}
              serialNumber={selected.serialNumber}
              size="full"
              cardRef={cardRef}
            />
            <p className="text-xs font-bold tracking-widest" style={{ color: '#9370db' }}>
              {selected.serialNumber}
            </p>
            <div className="flex gap-3">
              <button
                className="px-5 py-2 rounded-xl text-sm font-bold transition hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #7b68ee, #9370db)',
                  color: '#fff',
                  boxShadow: '0 4px 20px rgba(123,104,238,0.4)',
                }}
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? '保存中...' : 'PNGダウンロード'}
              </button>
              <button
                className="px-5 py-2 rounded-xl text-sm font-bold text-white/60 border border-white/20"
                onClick={handleClose}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
