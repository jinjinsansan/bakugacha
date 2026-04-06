'use client';

import { useEffect, useState } from 'react';
import { Cd2GachaPlayer } from '@/components/gacha/Cd2GachaPlayer';
import { EcardGachaPlayer } from '@/components/gacha/EcardGachaPlayer';
import { ElevatorGachaPlayer } from '@/components/gacha/ElevatorGachaPlayer';
import { KeibaGachaPlayer } from '@/components/gacha/KeibaGachaPlayer';
import { RaiseGachaPlayer } from '@/components/gacha/RaiseGachaPlayer';

type Props = {
  productId: string;
  productTitle: string;
  price: number;
  isLoggedIn: boolean;
  gachaType?: string;
  prizeImageUrl?: string;
  prizeEmoji?: string;
  prizeGradient?: string;
  requiresAccessCode?: boolean;
};

export function GachaPlayButton({
  productId, productTitle, price, isLoggedIn, gachaType = 'cd2',
  prizeImageUrl, prizeEmoji, prizeGradient, requiresAccessCode = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [quality, setQuality] = useState<'high' | 'low'>('high');
  const [accessCode, setAccessCode] = useState('');

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
      {requiresAccessCode ? (
        <div className="flex flex-col gap-3">
          <div
            className="rounded-xl p-4"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(139,92,246,0.04))',
              border: '1px solid rgba(139,92,246,0.35)',
            }}
          >
            <p className="text-xs font-bold text-purple-300 mb-2">🎟️ この商品は権利コードが必要です</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                placeholder="権利コードを入力"
                maxLength={20}
                className="flex-1 min-w-0 rounded-lg bg-white/10 border border-white/15 px-3 py-2.5 text-sm font-bold text-white placeholder-white/30 focus:outline-none focus:border-purple-400/70 uppercase tracking-wider"
              />
              <button
                className="shrink-0 px-5 py-2.5 rounded-lg font-black text-sm text-white disabled:opacity-50"
                style={{
                  background: accessCode.trim()
                    ? 'linear-gradient(135deg, #7c3aed, #5b21b6)'
                    : 'rgba(255,255,255,0.1)',
                }}
                disabled={!accessCode.trim()}
                onClick={() => setOpen(true)}
              >
                🎰 引く
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          className="btn-gold w-full py-4 rounded-2xl font-black text-base tracking-wider"
          onClick={() => setOpen(true)}
        >
          🎰 ガチャを引く（{price === 0 ? '無料' : `🪙 ${price.toLocaleString()}`}）
        </button>
      )}

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

      {/* ガチャタイプ別プレイヤー分岐 */}
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
          accessCode={accessCode}
        />
      )}
      {gachaType === 'ecard' && (
        <EcardGachaPlayer
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
          accessCode={accessCode}
        />
      )}
      {gachaType === 'elevator' && (
        <ElevatorGachaPlayer
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
          accessCode={accessCode}
        />
      )}
      {gachaType === 'keiba' && (
        <KeibaGachaPlayer
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
          accessCode={accessCode}
        />
      )}
      {gachaType === 'raise_kenta' && (
        <RaiseGachaPlayer
          open={open}
          onClose={() => setOpen(false)}
          onRetry={() => { setOpen(false); setTimeout(() => setOpen(true), 100); }}
          coinCost={price}
          productId={productId}
          quality={quality}
          characterId="kenta"
          accessCode={accessCode}
        />
      )}
      {gachaType === 'raise_shoichi' && (
        <RaiseGachaPlayer
          open={open}
          onClose={() => setOpen(false)}
          onRetry={() => { setOpen(false); setTimeout(() => setOpen(true), 100); }}
          coinCost={price}
          productId={productId}
          quality={quality}
          characterId="shoichi"
          accessCode={accessCode}
        />
      )}
    </>
  );
}
