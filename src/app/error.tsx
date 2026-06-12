'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app error]', error);
  }, [error]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 text-center"
      style={{ background: 'var(--bg-base)' }}
    >
      <p className="text-6xl mb-4 select-none">⚠️</p>
      <h1 className="text-2xl font-black text-white mb-2">エラーが発生しました</h1>
      <p className="text-sm text-white/60 mb-8">
        申し訳ございません。問題が発生しました。しばらくしてからもう一度お試しください。
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-yellow-500 px-8 py-3 text-sm font-bold text-black hover:bg-yellow-400 transition-colors"
        >
          再試行
        </button>
        <Link
          href="/"
          className="rounded-full border border-white/20 px-8 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors"
        >
          トップへ戻る
        </Link>
      </div>
    </div>
  );
}
