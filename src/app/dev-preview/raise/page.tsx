'use client';

import { useState } from 'react';
import { RaiseDigitalCard } from '@/components/gacha/raise/RaiseDigitalCard';
import { ALL_KENTA_CARDS } from '@/lib/raise-gacha/cards-kenta';
import { ALL_SHOICHI_CARDS } from '@/lib/raise-gacha/cards-shoichi';
import type { RaiseCharacterId } from '@/lib/raise-gacha/types';

const CHARACTERS: { id: RaiseCharacterId; label: string }[] = [
  { id: 'kenta', label: '健太編' },
  { id: 'shoichi', label: '正一編' },
];

export default function RaisePreviewPage() {
  const [charaId, setCharaId] = useState<RaiseCharacterId>('kenta');
  const cards = charaId === 'kenta' ? ALL_KENTA_CARDS : ALL_SHOICHI_CARDS;
  const [selectedCard, setSelectedCard] = useState(cards[0].cardId);

  const handleCharaChange = (id: RaiseCharacterId) => {
    setCharaId(id);
    const newCards = id === 'kenta' ? ALL_KENTA_CARDS : ALL_SHOICHI_CARDS;
    setSelectedCard(newCards[0].cardId);
  };

  const def = cards.find((c) => c.cardId === selectedCard)!;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a14', color: '#fff', fontFamily: 'sans-serif' }}>

      {/* キャラクター切替 */}
      <div style={{ padding: '12px 20px', background: '#0d0d1a', borderBottom: '1px solid #222', display: 'flex', gap: 8 }}>
        {CHARACTERS.map((c) => (
          <button
            key={c.id}
            onClick={() => handleCharaChange(c.id)}
            style={{
              padding: '6px 20px', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none',
              background: charaId === c.id ? '#c9a84c' : '#2a2a2a',
              color: charaId === c.id ? '#000' : '#ccc',
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* カード選択 */}
      <div style={{ padding: '10px 20px', background: '#111', borderBottom: '1px solid #333', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {cards.map((c) => (
          <button
            key={c.cardId}
            onClick={() => setSelectedCard(c.cardId)}
            style={{
              padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none',
              background: selectedCard === c.cardId ? '#c9a84c' : '#2a2a2a',
              color: selectedCard === c.cardId ? '#000' : '#ccc',
            }}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* プレビュー */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '40px 20px', background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)', minHeight: 'calc(100vh - 110px)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>

          <p style={{ fontSize: 11, color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            来世ガチャ プレビュー — {charaId === 'kenta' ? '健太' : '正一'} / {def.name} ({def.rarity})
          </p>

          <RaiseDigitalCard
            characterId={charaId}
            cardId={selectedCard}
            serialNumber={`${charaId === 'kenta' ? 'RK' : 'RS'}${def.cardNumber}-0001`}
            size="full"
          />

          <p style={{ fontSize: 11, color: '#555', marginTop: 24 }}>collection サイズ</p>
          <RaiseDigitalCard
            characterId={charaId}
            cardId={selectedCard}
            size="collection"
          />
        </div>
      </div>
    </div>
  );
}
