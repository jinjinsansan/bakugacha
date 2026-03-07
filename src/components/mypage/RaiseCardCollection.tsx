'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { RaiseDigitalCard } from '@/components/gacha/raise/RaiseDigitalCard';
import { downloadRaiseCardAsPng } from '@/lib/raise-gacha/card-download';
import type { RaiseCardIssued, RaiseCharacterId } from '@/lib/raise-gacha/types';

export function RaiseCardCollection() {
  const [cards, setCards] = useState<RaiseCardIssued[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<RaiseCardIssued | null>(null);
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

        {cards.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-600 text-sm">
            まだカードを持っていません。来世ガチャで当選するとカードが発行されます。
          </div>
        ) : (
          <div className="p-4 grid gap-4"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))' }}>
            {cards.map((card) => (
              <div key={card.id} className="flex flex-col items-center gap-1">
                <RaiseDigitalCard
                  characterId={card.characterId as RaiseCharacterId}
                  cardId={card.cardId}
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
