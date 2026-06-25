'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Trophy, User } from 'lucide-react';

const ITEMS = [
  { href: '/', label: 'ホーム', icon: Home },
  { href: '/#products', label: '一覧', icon: LayoutGrid },
  { href: '/#winners', label: '当選', icon: Trophy },
  { href: '/mypage', label: 'マイページ', icon: User },
] as const;

/** モバイル専用の下部固定ナビ。デスクトップ(md以上)では非表示。 */
export function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href.startsWith('/mypage')) return pathname.startsWith('/mypage');
    return false;
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 backdrop-blur-sm"
      style={{
        background: 'rgba(12,7,24,0.96)',
        borderTop: '1px solid rgba(255,61,166,0.22)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      aria-label="メインナビゲーション"
    >
      <div className="grid grid-cols-4 max-w-[860px] mx-auto">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-1 py-2.5"
              style={{ color: active ? 'var(--magenta-light, #ff6ec0)' : '#8a80a4' }}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
              <span className="text-[10px] font-bold tracking-wide">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
