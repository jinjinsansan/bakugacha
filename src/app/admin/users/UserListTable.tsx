'use client';

import { useState } from 'react';
import Link from 'next/link';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type User = Record<string, any>;

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export function UserListTable({ users }: { users: User[] }) {
  const [query, setQuery] = useState('');

  const filtered = users.filter((u) => {
    if (!query) return true;
    const q = query.toLowerCase();
    const name = ((u.line_display_name ?? u.display_name ?? '') as string).toLowerCase();
    const email = ((u.email ?? '') as string).toLowerCase();
    const code = ((u.referral_code ?? '') as string).toLowerCase();
    return name.includes(q) || email.includes(q) || code.includes(q);
  });

  return (
    <>
      <input
        type="text"
        placeholder="名前・メール・紹介コードで検索..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full md:w-80 px-3 py-2 rounded-lg bg-white/10 text-white text-sm placeholder-white/30 border border-white/10 focus:border-yellow-500/50 focus:outline-none"
      />

      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-white/70">
            <thead>
              <tr className="border-b border-white/10 text-left text-white/50">
                <th className="px-4 py-3">ユーザー</th>
                <th className="px-4 py-3">メール</th>
                <th className="px-4 py-3">コイン</th>
                <th className="px-4 py-3">紹介コード</th>
                <th className="px-4 py-3">登録日</th>
                <th className="px-4 py-3">最終ログイン</th>
                <th className="px-4 py-3">ステータス</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {u.line_picture_url ? (
                        <img src={u.line_picture_url} alt="" className="w-7 h-7 rounded-full" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/30 text-xs">?</div>
                      )}
                      <span className="text-white font-medium truncate max-w-[120px]">
                        {u.line_display_name ?? u.display_name ?? '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-[160px] truncate text-white/40">{u.email ?? '—'}</td>
                  <td className="px-4 py-3">🪙 {((u.coins as number) ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono text-white/40">{u.referral_code ?? '—'}</td>
                  <td className="px-4 py-3 text-white/40">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-3 text-white/40">{formatDate(u.last_login_at)}</td>
                  <td className="px-4 py-3">
                    {u.is_blocked ? (
                      <span className="px-2 py-0.5 rounded text-xs bg-red-900/50 text-red-400">ブロック中</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs bg-green-900/50 text-green-400">有効</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-xs transition-colors"
                    >
                      詳細
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-white/30">
                    {query ? '該当するユーザーが見つかりません' : 'ユーザーがいません'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 text-xs text-white/30 border-t border-white/5">
          {filtered.length} / {users.length} 件表示
        </div>
      </div>
    </>
  );
}
