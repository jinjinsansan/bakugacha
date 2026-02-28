'use client';

import { useState, useEffect } from 'react';

const banners = [
  {
    id: 'b1',
    photo: 'https://picsum.photos/seed/banner-reg/800/200',
    overlay: 'linear-gradient(90deg, rgba(5,5,20,0.92) 0%, rgba(5,5,20,0.7) 50%, rgba(5,5,20,0.3) 100%)',
    tag: '🎉 新規登録キャンペーン',
    title: '新規登録で無料ガチャGET！',
    sub: '今だけ登録するだけで1回無料',
    badge: 'TODAY ONLY', badgeColor: '#c9a84c',
  },
  {
    id: 'b2',
    photo: 'https://picsum.photos/seed/banner-poke/800/200',
    overlay: 'linear-gradient(90deg, rgba(10,20,60,0.92) 0%, rgba(10,20,60,0.7) 50%, rgba(10,20,60,0.2) 100%)',
    tag: '🎴 ポケモンカード',
    title: '新弾入荷！SAR・SR大量封入',
    sub: '引くなら今がチャンス',
    badge: 'NEW', badgeColor: '#4ade80',
  },
  {
    id: 'b3',
    photo: 'https://picsum.photos/seed/banner-switch/800/200',
    overlay: 'linear-gradient(90deg, rgba(60,5,5,0.92) 0%, rgba(60,5,5,0.7) 50%, rgba(60,5,5,0.2) 100%)',
    tag: '🕹️ 任天堂スイッチ',
    title: '任天堂スイッチが当たる！',
    sub: '¥500から挑戦できる超お得ガチャ',
    badge: '大人気', badgeColor: '#f97316',
  },
  {
    id: 'b4',
    photo: 'https://picsum.photos/seed/banner-amazon/800/200',
    overlay: 'linear-gradient(90deg, rgba(5,15,50,0.92) 0%, rgba(5,15,50,0.7) 50%, rgba(5,15,50,0.2) 100%)',
    tag: '🎁 Amazonギフト券',
    title: '最大¥50,000分が当たる！',
    sub: '毎日引けるチャンス',
    badge: '毎日更新', badgeColor: '#60a5fa',
  },
  {
    id: 'b5',
    photo: 'https://picsum.photos/seed/banner-yugi/800/200',
    overlay: 'linear-gradient(90deg, rgba(30,5,60,0.92) 0%, rgba(30,5,60,0.7) 50%, rgba(30,5,60,0.2) 100%)',
    tag: '⚔️ 遊戯王',
    title: '激レアカード確定パック登場！',
    sub: 'ブラックマジシャン・青眼が確定入り',
    badge: '限定', badgeColor: '#e879f9',
  },
];

export function CampaignBanner() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrent((c) => (c + 1) % banners.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const b = banners[current];

  return (
    <section className="relative max-w-[860px] w-full mx-auto my-3 px-3">
      <div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: '4/1' }}>

        {/* 背景写真 */}
        <img
          key={b.id}
          src={b.photo}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
          style={{ filter: 'brightness(0.7) saturate(0.8)' }}
        />

        {/* オーバーレイ */}
        <div className="absolute inset-0" style={{ background: b.overlay }} />

        {/* 光沢エフェクト */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 60%)' }}
        />

        {/* コンテンツ */}
        <div className="relative z-10 h-full flex items-center justify-between px-6 md:px-8">
          <div>
            <span className="text-[10px] font-bold tracking-[0.25em] uppercase mb-1 block text-gold">
              {b.tag}
            </span>
            <h3
              className="text-white font-black text-lg md:text-2xl leading-tight mb-1"
              style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
            >
              {b.title}
            </h3>
            <p className="text-white/50 text-xs tracking-wide">{b.sub}</p>
          </div>

          <div className="flex-shrink-0 ml-4">
            <span
              className="text-xs font-black px-3 py-1.5 rounded-full"
              style={{
                background: b.badgeColor,
                color: '#fff',
                boxShadow: `0 0 14px ${b.badgeColor}99, inset 0 1px 0 rgba(255,255,255,0.25)`,
                letterSpacing: '0.05em',
              }}
            >
              {b.badge}
            </span>
          </div>
        </div>

        {/* 前後ボタン */}
        <button
          onClick={() => setCurrent((c) => (c - 1 + banners.length) % banners.length)}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center z-20 transition-colors"
          style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}
        >
          ‹
        </button>
        <button
          onClick={() => setCurrent((c) => (c + 1) % banners.length)}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center z-20 transition-colors"
          style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}
        >
          ›
        </button>
      </div>

      {/* ドット */}
      <div className="flex justify-center gap-1.5 mt-2">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === current ? '20px' : '6px',
              background: i === current ? '#c9a84c' : 'rgba(255,255,255,0.2)',
            }}
          />
        ))}
      </div>
    </section>
  );
}
