'use client';

import { useState, useEffect } from 'react';

export interface BannerData {
  id: string;
  title: string;
  subtitle: string | null;
  tag: string | null;
  badge: string | null;
  badge_color: string;
  image_url: string | null;
  overlay: string | null;
  link_url: string | null;
  show_text: boolean;
}

interface CampaignBannerProps {
  banners?: BannerData[];
}

// バナーの外枠（リンク有無で <a>/<div> を切り替え）。
// render 中にコンポーネントを生成しないようモジュールスコープで定義する。
function BannerShell({ href, children }: { href: string | null; children: React.ReactNode }) {
  const className = 'relative overflow-hidden rounded-xl block';
  const style: React.CSSProperties = { aspectRatio: '4 / 1', maxHeight: '220px' };
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className={className} style={style}>
      {children}
    </a>
  ) : (
    <div className={className} style={style}>
      {children}
    </div>
  );
}

export function CampaignBanner({ banners: propBanners }: CampaignBannerProps) {
  const banners = propBanners ?? [];
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (banners.length === 0) return;
    const timer = setInterval(() => setCurrent((c) => (c + 1) % banners.length), 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  // 表示するバナーが無い場合は何も描画しない（誤解を招くダミーは出さない）
  if (banners.length === 0) return null;

  const b = banners[current];

  return (
    <section className="relative max-w-[860px] w-full mx-auto my-3 px-1 sm:px-3">
      <BannerShell href={b.link_url}>

        {/* 背景写真 */}
        {b.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={b.id}
            src={b.image_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
            style={b.overlay ? { filter: 'brightness(0.7) saturate(0.8)' } : undefined}
          />
        )}

        {/* オーバーレイ */}
        {b.overlay && <div className="absolute inset-0" style={{ background: b.overlay }} />}

        {/* 光沢エフェクト */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 60%)' }}
        />

        {/* コンテンツ（テキスト表示が ON のときのみ。画像に文字を焼き込む場合は OFF） */}
        {b.show_text && (
          <div className="relative z-10 h-full flex items-center justify-between px-4 sm:px-6 md:px-8">
            <div>
              {b.tag && (
                <span className="text-[10px] font-bold tracking-[0.25em] uppercase mb-1 block text-gold">
                  {b.tag}
                </span>
              )}
              <h3
                className="text-white font-black text-base sm:text-lg md:text-2xl leading-tight mb-1"
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
              >
                {b.title}
              </h3>
              {b.subtitle && (
                <p className="text-white/50 text-xs tracking-wide">{b.subtitle}</p>
              )}
            </div>

            {b.badge && (
              <div className="flex-shrink-0 ml-4">
                <span
                  className="text-xs font-black px-3 py-1.5 rounded-full"
                  style={{
                    background: b.badge_color,
                    color: '#fff',
                    boxShadow: `0 0 14px ${b.badge_color}99, inset 0 1px 0 rgba(255,255,255,0.25)`,
                    letterSpacing: '0.05em',
                  }}
                >
                  {b.badge}
                </span>
              </div>
            )}
          </div>
        )}

      </BannerShell>

      {/* 前後ボタン */}
      <button
        onClick={() => setCurrent((c) => (c - 1 + banners.length) % banners.length)}
        className="absolute left-5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center z-20 transition-colors"
        style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}
      >
        ‹
      </button>
      <button
        onClick={() => setCurrent((c) => (c + 1) % banners.length)}
        className="absolute right-5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center z-20 transition-colors"
        style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}
      >
        ›
      </button>

      {/* ドット */}
      <div className="flex justify-center gap-1.5 mt-2">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === current ? '20px' : '6px',
              background: i === current ? '#ff72bf' : 'rgba(255,255,255,0.2)',
            }}
          />
        ))}
      </div>
    </section>
  );
}
