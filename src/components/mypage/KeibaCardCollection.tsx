'use client';

import { useCallback, useEffect, useState } from 'react';
import { KeibaDigitalCard } from '@/components/gacha/keiba/KeibaDigitalCard';
import { KeibaCardReveal } from '@/components/gacha/keiba/KeibaCardReveal';
import type { KeibaCardIssued } from '@/lib/keiba-gacha/types';

export function KeibaCardCollection() {
  const [cards, setCards] = useState<KeibaCardIssued[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<KeibaCardIssued | null>(null);

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

  return (
    <>
      <div className="rounded-2xl overflow-hidden mb-6"
        style={{ background: '#0a0a1c', border: '1px solid rgba(201,168,76,0.25)' }}>
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="text-sm font-black text-white tracking-wider">
            🃏 カードコレクション
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
          <div className="p-4 grid gap-4"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))' }}>
            {cards.map((card) => (
              <div key={card.id} className="flex flex-col items-center gap-1">
                <KeibaDigitalCard
                  charaId={card.charaId}
                  serialNumber={card.serialNumber}
                  size="collection"
                  onClick={() => setSelected(card)}
                />
                <p className="text-[9px] text-white/40 font-bold tracking-wider">
                  {card.serialNumber}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

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
