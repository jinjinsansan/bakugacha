import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/admin';

const NAV = [
  { href: '/admin',          label: '📊 ダッシュボード' },
  { href: '/admin/products', label: '🎁 商品管理' },
  { href: '/admin/banners',  label: '🖼️ バナー管理' },
  { href: '/admin/settings', label: '⚙️ CD2設定' },
  { href: '/admin/results',  label: '📋 結果一覧' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* 管理ヘッダー */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-black text-base" style={{ color: 'var(--gold)' }}>爆ガチャ 管理</span>
            <span className="text-xs text-white/30 bg-white/10 rounded px-2 py-0.5">ADMIN</span>
          </div>
          <Link href="/" className="text-xs text-white/50 hover:text-white transition-colors">
            ← サイトに戻る
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 flex gap-6 py-6">
        {/* サイドナビ */}
        <nav className="w-48 shrink-0 hidden md:block">
          <ul className="flex flex-col gap-1">
            {NAV.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="block px-3 py-2.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* モバイル用タブ */}
        <nav className="md:hidden w-full">
          <div className="flex gap-1 overflow-x-auto pb-4">
            {NAV.map(({ href, label }) => (
              <Link key={href} href={href}
                className="shrink-0 px-3 py-2 rounded-lg text-xs text-white/70 bg-white/5 hover:bg-white/10 transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </nav>

        {/* メインコンテンツ */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
