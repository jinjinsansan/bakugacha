'use client';

import { useState } from 'react';
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
        />
      )}
    </>
  );
}
