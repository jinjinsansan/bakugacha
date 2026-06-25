'use client';

import { useEffect, useState } from 'react';
import { Cd2GachaPlayer } from '@/components/gacha/Cd2GachaPlayer';
// ── お蔵入りガチャ（2026-06 時点で本番非公開）──────────────────
// 復活させる場合はこの import と、下部の gachaType 分岐、および
// 管理画面 GACHA_TYPES（src/app/admin/products/new/page.tsx）を合わせて復活させること。
// import { EcardGachaPlayer } from '@/components/gacha/EcardGachaPlayer';
// import { ElevatorGachaPlayer } from '@/components/gacha/ElevatorGachaPlayer';
// import { KeibaGachaPlayer } from '@/components/gacha/KeibaGachaPlayer';
// import { RaiseGachaPlayer } from '@/components/gacha/RaiseGachaPlayer';

type Props = {
  productId: string;
  productTitle: string;
  price: number;
  isLoggedIn: boolean;
  userCoins?: number;
  gachaType?: string;
  prizeImageUrl?: string;
  prizeEmoji?: string;
  prizeGradient?: string;
  requiresAccessCode?: boolean;
  bonusWinVideoUrl?: string;
};

export function GachaPlayButton({
  productId, productTitle, price, isLoggedIn, userCoins = 0, gachaType = 'cd2',
  prizeImageUrl, prizeEmoji, prizeGradient, requiresAccessCode = false,
  bonusWinVideoUrl,
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
      <a href="/login" className="block">
        <button className="btn-gold w-full py-4 rounded-2xl font-black text-base tracking-wider">
          ログインしてガチャを引く
        </button>
      </a>
    );
  }

  // コイン不足判定（権利コード商品・無料商品は対象外）
  const insufficient = !requiresAccessCode && price > 0 && userCoins < price;

  return (
    <>
      {requiresAccessCode ? (
        <div className="flex flex-col gap-3">
          <div
            className="rounded-xl p-4"
            style={{
              background: 'linear-gradient(135deg, rgba(154,123,255,0.12), rgba(154,123,255,0.04))',
              border: '1px solid rgba(154,123,255,0.35)',
            }}
          >
            <p className="text-xs font-bold text-purple-300 mb-2">この商品は権利コードが必要です</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                placeholder="権利コードを入力"
                aria-label="権利コード"
                autoComplete="off"
                autoCapitalize="characters"
                maxLength={20}
                className="flex-1 min-w-0 rounded-lg bg-white/10 border border-white/15 px-3 py-2.5 text-sm font-bold text-white placeholder-white/30 focus:outline-none focus:border-purple-400/70 uppercase tracking-wider"
              />
              <button
                className="shrink-0 px-5 py-2.5 rounded-lg font-black text-sm text-white disabled:opacity-50"
                style={{
                  background: accessCode.trim()
                    ? 'linear-gradient(135deg, #9a7bff, #7c3aed)'
                    : 'rgba(255,255,255,0.1)',
                }}
                disabled={!accessCode.trim()}
                onClick={() => setOpen(true)}
              >
                引く
              </button>
            </div>
          </div>
        </div>
      ) : insufficient ? (
        <div className="flex flex-col gap-2">
          <div
            className="rounded-2xl py-3 px-4 text-center text-sm font-bold"
            style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.35)', color: '#fca5a5' }}
          >
            コインが不足しています（必要 {price.toLocaleString()}C / 所持 {userCoins.toLocaleString()}C）
          </div>
          <a href="/purchase" className="block">
            <button className="btn-gold w-full py-4 rounded-2xl font-black text-base tracking-wider">
              コインをチャージする
            </button>
          </a>
        </div>
      ) : (
        <button
          className="btn-gold w-full py-4 rounded-2xl font-black text-base tracking-wider"
          onClick={() => setOpen(true)}
        >
          ガチャを引く（{price === 0 ? '無料' : `${price.toLocaleString()}`}）
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
          onClose={() => { setOpen(false); if (requiresAccessCode) setAccessCode(''); }}
          onRetry={() => { setOpen(false); setTimeout(() => setOpen(true), 100); }}
          prizeName={productTitle}
          prizeImageUrl={prizeImageUrl}
          prizeEmoji={prizeEmoji}
          prizeGradient={prizeGradient}
          coinCost={price}
          productId={productId}
          quality={quality}
          accessCode={accessCode}
          bonusWinVideoUrl={bonusWinVideoUrl}
        />
      )}
      {/* ── お蔵入りガチャの分岐（2026-06 時点で本番非公開）──────────
          復活させる場合は下のコメントを解除し、ファイル冒頭の import と
          管理画面 GACHA_TYPES も合わせて復活させること。
      {gachaType === 'ecard' && (
        <EcardGachaPlayer
          open={open}
          onClose={() => { setOpen(false); if (requiresAccessCode) setAccessCode(''); }}
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
          onClose={() => { setOpen(false); if (requiresAccessCode) setAccessCode(''); }}
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
          onClose={() => { setOpen(false); if (requiresAccessCode) setAccessCode(''); }}
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
          onClose={() => { setOpen(false); if (requiresAccessCode) setAccessCode(''); }}
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
          onClose={() => { setOpen(false); if (requiresAccessCode) setAccessCode(''); }}
          onRetry={() => { setOpen(false); setTimeout(() => setOpen(true), 100); }}
          coinCost={price}
          productId={productId}
          quality={quality}
          characterId="shoichi"
          accessCode={accessCode}
        />
      )}
      ──────────────────────────────────────────────────────────── */}
    </>
  );
}
