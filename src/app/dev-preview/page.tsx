'use client';

import { useState } from 'react';
import { KeibaDigitalCard } from '@/components/gacha/keiba/KeibaDigitalCard';
import { ALL_KEIBA_CARDS } from '@/lib/keiba-gacha/cards';

const CHARA_IDS = ALL_KEIBA_CARDS.map((c) => c.charaId);

export default function DevPreviewPage() {
  const [selected, setSelected] = useState(CHARA_IDS[1]); // デフォルト: shirogane

  const def = ALL_KEIBA_CARDS.find((c) => c.charaId === selected)!;
  const dummySerial = `KG24-${def.cardNumber}-0001`;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a14', color: '#fff', fontFamily: 'sans-serif' }}>

      {/* セレクター */}
      <div style={{ padding: '16px 20px', background: '#111', borderBottom: '1px solid #333', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {ALL_KEIBA_CARDS.map((c) => (
          <button
            key={c.charaId}
            onClick={() => setSelected(c.charaId)}
            style={{
              padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none',
              background: selected === c.charaId ? '#c9a84c' : '#2a2a2a',
              color: selected === c.charaId ? '#000' : '#ccc',
            }}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* 結果画面の再現（実際の ResultCard + EmbeddedCard と同じ背景） */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '40px 20px', background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)', minHeight: 'calc(100vh - 60px)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>

          <p style={{ fontSize: 11, color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            競馬ガチャ カードプレビュー — {def.name} ({def.rarity.toUpperCase()})
          </p>

          {/* カード本体 */}
          <KeibaDigitalCard
            charaId={selected}
            serialNumber={dummySerial}
            size="full"
          />

          {/* シリアル表示 */}
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', color: '#c9a84c' }}>
            {dummySerial}
          </p>

          {/* コレクションサイズ比較 */}
          <p style={{ fontSize: 11, color: '#555', marginTop: 24 }}>collection サイズ</p>
          <KeibaDigitalCard
            charaId={selected}
            serialNumber={dummySerial}
            size="collection"
          />
        </div>
      </div>
    </div>
  );
}
