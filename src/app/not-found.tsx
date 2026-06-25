import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 text-center"
      style={{ background: 'var(--bg-base)' }}
    >
      <p className="text-6xl mb-4 select-none">🎰</p>
      <h1 className="headline-serif text-2xl mb-2">ページが見つかりません</h1>
      <p className="text-sm text-white/60 mb-8">
        お探しのページは移動または削除された可能性があります。
      </p>
      <Link
        href="/"
        className="rounded-full bg-yellow-500 px-8 py-3 text-sm font-bold text-black hover:bg-yellow-400 transition-colors"
      >
        トップページへ戻る
      </Link>
    </div>
  );
}
