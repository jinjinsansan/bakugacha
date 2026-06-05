'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Sparkles, Trophy, User } from 'lucide-react';

const ITEMS = [
  { href: '/', label: 'ホーム', icon: Home },
  { href: '/#products', label: 'ガチャ', icon: Sparkles },
  { href: '/#ranking', label: 'ランキング', icon: Trophy },
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
      className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/10 bg-black/90 backdrop-blur-sm"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
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
              style={{ color: active ? 'var(--gold, #c9a84c)' : 'rgba(255,255,255,0.55)' }}
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
