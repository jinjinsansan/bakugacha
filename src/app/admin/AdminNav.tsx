'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Item = { href: string; label: string; text: string };

const SECTIONS: { title: string; items: Item[] }[] = [
  {
    title: '運用',
    items: [
      { href: '/admin', label: '📊', text: 'ダッシュボード' },
      { href: '/admin/results', label: '📋', text: '結果・分析' },
      { href: '/admin/users', label: '👥', text: 'ユーザー' },
    ],
  },
  {
    title: 'コンテンツ',
    items: [
      { href: '/admin/products', label: '🎰', text: '商品(ガチャ)' },
      { href: '/admin/banners', label: '🖼️', text: 'バナー' },
      { href: '/admin/prize-master', label: '🏷️', text: '景品マスタ' },
      { href: '/admin/prizes', label: '🏆', text: '当選品' },
    ],
  },
  {
    title: '販促',
    items: [{ href: '/admin/promo-codes', label: '🎫', text: 'プロモコード' }],
  },
  {
    title: '設定',
    items: [{ href: '/admin/settings', label: '⚙️', text: 'ガチャ設定' }],
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(href + '/');
}

/** 管理画面ナビ（セクション分け＋現在地ハイライト）。variant でモバイル/デスクトップを切替。 */
export function AdminNav({ variant }: { variant: 'mobile' | 'desktop' }) {
  const pathname = usePathname();

  if (variant === 'mobile') {
    return (
      <nav className="md:hidden border-b border-white/10 bg-black/60 px-3 py-3 flex flex-col gap-3" aria-label="管理ナビ">
        {SECTIONS.map((s) => (
          <div key={s.title}>
            <p className="text-[10px] font-bold text-white/30 tracking-widest mb-1.5">{s.title}</p>
            <div className="grid grid-cols-3 gap-2">
              {s.items.map((it) => {
                const on = isActive(pathname, it.href);
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    aria-current={on ? 'page' : undefined}
                    className="flex flex-col items-center gap-1 py-2.5 rounded-xl text-center transition-colors"
                    style={{ minHeight: 60, background: on ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.05)' }}
                  >
                    <span className="text-lg leading-none">{it.label}</span>
                    <span className="text-[10px] font-bold leading-tight" style={{ color: on ? 'var(--gold, #c9a84c)' : 'rgba(255,255,255,0.7)' }}>
                      {it.text}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    );
  }

  return (
    <nav className="w-48 shrink-0 hidden md:block" aria-label="管理ナビ">
      <div className="flex flex-col gap-4">
        {SECTIONS.map((s) => (
          <div key={s.title}>
            <p className="text-[10px] font-bold text-white/30 tracking-widest px-3 mb-1">{s.title}</p>
            <ul className="flex flex-col gap-1">
              {s.items.map((it) => {
                const on = isActive(pathname, it.href);
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      aria-current={on ? 'page' : undefined}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-white/10"
                      style={{ background: on ? 'rgba(201,168,76,0.15)' : 'transparent', color: on ? 'var(--gold, #c9a84c)' : 'rgba(255,255,255,0.7)' }}
                    >
                      <span>{it.label}</span>
                      <span>{it.text}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
