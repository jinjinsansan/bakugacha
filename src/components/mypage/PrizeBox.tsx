'use client';

import { useCallback, useEffect, useState } from 'react';
import type { PrizeClaim } from '@/lib/data/prize-claims';

export function PrizeBox() {
  const [claims, setClaims] = useState<PrizeClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [deliveryTarget, setDeliveryTarget] = useState<PrizeClaim | null>(null);
  const [confirmExchange, setConfirmExchange] = useState<PrizeClaim | null>(null);
  const [form, setForm] = useState({ recipientName: '', postalCode: '', address: '', phone: '' });

  useEffect(() => {
    fetch('/api/prizes')
      .then((r) => r.json())
      .then((data) => { if (data.success) setClaims(data.claims); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelivery = useCallback(async () => {
    if (!deliveryTarget || actionLoading) return;
    if (!form.recipientName || !form.postalCode || !form.address || !form.phone) {
      alert('全ての項目を入力してください。');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch('/api/prizes/delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimId: deliveryTarget.id, ...form }),
      });
      const data = await res.json();
      if (data.success) {
        setClaims((prev) => prev.map((c) =>
          c.id === deliveryTarget.id ? { ...c, status: 'delivery_requested' as const } : c
        ));
        setDeliveryTarget(null);
        setForm({ recipientName: '', postalCode: '', address: '', phone: '' });
      } else {
        alert(data.error || '配送申請に失敗しました。');
      }
    } catch (e) { console.error(e); }
    finally { setActionLoading(false); }
  }, [deliveryTarget, form, actionLoading]);

  const handleExchange = useCallback(async (claim: PrizeClaim) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/prizes/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimId: claim.id }),
      });
      const data = await res.json();
      if (data.success) {
        setClaims((prev) => prev.filter((c) => c.id !== claim.id));
        setConfirmExchange(null);
        alert(`${data.coins}コインを獲得しました！`);
      } else {
        alert(data.error || '交換に失敗しました。');
      }
    } catch (e) { console.error(e); }
    finally { setActionLoading(false); }
  }, [actionLoading]);

  if (loading) {
    return (
      <div className="rounded-2xl overflow-hidden mb-6"
        style={{ background: '#0a0a1c', border: '1px solid rgba(74,222,128,0.25)' }}>
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="text-sm font-black text-white tracking-wider">🎁 当選品ボックス</h2>
        </div>
        <div className="px-5 py-8 text-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white mx-auto" />
        </div>
      </div>
    );
  }

  if (claims.length === 0) return null;

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: '受取方法を選んでください', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
    delivery_requested: { label: '配送手続き中', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
    shipped: { label: '発送済み', color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
    delivered: { label: '配達完了', color: '#9ca3af', bg: 'rgba(156,163,175,0.1)' },
    code_sent: { label: 'コード送付済み', color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
  };

  return (
    <>
      <div className="rounded-2xl overflow-hidden mb-6"
        style={{ background: '#0a0a1c', border: '1px solid rgba(74,222,128,0.25)' }}>
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="text-sm font-black text-white tracking-wider">
            🎁 当選品ボックス
            <span className="ml-2 text-xs font-bold" style={{ color: '#4ade80' }}>{claims.length}件</span>
          </h2>
        </div>

        <div className="divide-y divide-white/5">
          {claims.map((claim) => {
            const cfg = statusConfig[claim.status] ?? statusConfig.pending;
            return (
              <div key={claim.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">🏆 {claim.prizeName}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {new Date(claim.createdAt).toLocaleDateString('ja-JP')} 当選
                    </p>
                  </div>
                  <div
                    className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-full"
                    style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}33` }}
                  >
                    {cfg.label}
                  </div>
                </div>

                {/* 追跡番号（発送済み） */}
                {claim.status === 'shipped' && claim.trackingNumber && (
                  <div className="mt-2 rounded-lg px-3 py-2" style={{ background: 'rgba(74,222,128,0.1)' }}>
                    <p className="text-[10px] text-gray-400">追跡番号</p>
                    <p className="text-sm font-bold text-white select-all">{claim.trackingNumber}</p>
                  </div>
                )}

                {/* ギフトコード（code_sent） */}
                {claim.status === 'code_sent' && claim.giftCode && (
                  <div className="mt-2 rounded-lg px-3 py-2" style={{ background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)' }}>
                    <p className="text-[10px] text-green-400">ギフトコード</p>
                    <p
                      className="text-base font-black text-green-300 tracking-wider cursor-pointer select-all mt-0.5"
                      onClick={() => navigator.clipboard.writeText(claim.giftCode || '')}
                      title="クリックでコピー"
                    >
                      {claim.giftCode}
                    </p>
                    <p className="text-[9px] text-green-400/60 mt-1">タップでコピー</p>
                  </div>
                )}

                {/* アクションボタン（pending時のみ） */}
                {claim.status === 'pending' && (
                  <div className="flex gap-2 mt-3">
                    <button
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold transition hover:scale-[1.02]"
                      style={{ background: 'linear-gradient(135deg, #4ade80, #22c55e)', color: '#052e16' }}
                      onClick={() => setDeliveryTarget(claim)}
                    >
                      📦 配送を希望
                    </button>
                    <button
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold transition hover:scale-[1.02]"
                      style={{ background: 'linear-gradient(135deg, #c9a84c, #8a6e1e)', color: '#0a0800' }}
                      onClick={() => {
                        if (claim.exchangeCoins <= 0) { alert('この商品はコイン交換が設定されていません。'); return; }
                        setConfirmExchange(claim);
                      }}
                    >
                      🪙 コイン交換 {claim.exchangeCoins > 0 ? `(${claim.exchangeCoins})` : ''}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 配送先入力モーダル */}
      {deliveryTarget && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/85" onClick={() => setDeliveryTarget(null)}>
          <div
            className="rounded-2xl p-6 max-w-sm w-[90vw]"
            style={{ background: '#0a0a1c', border: '1px solid rgba(74,222,128,0.3)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-black text-white mb-1">配送先を入力</h3>
            <p className="text-xs text-gray-400 mb-4">「{deliveryTarget.prizeName}」の配送先</p>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">お名前</label>
                <input
                  type="text" value={form.recipientName}
                  onChange={(e) => setForm((f) => ({ ...f, recipientName: e.target.value }))}
                  className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-green-400/50"
                  placeholder="山田 太郎"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">郵便番号</label>
                <input
                  type="text" value={form.postalCode}
                  onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
                  className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-green-400/50"
                  placeholder="123-4567"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">住所</label>
                <input
                  type="text" value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-green-400/50"
                  placeholder="東京都渋谷区..."
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">電話番号</label>
                <input
                  type="text" value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-green-400/50"
                  placeholder="090-1234-5678"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #4ade80, #22c55e)', color: '#052e16' }}
                onClick={handleDelivery}
                disabled={actionLoading}
              >
                {actionLoading ? '送信中...' : '配送を申請する'}
              </button>
              <button
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-white/60 border border-white/20"
                onClick={() => setDeliveryTarget(null)}
              >
                戻る
              </button>
            </div>
          </div>
        </div>
      )}

      {/* コイン交換確認ダイアログ */}
      {confirmExchange && (
        <div className="fixed inset-0 z-[350] flex items-center justify-center bg-black/90" onClick={() => setConfirmExchange(null)}>
          <div
            className="rounded-2xl p-6 max-w-sm w-[90vw] text-center"
            style={{ background: '#0a0a1c', border: '1px solid rgba(201,168,76,0.4)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-lg font-black text-white mb-2">コイン交換</p>
            <p className="text-sm text-white/70 mb-4">
              「{confirmExchange.prizeName}」を<br />
              <span className="text-gold font-black text-xl">{confirmExchange.exchangeCoins}コイン</span><br />
              に交換しますか？
            </p>
            <p className="text-xs text-red-400 mb-4">※ この操作は元に戻せません<br />※ 配送での受取はできなくなります</p>
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
