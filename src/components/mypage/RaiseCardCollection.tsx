'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { RaiseDigitalCard } from '@/components/gacha/raise/RaiseDigitalCard';
import { downloadRaiseCardAsPng } from '@/lib/raise-gacha/card-download';
import { ALL_KENTA_CARDS } from '@/lib/raise-gacha/cards-kenta';
import { ALL_SHOICHI_CARDS } from '@/lib/raise-gacha/cards-shoichi';
import type { RaiseCardIssued, RaiseCharacterId, RaiseCardDef } from '@/lib/raise-gacha/types';

const RARITY_ORDER: Record<string, number> = { LR: 0, UR: 1, SSR: 2, SR: 3, R: 4, N: 5 };

type TabId = 'kenta' | 'shoichi';

interface CardGroup { cardId: string; characterId: string; cards: RaiseCardIssued[]; }

function getCardDefs(characterId: string): RaiseCardDef[] {
  return characterId === 'kenta' ? ALL_KENTA_CARDS : ALL_SHOICHI_CARDS;
}

function groupAndSort(cards: RaiseCardIssued[]): CardGroup[] {
  const map = new Map<string, RaiseCardIssued[]>();
  for (const c of cards) { const arr = map.get(c.cardId) ?? []; arr.push(c); map.set(c.cardId, arr); }
  const groups: CardGroup[] = Array.from(map.entries()).map(([cardId, cards]) => ({ cardId, characterId: cards[0].characterId, cards }));
  const defs = getCardDefs(groups[0]?.characterId ?? 'kenta');
  const defMap = new Map(defs.map((d) => [d.cardId, d]));
  groups.sort((a, b) => {
    if (a.cardId === 'hazure') return 1;
    if (b.cardId === 'hazure') return -1;
    const ra = RARITY_ORDER[defMap.get(a.cardId)?.rarity ?? 'N'] ?? 99;
    const rb = RARITY_ORDER[defMap.get(b.cardId)?.rarity ?? 'N'] ?? 99;
    if (ra !== rb) return ra - rb;
    return (defMap.get(b.cardId)?.starLevel ?? 0) - (defMap.get(a.cardId)?.starLevel ?? 0);
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
  const [exchangeRates, setExchangeRates] = useState<Record<string, Record<string, number>>>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [buybackCode, setBuybackCode] = useState<string | null>(null);
  const [confirmExchange, setConfirmExchange] = useState<RaiseCardIssued | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/raise-gacha/cards').then((r) => r.json()),
      fetch('/api/cards/exchange-rates?type=raise_kenta').then((r) => r.json()).catch(() => ({ rates: {} })),
      fetch('/api/cards/exchange-rates?type=raise_shoichi').then((r) => r.json()).catch(() => ({ rates: {} })),
    ]).then(([cardData, kentaRates, shoichiRates]) => {
      if (cardData.success) setCards(cardData.cards);
      setExchangeRates({ raise_kenta: kentaRates.rates ?? {}, raise_shoichi: shoichiRates.rates ?? {} });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleClose = useCallback(() => { setSelected(null); setBuybackCode(null); }, []);

  const handleDownload = useCallback(async () => {
    if (!cardRef.current || !selected || downloading) return;
    setDownloading(true);
    try { await downloadRaiseCardAsPng(cardRef.current, selected.serialNumber); }
    catch (e) { console.error('[card-download]', e); }
    finally { setDownloading(false); }
  }, [selected, downloading]);

  const currentRates = exchangeRates[`raise_${activeTab}`] ?? {};

  const handleBuyback = useCallback(async (card: RaiseCardIssued) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/cards/buyback', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: card.id, cardType: 'raise' }),
      });
      const data = await res.json();
      if (data.success) {
        setBuybackCode(data.buybackCode);
        setCards((prev) => prev.map((c) => c.id === card.id ? { ...c, status: 'buyback_pending' as const, buybackCode: data.buybackCode } : c));
        setSelected((prev) => prev?.id === card.id ? { ...prev, status: 'buyback_pending' as const, buybackCode: data.buybackCode } : prev);
      }
    } catch (e) { console.error(e); }
    finally { setActionLoading(false); }
  }, [actionLoading]);

  const handleCancelBuyback = useCallback(async (card: RaiseCardIssued) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/cards/buyback', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: card.id, cardType: 'raise' }),
      });
      const data = await res.json();
      if (data.success) {
        setBuybackCode(null);
        setCards((prev) => prev.map((c) => c.id === card.id ? { ...c, status: 'held' as const, buybackCode: null } : c));
        setSelected((prev) => prev?.id === card.id ? { ...prev, status: 'held' as const, buybackCode: null } : prev);
      }
    } catch (e) { console.error(e); }
    finally { setActionLoading(false); }
  }, [actionLoading]);

  const handleExchange = useCallback(async (card: RaiseCardIssued) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const cardType = card.characterId === 'kenta' ? 'raise_kenta' : 'raise_shoichi';
      const res = await fetch('/api/cards/exchange', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: card.id, cardType }),
      });
      const data = await res.json();
      if (data.success) {
        setCards((prev) => prev.filter((c) => c.id !== card.id));
        setSelected(null); setConfirmExchange(null);
        alert(`${data.coins}コインを獲得しました！`);
      }
    } catch (e) { console.error(e); }
    finally { setActionLoading(false); }
  }, [actionLoading]);

  if (loading) {
    return (
      <div className="rounded-2xl overflow-hidden mb-6" style={{ background: '#0a0a1c', border: '1px solid rgba(123,104,238,0.25)' }}>
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
      <div className="rounded-2xl overflow-hidden mb-6" style={{ background: '#0a0a1c', border: '1px solid rgba(123,104,238,0.25)' }}>
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="text-sm font-black text-white tracking-wider">
            🔮 来世ガチャ カードコレクション
            {cards.length > 0 && <span className="ml-2 text-xs font-bold" style={{ color: '#9370db' }}>{cards.length}枚</span>}
          </h2>
        </div>

        {/* タブ */}
        <div className="flex border-b border-white/5">
          {([
            { id: 'kenta' as TabId, label: '健太編', count: kentaCards.length },
            { id: 'shoichi' as TabId, label: '正一編', count: shoichiCards.length },
          ]).map((tab) => (
            <button
              key={tab.id}
              className={`flex-1 py-3 text-xs font-bold tracking-wider transition-colors ${activeTab === tab.id ? 'text-white border-b-2' : 'text-white/40 hover:text-white/60'}`}
              style={activeTab === tab.id ? { borderColor: '#9370db' } : undefined}
              onClick={() => { setActiveTab(tab.id); setExpandedCardId(null); }}
            >
              {tab.label}
              {tab.count > 0 && <span className="ml-1.5 text-[10px]" style={{ color: '#9370db' }}>{tab.count}</span>}
            </button>
          ))}
        </div>

        {tabCards.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-600 text-sm">まだカードを持っていません。来世ガチャで当選するとカードが発行されます。</div>
        ) : (
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {groups.map((group) => {
              const isHazure = group.cardId === 'hazure';
              const def = tabDefs.find((d) => d.cardId === group.cardId);
              const hasPending = group.cards.some((c) => c.status === 'buyback_pending');
              return (
                <div key={group.cardId} className="flex flex-col items-center gap-1">
                  <div className="relative w-full">
                    <div className={`transition-opacity ${isHazure ? 'opacity-60' : ''}`} style={isHazure ? { filter: 'brightness(0.7)' } : undefined}>
                      <RaiseDigitalCard characterId={activeTab as RaiseCharacterId} cardId={group.cardId} serialNumber={group.cards[0].serialNumber} size="collection"
                        onClick={() => {
                          if (group.cards.length === 1) setSelected(group.cards[0]);
                          else setExpandedCardId(expandedCardId === group.cardId ? null : group.cardId);
                        }} />
                    </div>
                    <div className="absolute -top-2 -right-2 z-10 flex items-center justify-center rounded-full text-xs font-black min-w-[28px] h-7 px-1.5"
                      style={{ background: isHazure ? 'linear-gradient(135deg, #555, #333)' : 'linear-gradient(135deg, #7b68ee, #5a4fcf)', color: isHazure ? '#aaa' : '#fff', boxShadow: isHazure ? '0 2px 8px rgba(0,0,0,0.5)' : '0 2px 8px rgba(123,104,238,0.4)' }}>
                      ×{group.cards.length}
                    </div>
                    {hasPending && (
                      <div className="absolute -top-2 -left-2 z-10 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-black">買取申請中</div>
                    )}
                  </div>
                  <p className={`text-[10px] font-bold tracking-wider ${isHazure ? 'text-white/30' : 'text-white/60'}`}>
                    {def?.name ?? group.cardId}
                    {def && !isHazure && <span className="ml-1" style={{ color: '#9370db' }}>{def.rarity}</span>}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 展開モーダル */}
      {expandedCardId && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80" onClick={() => setExpandedCardId(null)}>
          <div className="relative max-w-md w-[90vw] max-h-[80vh] rounded-2xl overflow-hidden"
            style={{ background: '#0a0a1c', border: '1px solid rgba(123,104,238,0.3)' }} onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-sm font-black text-white tracking-wider">
                {tabDefs.find((d) => d.cardId === expandedCardId)?.name}
                <span className="ml-2 text-xs font-bold" style={{ color: '#9370db' }}>{groups.find((g) => g.cardId === expandedCardId)?.cards.length}枚</span>
              </h3>
              <button className="text-white/40 hover:text-white text-lg" onClick={() => setExpandedCardId(null)}>✕</button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-60px)]">
              <div className="grid grid-cols-2 gap-3">
                {groups.find((g) => g.cardId === expandedCardId)?.cards.map((card) => (
                  <div key={card.id} className="flex flex-col items-center gap-1 relative">
                    {card.status === 'buyback_pending' && (
                      <div className="absolute -top-1 left-0 z-10 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-black">買取申請中</div>
                    )}
                    <RaiseDigitalCard characterId={card.characterId as RaiseCharacterId} cardId={card.cardId} serialNumber={card.serialNumber} size="collection"
                      onClick={() => { setExpandedCardId(null); setSelected(card); }} />
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
            {(selected.status === 'buyback_pending' && (buybackCode || selected.buybackCode)) && (
              <div className="w-full rounded-xl p-3 text-center" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)' }}>
                <p className="text-[10px] text-amber-400 mb-1">買取コード（買取サイトで使用）</p>
                <p className="text-lg font-black text-amber-300 tracking-wider cursor-pointer select-all"
                  onClick={() => navigator.clipboard.writeText(buybackCode || selected.buybackCode || '')} title="クリックでコピー">
                  {buybackCode || selected.buybackCode}
                </p>
                <p className="text-[9px] text-amber-400/60 mt-1">タップでコピー</p>
              </div>
            )}

            <RaiseDigitalCard characterId={selected.characterId as RaiseCharacterId} cardId={selected.cardId} serialNumber={selected.serialNumber} size="full" cardRef={cardRef} />
            <p className="text-xs font-bold tracking-widest" style={{ color: '#9370db' }}>{selected.serialNumber}</p>

            <div className="flex flex-wrap gap-2 justify-center w-full">
              {selected.status === 'held' && (
                <>
                  <button className="px-4 py-2 rounded-xl text-xs font-bold transition hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #7b68ee, #9370db)', color: '#fff' }}
                    onClick={handleDownload} disabled={downloading}>
                    {downloading ? '保存中...' : 'PNG保存'}
                  </button>
                  <button className="px-4 py-2 rounded-xl text-xs font-bold transition hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #c9a84c, #8a6e1e)', color: '#0a0800' }}
                    onClick={() => {
                      const rate = currentRates[selected.cardId] ?? 0;
                      if (rate <= 0) { alert('このカードは交換できません。'); return; }
                      setConfirmExchange(selected);
                    }}>
                    🪙 交換 {currentRates[selected.cardId] ? `(${currentRates[selected.cardId]}コイン)` : ''}
                  </button>
                  <button className="px-4 py-2 rounded-xl text-xs font-bold transition hover:scale-105 bg-amber-600 text-black"
                    onClick={() => handleBuyback(selected)} disabled={actionLoading}>
                    {actionLoading ? '処理中...' : '📤 買取に出す'}
                  </button>
                </>
              )}
              {selected.status === 'buyback_pending' && (
                <button className="px-4 py-2 rounded-xl text-xs font-bold transition hover:scale-105 border border-amber-500/40 text-amber-400"
                  onClick={() => handleCancelBuyback(selected)} disabled={actionLoading}>
                  {actionLoading ? '処理中...' : '買取キャンセル'}
                </button>
              )}
              {selected.status === 'transferred' && (
                <span className="px-4 py-2 rounded-xl text-xs font-bold text-white/40 border border-white/10">譲渡済み</span>
              )}
              <button className="px-4 py-2 rounded-xl text-xs font-bold text-white/60 border border-white/20" onClick={handleClose}>閉じる</button>
            </div>
          </div>
        </div>
      )}

      {/* ポイント交換確認 */}
      {confirmExchange && (
        <div className="fixed inset-0 z-[350] flex items-center justify-center bg-black/90" onClick={() => setConfirmExchange(null)}>
          <div className="rounded-2xl p-6 max-w-sm w-[90vw] text-center"
            style={{ background: '#0a0a1c', border: '1px solid rgba(123,104,238,0.4)' }} onClick={(e) => e.stopPropagation()}>
            <p className="text-lg font-black text-white mb-2">ポイント交換</p>
            <p className="text-sm text-white/70 mb-4">
              「{tabDefs.find((d) => d.cardId === confirmExchange.cardId)?.name}」を<br />
              <span className="font-black text-xl" style={{ color: '#9370db' }}>{currentRates[confirmExchange.cardId] ?? 0}コイン</span><br />
              に交換しますか？
            </p>
            <p className="text-xs text-red-400 mb-4">※ この操作は元に戻せません</p>
            <div className="flex gap-3 justify-center">
              <button className="px-6 py-2 rounded-xl text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #7b68ee, #9370db)', color: '#fff' }}
                onClick={() => handleExchange(confirmExchange)} disabled={actionLoading}>
                {actionLoading ? '処理中...' : '交換する'}
              </button>
              <button className="px-6 py-2 rounded-xl text-sm font-bold text-white/60 border border-white/20"
                onClick={() => setConfirmExchange(null)}>キャンセル</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
