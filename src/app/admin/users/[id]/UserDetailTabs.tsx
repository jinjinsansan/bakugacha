'use client';

import { useState } from 'react';
import Link from 'next/link';

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
  loginHistory,
  coinTransactions,
  gachaResults,
  claims,
}: {
  loginHistory: Row[];
  coinTransactions: Row[];
  gachaResults: Row[];
  claims: Row[];
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
        {tab === 'wins' && <WinsClaimsTab data={claims} />}
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

const CLAIM_STATUS: Record<string, { label: string; color: string }> = {
  pending:            { label: '未対応',         color: 'bg-orange-900/50 text-orange-400' },
  delivery_requested: { label: '配送申請中',     color: 'bg-amber-900/50 text-amber-300' },
  shipped:            { label: '発送済み',       color: 'bg-blue-900/50 text-blue-400' },
  delivered:          { label: '配達完了',       color: 'bg-green-900/50 text-green-400' },
  code_sent:          { label: 'コード送付済み', color: 'bg-purple-900/50 text-purple-300' },
  converted:          { label: 'コイン交換済み', color: 'bg-white/10 text-white/50' },
};

function WinsClaimsTab({ data }: { data: Row[] }) {
  if (data.length === 0) return <EmptyState text="当選品がありません" />;

  return (
    <div className="flex flex-col">
      <div className="px-4 py-3 border-b border-white/5">
        <Link href="/admin/prizes?status=pending" className="text-xs text-yellow-300/80 hover:text-yellow-300">
          配送・コード送付などの対応は「当選品管理」で行えます →
        </Link>
      </div>
      <div className="divide-y divide-white/5">
        {data.map((c) => {
          const st = CLAIM_STATUS[c.status as string] ?? { label: c.status as string, color: 'bg-white/10 text-white/50' };
          const prizeLabel = c.prizeInfo?.name ?? c.prizeName ?? '—';
          return (
            <div key={c.id as string} className="px-4 py-4 hover:bg-white/5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-sm text-white font-medium">🏆 {prizeLabel}</div>
                  <div className="text-xs text-white/40 mt-1">当選日: {formatDate(c.createdAt as string)}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs shrink-0 ${st.color}`}>{st.label}</span>
              </div>
              <div className="mt-2 flex flex-col gap-0.5 text-xs text-white/50">
                {c.recipientName && <div>宛先: {c.recipientName as string}{c.address ? ` / ${c.address as string}` : ''}</div>}
                {c.trackingNumber && <div>追跡番号: <span className="font-mono">{c.trackingNumber as string}</span></div>}
                {c.giftCode && <div>ギフトコード: <span className="font-mono">{c.giftCode as string}</span></div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="px-4 py-12 text-center text-white/30 text-sm">{text}</div>
  );
}
