import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/admin';
import { AdminNav } from './AdminNav';

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

      {/* ── モバイルナビ（セクション分け＋現在地ハイライト）── */}
      <AdminNav variant="mobile" />

      <div className="max-w-6xl mx-auto px-3 md:px-4 flex gap-6 py-4 md:py-6">

        {/* ── デスクトップ サイドナビ ── */}
        <AdminNav variant="desktop" />

        {/* ── メインコンテンツ ── */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
