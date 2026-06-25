'use client';

import { useCallback, useEffect, useState } from 'react';

interface AccessCode {
  id: string;
  code: string;
  targetProductId: string;
  targetProductTitle: string;
  isUsed: boolean;
  createdAt: string;
}

export function AccessCodeList() {
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/access-codes')
      .then((r) => r.json())
      .then((data) => { if (data.success) setCodes(data.codes); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = useCallback((code: string) => {
    navigator.clipboard?.writeText(code);
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl overflow-hidden mb-6"
        style={{ background: '#0d1020', border: '1px solid rgba(154,123,255,0.25)' }}>
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="text-sm font-black text-white tracking-wider">権利コード</h2>
        </div>
        <div className="px-5 py-8 text-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white mx-auto" />
        </div>
      </div>
    );
  }

  if (codes.length === 0) return null;

  return (
    <div className="rounded-2xl overflow-hidden mb-6"
      style={{ background: '#0d1020', border: '1px solid rgba(154,123,255,0.25)' }}>
      <div className="px-5 py-4 border-b border-white/5">
        <h2 className="text-sm font-black text-white tracking-wider">
          権利コード
          <span className="ml-2 text-xs font-bold" style={{ color: '#c0a8ff' }}>{codes.length}件</span>
        </h2>
      </div>

      <div className="divide-y divide-white/5">
        {codes.map((ac) => (
          <div key={ac.id} className="px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 mb-1">対象: {ac.targetProductTitle}</p>
                <p
                  className="text-lg font-black tracking-[0.15em] cursor-pointer select-all"
                  style={{ color: '#c0a8ff' }}
                  onClick={() => handleCopy(ac.code)}
                  title="タップでコピー"
                >
                  {ac.code}
                </p>
                <p className="text-[10px] text-gray-600 mt-0.5">
                  {new Date(ac.createdAt).toLocaleDateString('ja-JP')} 取得
                </p>
              </div>
              <a
                href={`/gacha/${ac.targetProductId}`}
                className="shrink-0 px-4 py-2 rounded-xl text-xs font-black text-white transition hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #9a7bff, #7c3aed)' }}
              >
                ガチャへ
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
