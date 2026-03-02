'use client';

import { useEffect, useState } from 'react';
import { Cd2GachaPlayer } from '@/components/gacha/Cd2GachaPlayer';

type Props = {
  productId: string;
  productTitle: string;
  price: number;
  isLoggedIn: boolean;
  gachaType?: string;
  prizeImageUrl?: string;
  prizeEmoji?: string;
  prizeGradient?: string;
};

export function GachaPlayButton({
  productId, productTitle, price, isLoggedIn, gachaType = 'cd2',
  prizeImageUrl, prizeEmoji, prizeGradient,
}: Props) {
  const [open, setOpen] = useState(false);
  const [quality, setQuality] = useState<'high' | 'low'>('high');

  useEffect(() => {
    if (typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      setQuality('low');
    }
  }, []);

  if (!isLoggedIn) {
    return (
      <a href="/register" className="block">
        <button className="btn-gold w-full py-4 rounded-2xl font-black text-base tracking-wider">
          🎰 登録して無料でガチャを引く
        </button>
      </a>
    );
  }

  return (
    <>
      <button
        className="btn-gold w-full py-4 rounded-2xl font-black text-base tracking-wider"
        onClick={() => setOpen(true)}
      >
        🎰 ガチャを引く（{price === 0 ? '無料' : `🪙 ${price.toLocaleString()}`}）
      </button>

      <div className="mt-2 flex justify-center gap-2 text-[11px] text-gray-400">
        <button
          type="button"
          onClick={() => setQuality('low')}
          className={`px-2 py-1 rounded-full border text-[11px] ${
            quality === 'low'
              ? 'border-yellow-400 text-yellow-300 bg-yellow-400/10'
              : 'border-white/10 text-gray-400 bg-white/5'
          }`}
        >
          軽量モード
        </button>
        <button
          type="button"
          onClick={() => setQuality('high')}
          className={`px-2 py-1 rounded-full border text-[11px] ${
            quality === 'high'
              ? 'border-white text-white bg-white/10'
              : 'border-white/10 text-gray-400 bg-white/5'
          }`}
        >
          高画質モード
        </button>
      </div>

      {/* ガチャタイプ別プレイヤー分岐 — 将来新タイプ追加時はここに case を追加 */}
      {gachaType === 'cd2' && (
        <Cd2GachaPlayer
          open={open}
          onClose={() => setOpen(false)}
          onRetry={() => { setOpen(false); setTimeout(() => setOpen(true), 100); }}
          prizeName={productTitle}
          prizeImageUrl={prizeImageUrl}
          prizeEmoji={prizeEmoji}
          prizeGradient={prizeGradient}
          coinCost={price}
          productId={productId}
          quality={quality}
        />
      )}
    </>
  );
}
