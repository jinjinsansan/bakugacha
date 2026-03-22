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

  const defMap = new Map(ALL_KEIBA_CARDS.map((d) => [d.charaId, d]));
  groups.sort((a, b) => {
    if (a.charaId === 'hazure') return 1;
    if (b.charaId === 'hazure') return -1;
    const ra = RARITY_ORDER[defMap.get(a.charaId)?.rarity ?? 'simple'] ?? 99;
    const rb = RARITY_ORDER[defMap.get(b.charaId)?.rarity ?? 'simple'] ?? 99;
    return ra - rb;
  });

  return groups;
}

export function KeibaCardCollection() {
  const [cards, setCards] = useState<KeibaCardIssued[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<KeibaCardIssued | null>(null);
  const [expandedCharaId, setExpandedCharaId] = useState<string | null>(null);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [buybackCode, setBuybackCode] = useState<string | null>(null);
  const [confirmExchange, setConfirmExchange] = useState<KeibaCardIssued | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/keiba-gacha/cards').then((r) => r.json()),
      fetch('/api/cards/exchange-rates?type=keiba').then((r) => r.json()).catch(() => ({ rates: {} })),
    ]).then(([cardData, rateData]) => {
      if (cardData.success) setCards(cardData.cards);
      if (rateData.rates) setExchangeRates(rateData.rates);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleClose = useCallback(() => {
    setSelected(null);
    setBuybackCode(null);
  }, []);

  const handleBuyback = useCallback(async (card: KeibaCardIssued) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/cards/buyback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: card.id, cardType: 'keiba' }),
      });
      const data = await res.json();
      if (data.success) {
        setBuybackCode(data.buybackCode);
        setCards((prev) => prev.map((c) =>
          c.id === card.id ? { ...c, status: 'buyback_pending' as const, buybackCode: data.buybackCode } : c
        ));
        setSelected((prev) => prev?.id === card.id ? { ...prev, status: 'buyback_pending' as const, buybackCode: data.buybackCode } : prev);
      }
    } catch (e) { console.error(e); }
    finally { setActionLoading(false); }
  }, [actionLoading]);

  const handleCancelBuyback = useCallback(async (card: KeibaCardIssued) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/cards/buyback', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: card.id, cardType: 'keiba' }),
      });
      const data = await res.json();
      if (data.success) {
        setBuybackCode(null);
        setCards((prev) => prev.map((c) =>
          c.id === card.id ? { ...c, status: 'held' as const, buybackCode: null } : c
        ));
        setSelected((prev) => prev?.id === card.id ? { ...prev, status: 'held' as const, buybackCode: null } : prev);
      }
    } catch (e) { console.error(e); }
    finally { setActionLoading(false); }
  }, [actionLoading]);

  const handleExchange = useCallback(async (card: KeibaCardIssued) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/cards/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: card.id, cardType: 'keiba' }),
      });
      const data = await res.json();
      if (data.success) {
        setCards((prev) => prev.filter((c) => c.id !== card.id));
        setSelected(null);
        setConfirmExchange(null);
        alert(`${data.coins}コインを獲得しました！`);
      }
    } catch (e) { console.error(e); }
    finally { setActionLoading(false); }
  }, [actionLoading]);

  if (loading) {
    return (
      <div className="rounded-2xl overflow-hidden mb-6"
        style={{ background: '#0a0a1c', border: '1px solid rgba(201,168,76,0.25)' }}>
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="text-sm font-black text-white tracking-wider">🃏 競馬ガチャ カードコレクション</h2>
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
              const hasPending = group.cards.some((c) => c.status === 'buyback_pending');

              return (
                <div key={group.charaId} className="flex flex-col items-center gap-1">
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
                        background: isHazure ? 'linear-gradient(135deg, #555, #333)' : 'linear-gradient(135deg, #c9a84c, #8a6e1e)',
                        color: isHazure ? '#aaa' : '#0a0800',
                        boxShadow: isHazure ? '0 2px 8px rgba(0,0,0,0.5)' : '0 2px 8px rgba(180,140,40,0.5)',
                      }}
                    >
                      ×{group.cards.length}
                    </div>
                    {/* 買取申請中バッジ */}
                    {hasPending && (
                      <div className="absolute -top-2 -left-2 z-10 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-black">
                        買取申請中
                      </div>
                    )}
                  </div>
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
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80" onClick={() => setExpandedCharaId(null)}>
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
              <button className="text-white/40 hover:text-white text-lg" onClick={() => setExpandedCharaId(null)}>✕</button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-60px)]">
              <div className="grid grid-cols-2 gap-3">
                {groups.find((g) => g.charaId === expandedCharaId)?.cards.map((card) => (
                  <div key={card.id} className="flex flex-col items-center gap-1 relative">
                    {card.status === 'buyback_pending' && (
                      <div className="absolute -top-1 left-0 z-10 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-black">
                        買取申請中
                      </div>
                    )}
                    <KeibaDigitalCard
                      charaId={card.charaId}
                      serialNumber={card.serialNumber}
                      size="collection"
                      onClick={() => { setExpandedCharaId(null); setSelected(card); }}
                    />
                    <p className="text-[9px] text-white/40 font-bold tracking-wider">{card.serialNumber}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* カード詳細モーダル */}
      {selected && !confirmExchange && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/85" onClick={handleClose}>
          <div className="flex flex-col items-center gap-4 max-w-sm w-full px-4" onClick={(e) => e.stopPropagation()}>
            {/* 買取コード表示 */}
            {(selected.status === 'buyback_pending' && (buybackCode || selected.buybackCode)) && (
              <div className="w-full rounded-xl p-3 text-center" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)' }}>
                <p className="text-[10px] text-amber-400 mb-1">買取コード（買取サイトで使用）</p>
                <p
                  className="text-lg font-black text-amber-300 tracking-wider cursor-pointer select-all"
                  onClick={() => navigator.clipboard.writeText(buybackCode || selected.buybackCode || '')}
                  title="クリックでコピー"
                >
                  {buybackCode || selected.buybackCode}
                </p>
                <p className="text-[9px] text-amber-400/60 mt-1">タップでコピー</p>
              </div>
            )}

            <KeibaDigitalCard charaId={selected.charaId} serialNumber={selected.serialNumber} size="full" />

            <p className="text-xs font-bold tracking-widest text-gold">{selected.serialNumber}</p>

            {/* アクションボタン */}
            <div className="flex flex-wrap gap-2 justify-center w-full">
              {selected.status === 'held' && (
                <>
                  <button
                    className="px-4 py-2 rounded-xl text-xs font-bold transition hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #c9a84c, #8a6e1e)', color: '#0a0800' }}
                    onClick={() => {
                      const rate = exchangeRates[selected.charaId] ?? 0;
                      if (rate <= 0) { alert('このカードは交換できません。'); return; }
                      setConfirmExchange(selected);
                    }}
                  >
                    🪙 ポイント交換 {exchangeRates[selected.charaId] ? `(${exchangeRates[selected.charaId]}コイン)` : ''}
                  </button>
                  <button
                    className="px-4 py-2 rounded-xl text-xs font-bold transition hover:scale-105 bg-amber-600 text-black"
                    onClick={() => handleBuyback(selected)}
                    disabled={actionLoading}
                  >
                    {actionLoading ? '処理中...' : '📤 買取に出す'}
                  </button>
                </>
              )}
              {selected.status === 'buyback_pending' && (
                <button
                  className="px-4 py-2 rounded-xl text-xs font-bold transition hover:scale-105 border border-amber-500/40 text-amber-400"
                  onClick={() => handleCancelBuyback(selected)}
                  disabled={actionLoading}
                >
                  {actionLoading ? '処理中...' : '買取キャンセル'}
                </button>
              )}
              {selected.status === 'transferred' && (
                <span className="px-4 py-2 rounded-xl text-xs font-bold text-white/40 border border-white/10">譲渡済み</span>
              )}
              <button className="px-4 py-2 rounded-xl text-xs font-bold text-white/60 border border-white/20" onClick={handleClose}>
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ポイント交換確認ダイアログ */}
      {confirmExchange && (
        <div className="fixed inset-0 z-[350] flex items-center justify-center bg-black/90" onClick={() => setConfirmExchange(null)}>
          <div
            className="rounded-2xl p-6 max-w-sm w-[90vw] text-center"
            style={{ background: '#0a0a1c', border: '1px solid rgba(201,168,76,0.4)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-lg font-black text-white mb-2">ポイント交換</p>
            <p className="text-sm text-white/70 mb-4">
              「{ALL_KEIBA_CARDS.find((d) => d.charaId === confirmExchange.charaId)?.name}」を<br />
              <span className="text-gold font-black text-xl">{exchangeRates[confirmExchange.charaId] ?? 0}コイン</span><br />
              に交換しますか？
            </p>
            <p className="text-xs text-red-400 mb-4">※ この操作は元に戻せません</p>
            <div className="flex gap-3 justify-center">
              <button
                className="px-6 py-2 rounded-xl text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #c9a84c, #8a6e1e)', color: '#0a0800' }}
                onClick={() => handleExchange(confirmExchange)}
                disabled={actionLoading}
              >
                {actionLoading ? '処理中...' : '交換する'}
              </button>
              <button
                className="px-6 py-2 rounded-xl text-sm font-bold text-white/60 border border-white/20"
                onClick={() => setConfirmExchange(null)}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
