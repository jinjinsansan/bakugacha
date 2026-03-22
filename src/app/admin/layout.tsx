import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/admin';

const NAV = [
  { href: '/admin',          label: '📊', text: 'ダッシュボード' },
  { href: '/admin/products', label: '🎁', text: '商品管理' },
  { href: '/admin/banners',  label: '🖼️', text: 'バナー管理' },
  { href: '/admin/settings', label: '⚙️', text: 'ガチャ設定' },
  { href: '/admin/prizes',   label: '🏆', text: '当選品管理' },
  { href: '/admin/results',  label: '📋', text: '結果一覧' },
  { href: '/admin/users',    label: '👥', text: 'ユーザー管理' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>

      {/* ── ヘッダー ── */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-3 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-black text-base truncate" style={{ color: 'var(--gold)' }}>爆ガチャ 管理</span>
            <span className="hidden sm:inline text-xs text-white/30 bg-white/10 rounded px-2 py-0.5 shrink-0">ADMIN</span>
          </div>
          {/* サイトへ戻るボタン（モバイルで目立つように大きく） */}
          <Link
            href="/"
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm transition-colors"
            style={{ background: 'var(--gold)', color: '#000' }}
          >
            ← サイトへ戻る
          </Link>
        </div>
      </header>

      {/* ── モバイルナビ（グリッド）── */}
      <nav className="md:hidden border-b border-white/10 bg-black/60 px-3 py-3">
        <div className="grid grid-cols-3 gap-2">
          {NAV.map(({ href, label, text }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 py-3 rounded-xl text-center transition-colors bg-white/5 active:bg-white/15"
              style={{ minHeight: 64 }}
            >
              <span className="text-xl leading-none">{label}</span>
              <span className="text-[11px] font-bold text-white/70 leading-tight">{text}</span>
            </Link>
          ))}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-3 md:px-4 flex gap-6 py-4 md:py-6">

        {/* ── デスクトップ サイドナビ ── */}
        <nav className="w-48 shrink-0 hidden md:block">
          <ul className="flex flex-col gap-1">
            {NAV.map(({ href, label, text }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <span>{label}</span>
                  <span>{text}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* ── メインコンテンツ ── */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
