'use client';

import { useState } from 'react';
import { CreateDeliveryButton, DeliveryStatusForm } from './DeliveryForm';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

const TABS = [
  { key: 'login', label: 'ログイン履歴' },
  { key: 'coins', label: 'コイン履歴' },
  { key: 'gacha', label: 'ガチャ履歴' },
  { key: 'wins', label: '当選・配達' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export function UserDetailTabs({
  userId,
  loginHistory,
  coinTransactions,
  gachaResults,
  wins,
}: {
  userId: string;
  loginHistory: Row[];
  coinTransactions: Row[];
  gachaResults: Row[];
  wins: Row[];
}) {
  const [tab, setTab] = useState<TabKey>('login');

  return (
    <div className="card-premium overflow-hidden">
      {/* タブヘッダー */}
      <div className="flex border-b border-white/10 overflow-x-auto">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-3 text-xs font-bold whitespace-nowrap transition-colors ${
              tab === key
                ? 'text-yellow-300 border-b-2 border-yellow-300'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* タブ内容 */}
      <div className="overflow-x-auto">
        {tab === 'login' && <LoginHistoryTab data={loginHistory} />}
        {tab === 'coins' && <CoinHistoryTab data={coinTransactions} />}
        {tab === 'gacha' && <GachaHistoryTab data={gachaResults} />}
        {tab === 'wins' && <WinsDeliveryTab data={wins} userId={userId} />}
      </div>
    </div>
  );
}

function LoginHistoryTab({ data }: { data: Row[] }) {
  if (data.length === 0) return <EmptyState text="ログイン履歴がありません" />;
  return (
    <table className="w-full text-xs text-white/70">
      <thead>
        <tr className="border-b border-white/10 text-left text-white/50">
          <th className="px-4 py-3">#</th>
          <th className="px-4 py-3">ログイン日時</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={row.id} className="border-b border-white/5 hover:bg-white/5">
            <td className="px-4 py-2.5 text-white/30">{i + 1}</td>
            <td className="px-4 py-2.5">{formatDate(row.logged_in_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CoinHistoryTab({ data }: { data: Row[] }) {
  if (data.length === 0) return <EmptyState text="コイン履歴がありません" />;

  const typeLabel: Record<string, string> = {
    purchase: '購入',
    gacha: 'ガチャ',
    bonus: 'ボーナス',
    refund: '返金',
    referral_bonus: '紹介ボーナス',
  };

  const typeColor: Record<string, string> = {
    purchase: 'text-blue-400',
    gacha: 'text-red-400',
    bonus: 'text-green-400',
    refund: 'text-yellow-400',
    referral_bonus: 'text-green-400',
  };

  return (
    <table className="w-full text-xs text-white/70">
      <thead>
        <tr className="border-b border-white/10 text-left text-white/50">
          <th className="px-4 py-3">タイプ</th>
          <th className="px-4 py-3">金額</th>
          <th className="px-4 py-3">残高</th>
          <th className="px-4 py-3">説明</th>
          <th className="px-4 py-3">日時</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={row.id} className="border-b border-white/5 hover:bg-white/5">
            <td className="px-4 py-2.5">
              <span className={typeColor[row.type as string] ?? 'text-white/60'}>
                {typeLabel[row.type as string] ?? row.type}
              </span>
            </td>
            <td className="px-4 py-2.5">
              <span className={(row.amount as number) >= 0 ? 'text-green-400' : 'text-red-400'}>
                {(row.amount as number) >= 0 ? '+' : ''}{(row.amount as number).toLocaleString()}
              </span>
            </td>
            <td className="px-4 py-2.5">🪙 {((row.balance_after as number) ?? 0).toLocaleString()}</td>
            <td className="px-4 py-2.5 max-w-[200px] truncate text-white/40">{(row.description as string) ?? '—'}</td>
            <td className="px-4 py-2.5 text-white/40">{formatDate(row.created_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function GachaHistoryTab({ data }: { data: Row[] }) {
  if (data.length === 0) return <EmptyState text="ガチャ履歴がありません" />;
  return (
    <table className="w-full text-xs text-white/70">
      <thead>
        <tr className="border-b border-white/10 text-left text-white/50">
          <th className="px-4 py-3">結果</th>
          <th className="px-4 py-3">商品</th>
          <th className="px-4 py-3">コスト</th>
          <th className="px-4 py-3">日時</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row) => {
          const pRaw = row.gacha_products as unknown;
          const p = (Array.isArray(pRaw) ? pRaw[0] : pRaw) as { title: string } | null;
          return (
            <tr key={row.id} className="border-b border-white/5 hover:bg-white/5">
              <td className="px-4 py-2.5">
                <span className={row.result === 'win' ? 'text-yellow-300 font-bold' : 'text-zinc-500'}>
                  {row.result === 'win' ? '🏆 当選' : '💀 ハズレ'}
                </span>
              </td>
              <td className="px-4 py-2.5 max-w-[200px] truncate">{p?.title ?? row.prize_name ?? '—'}</td>
              <td className="px-4 py-2.5">🪙 {((row.coins_spent as number) ?? 0).toLocaleString()}</td>
              <td className="px-4 py-2.5 text-white/40">{formatDate(row.played_at)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function WinsDeliveryTab({ data, userId }: { data: Row[]; userId: string }) {
  if (data.length === 0) return <EmptyState text="当選履歴がありません" />;

  const statusLabel: Record<string, string> = {
    pending: '未発送',
    shipped: '発送済み',
    delivered: '配達完了',
  };

  const statusColor: Record<string, string> = {
    pending: 'bg-orange-900/50 text-orange-400',
    shipped: 'bg-blue-900/50 text-blue-400',
    delivered: 'bg-green-900/50 text-green-400',
  };

  return (
    <div className="divide-y divide-white/5">
      {data.map((row) => {
        const pRaw = row.gacha_products as unknown;
        const p = (Array.isArray(pRaw) ? pRaw[0] : pRaw) as { title: string } | null;
        const deliveriesRaw = row.deliveries as unknown;
        const deliveries = (Array.isArray(deliveriesRaw) ? deliveriesRaw : deliveriesRaw ? [deliveriesRaw] : []) as Row[];
        const delivery = deliveries[0] ?? null;

        return (
          <div key={row.id} className="px-4 py-4 hover:bg-white/5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="text-sm text-white font-medium">
                  🏆 {p?.title ?? row.prize_name ?? '—'}
                </div>
                <div className="text-xs text-white/40 mt-1">
                  当選日: {formatDate(row.played_at)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {delivery ? (
                  <span className={`px-2 py-0.5 rounded text-xs ${statusColor[delivery.status as string] ?? ''}`}>
                    {statusLabel[delivery.status as string] ?? delivery.status}
                  </span>
                ) : (
                  <CreateDeliveryButton gachaResultId={row.id as string} userId={userId} />
                )}
              </div>
            </div>

            {delivery && (
              <div className="mt-2">
                {delivery.tracking_number && (
                  <div className="text-xs text-white/50 mb-1">
                    追跡番号: <span className="font-mono">{delivery.tracking_number as string}</span>
                  </div>
                )}
                <DeliveryStatusForm delivery={delivery} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="px-4 py-12 text-center text-white/30 text-sm">{text}</div>
  );
}
