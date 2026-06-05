'use client';

import { useState, useTransition } from 'react';
import type { PrizeClaim } from '@/lib/data/prize-claims';

const STATUS_OPTIONS = [
  { value: 'pending',            label: '選択待ち',    color: 'bg-yellow-400/20 text-yellow-300' },
  { value: 'delivery_requested', label: '配送希望',    color: 'bg-blue-400/20 text-blue-300' },
  { value: 'shipped',            label: '発送済み',    color: 'bg-emerald-400/20 text-emerald-300' },
  { value: 'delivered',          label: '配達完了',    color: 'bg-gray-400/20 text-gray-400' },
  { value: 'code_sent',          label: 'コード送付済', color: 'bg-purple-400/20 text-purple-300' },
  { value: 'converted',          label: 'コイン交換済', color: 'bg-gray-500/20 text-gray-500' },
];

const PRIZE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  paypay:      { label: '🟡 PayPay',       color: 'text-yellow-400' },
  amazon_gift: { label: '🛒 Amazonギフト', color: 'text-orange-400' },
  delivery:    { label: '📦 配達',          color: 'text-blue-400' },
  digital:     { label: '💿 デジタル',      color: 'text-purple-400' },
  other:       { label: '🎁 その他',        color: 'text-gray-400' },
};

const PAGE_SIZE = 50;

type Props = {
  claims: PrizeClaim[];
  updateAction: (formData: FormData) => Promise<void>;
  initialStatus?: string;
};

function StatusBadge({ status }: { status: string }) {
  const opt = STATUS_OPTIONS.find(o => o.value === status);
  return (
    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full whitespace-nowrap ${opt?.color ?? 'bg-white/10 text-white/50'}`}>
      {opt?.label ?? status}
    </span>
  );
}

function ExpandedRow({ claim, updateAction, onClose }: {
  claim: PrizeClaim;
  updateAction: (formData: FormData) => Promise<void>;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const prizeType = claim.prizeInfo?.type;
  const isAmazon = prizeType === 'amazon_gift';
  const isDelivery = prizeType === 'delivery' || claim.status === 'delivery_requested';

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateAction(fd);
      onClose();
    });
  }

  return (
    <tr className="bg-white/5">
      <td colSpan={7} className="px-4 py-4">
        <div className="flex flex-col gap-4">
          {/* 配送先情報 */}
          {claim.recipientName && (
            <div className="rounded-lg bg-white/5 px-4 py-3 text-xs text-white/70 grid grid-cols-2 gap-1">
              <p><span className="text-white/40">氏名:</span> {claim.recipientName}</p>
              <p><span className="text-white/40">TEL:</span> {claim.phone}</p>
              <p><span className="text-white/40">〒:</span> {claim.postalCode}</p>
              <p><span className="text-white/40">住所:</span> {claim.address}</p>
            </div>
          )}

          {/* 編集フォーム */}
          {claim.status !== 'converted' && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input type="hidden" name="claim_id" value={claim.id} />
              <input type="hidden" name="current_filter" value="all" />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* ステータス */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-white/40">ステータス</label>
                  <select name="status" defaultValue={claim.status}
                    className="rounded-lg bg-white/10 border border-white/10 px-2 py-1.5 text-xs text-white focus:outline-none">
                    {STATUS_OPTIONS.filter(o => o.value !== 'converted').map(o => (
                      <option key={o.value} value={o.value} className="bg-zinc-900">{o.label}</option>
                    ))}
                  </select>
                </div>

                {/* Amazonギフト券コード（目立つ表示） */}
                {isAmazon && (
                  <div className="flex flex-col gap-1 col-span-2">
                    <label className="text-[10px] text-orange-400 font-bold">🛒 Amazonギフトコード</label>
                    <div className="flex gap-2">
                      <input name="gift_code" defaultValue={claim.giftCode ?? ''}
                        placeholder="XXXX-XXXXXX-XXXX"
                        className="flex-1 rounded-lg bg-orange-950/30 border border-orange-500/40 px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-orange-400" />
                      {claim.giftCode && (
                        <button type="button"
                          onClick={() => navigator.clipboard.writeText(claim.giftCode!)}
                          className="px-2 py-1 rounded bg-orange-900/40 text-orange-300 text-xs hover:bg-orange-900/60">
                          コピー
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* 追跡番号（配達系） */}
                {(isDelivery || prizeType === 'delivery') && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-white/40">追跡番号</label>
                    <input name="tracking_number" defaultValue={claim.trackingNumber ?? ''}
                      placeholder="任意"
                      className="rounded-lg bg-white/10 border border-white/10 px-2 py-1.5 text-xs text-white focus:outline-none" />
                  </div>
                )}

                {/* PayPayの場合は送金メモ欄 */}
                {prizeType === 'paypay' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-yellow-400 font-bold">🟡 PayPay送金メモ</label>
                    <input name="notes" defaultValue={claim.notes ?? ''}
                      placeholder="送金日・送金者名など"
                      className="rounded-lg bg-yellow-950/30 border border-yellow-500/40 px-2 py-1.5 text-xs text-white focus:outline-none" />
                  </div>
                )}

                {/* 通常メモ */}
                {prizeType !== 'paypay' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-white/40">メモ</label>
                    <input name="notes" defaultValue={claim.notes ?? ''}
                      placeholder="任意"
                      className="rounded-lg bg-white/10 border border-white/10 px-2 py-1.5 text-xs text-white focus:outline-none" />
                  </div>
                )}

                {/* Amazonでない場合のギフトコード欄 */}
                {!isAmazon && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-white/40">ギフトコード</label>
                    <input name="gift_code" defaultValue={claim.giftCode ?? ''}
                      placeholder="任意"
                      className="rounded-lg bg-white/10 border border-white/10 px-2 py-1.5 text-xs text-white focus:outline-none" />
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button type="submit" disabled={pending}
                  className="btn-gold px-4 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50">
                  {pending ? '保存中...' : '保存'}
                </button>
                <button type="button" onClick={onClose}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-white/10 text-white/60 hover:bg-white/20">
                  閉じる
                </button>
              </div>
            </form>
          )}
        </div>
      </td>
    </tr>
  );
}

export function PrizeClaimsTable({ claims, updateAction, initialStatus = 'all' }: Props) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = claims.filter(c => {
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const q = query.toLowerCase();
    const matchQuery = !q ||
      (c.userEmail ?? '').toLowerCase().includes(q) ||
      (c.userDisplayName ?? '').toLowerCase().includes(q) ||
      (c.prizeName ?? '').toLowerCase().includes(q) ||
      (c.recipientName ?? '').toLowerCase().includes(q) ||
      (c.giftCode ?? '').toLowerCase().includes(q);
    return matchStatus && matchQuery;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(0, totalPages - 1));
  const paginated = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const counts = STATUS_OPTIONS.reduce((acc, opt) => {
    acc[opt.value] = claims.filter(c => c.status === opt.value).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex flex-col gap-4">
      {/* サマリー */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {STATUS_OPTIONS.map(opt => (
          <button key={opt.value}
            onClick={() => { setStatusFilter(opt.value === statusFilter ? 'all' : opt.value); setPage(0); }}
            className={`rounded-xl p-2 text-center transition-colors border ${
              statusFilter === opt.value ? 'border-white/30 bg-white/15' : 'border-white/5 bg-white/5 hover:bg-white/10'
            }`}>
            <p className={`text-lg font-black ${opt.color.split(' ')[1]}`}>{counts[opt.value] ?? 0}</p>
            <p className="text-[10px] text-white/40">{opt.label}</p>
          </button>
        ))}
      </div>

      {/* 検索 */}
      <input type="text" placeholder="ユーザー名・メール・景品名で検索..."
        value={query}
        onChange={e => { setQuery(e.target.value); setPage(0); }}
        className="w-full md:w-80 px-3 py-2 rounded-lg bg-white/10 text-white text-sm placeholder-white/30 border border-white/10 focus:border-yellow-500/50 focus:outline-none"
      />

      {/* テーブル */}
      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-white/70">
            <thead>
              <tr className="border-b border-white/10 text-left text-white/40">
                <th className="px-4 py-3">ステータス</th>
                <th className="px-4 py-3">景品</th>
                <th className="px-4 py-3">ユーザー</th>
                <th className="px-4 py-3">金額</th>
                <th className="px-4 py-3">コード/追跡</th>
                <th className="px-4 py-3">日時</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-white/30">
                    {query ? '該当する当選品が見つかりません' : '当選品はありません'}
                  </td>
                </tr>
              ) : paginated.map(claim => {
                const prizeType = claim.prizeInfo?.type;
                const typeInfo = prizeType ? PRIZE_TYPE_LABELS[prizeType] : null;
                const isExpanded = expandedId === claim.id;
                const hasCode = !!claim.giftCode;
                const hasTracking = !!claim.trackingNumber;

                return (
                  <>
                    <tr key={claim.id}
                      className={`border-b border-white/5 hover:bg-white/5 cursor-pointer ${isExpanded ? 'bg-white/5' : ''}`}
                      onClick={() => setExpandedId(isExpanded ? null : claim.id)}>
                      <td className="px-4 py-3">
                        <StatusBadge status={claim.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          {typeInfo && <span className={`text-[10px] font-bold ${typeInfo.color}`}>{typeInfo.label}</span>}
                          <span className="text-white font-medium truncate max-w-[120px]">{claim.prizeName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-[140px]">
                        <p className="truncate text-white">{claim.userDisplayName || claim.userEmail || claim.userId.slice(0, 8)}</p>
                        {claim.recipientName && <p className="truncate text-white/40 text-[10px]">📦 {claim.recipientName}</p>}
                      </td>
                      <td className="px-4 py-3 text-yellow-400 font-bold">
                        {claim.prizeInfo?.value ? `¥${claim.prizeInfo.value.toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {hasCode && <span className="text-green-400 font-mono text-[10px]">✓ {claim.giftCode}</span>}
                        {hasTracking && <span className="text-blue-400 text-[10px]">🚚 {claim.trackingNumber}</span>}
                        {!hasCode && !hasTracking && <span className="text-white/20">—</span>}
                      </td>
                      <td className="px-4 py-3 text-white/30">
                        {new Date(claim.createdAt).toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3">
                        <button className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-xs">
                          {isExpanded ? '閉じる ▲' : '編集 ▼'}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <ExpandedRow key={`${claim.id}-expanded`} claim={claim} updateAction={updateAction}
                        onClose={() => setExpandedId(null)} />
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ページネーション */}
        <div className="px-4 py-3 flex items-center justify-between border-t border-white/5">
          <span className="text-xs text-white/30">
            {filtered.length}件中 {currentPage * PAGE_SIZE + 1}〜{Math.min((currentPage + 1) * PAGE_SIZE, filtered.length)}件
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}
                className="px-3 py-1 rounded text-xs bg-white/10 hover:bg-white/20 text-white disabled:opacity-30">
                ← 前へ
              </button>
              <span className="text-xs text-white/50">{currentPage + 1} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1}
                className="px-3 py-1 rounded text-xs bg-white/10 hover:bg-white/20 text-white disabled:opacity-30">
                次へ →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
