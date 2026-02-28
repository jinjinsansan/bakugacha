'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { StarOverlay } from '@/components/gacha/overlays/StarOverlay';
import { RoundMetalButton } from '@/components/gacha/controls/RoundMetalButton';
import { startCd2Gacha } from '@/lib/api/cd2-gacha';
import { useSignedAssetResolver } from '@/lib/gacha/client-assets';
import { buildGachaAssetPath } from '@/lib/gacha/assets';
import type { Cd2Step } from '@/lib/cd2-gacha/types';

type VideoItem = {
  key: string;
  src: string;
  loop?: boolean;
  step: Cd2Step;
  showOverlay?: boolean;
  isFreeze?: boolean;
  autoAdvance?: boolean;
};

type PlayState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready';
      isWin: boolean;
      isDonden: boolean;
      isPatlite: boolean;
      isFreeze: boolean;
      sequence: Cd2Step[];
      videoBasePath: string;
      expectationStars: number;
    };

const VIDEO_VERSION = '2';

function buildQueue(sequence: Cd2Step[], basePath: string): VideoItem[] {
  const items: VideoItem[] = [];

  sequence.forEach((step, i) => {
    const key = `${i}-${step}`;

    if (step === 'standby') {
      const STANDBY_FILES = [
        'blackstandby.mp4', 'bluestandby.mp4', 'rainbowstandby.mp4',
        'redstandby.mp4', 'whitestandby.mp4', 'yellowstandby.mp4',
      ];
      const picked = STANDBY_FILES[Math.floor(Math.random() * STANDBY_FILES.length)];
      const standbyUrl = buildGachaAssetPath('cd2', 'standby', picked);
      items.push({ key, src: standbyUrl, loop: true, step });
      return;
    }

    if (step === 'freeze') {
      items.push({ key, src: '', isFreeze: true, step });
      return;
    }

    if (step === 'title_red') {
      items.push({ key, src: `${basePath}/title_red.mp4?v=${VIDEO_VERSION}`, step, showOverlay: true, autoAdvance: true });
      return;
    }

    type FileEntry = { file: string; auto?: boolean };
    const FILE_MAP: Partial<Record<Cd2Step, FileEntry>> = {
      red_10: { file: 'red_10.mp4' }, red_9: { file: 'red_9.mp4' },
      red_8:  { file: 'red_8.mp4' },  red_7: { file: 'red_7.mp4' },
      red_6:  { file: 'red_6.mp4' },  red_5: { file: 'red_5.mp4' },
      red_4:  { file: 'red_4.mp4' },  red_3: { file: 'red_3.mp4' },
      red_2:  { file: 'red_2.mp4' },  red_1: { file: 'red_1.mp4' },
      red_0:  { file: 'red_0.mp4' },
      red_3_win:  { file: 'red_3_win.mp4',  auto: true }, red_2_win:  { file: 'red_2_win.mp4',  auto: true },
      red_1_win:  { file: 'red_1_win.mp4',  auto: true }, red_0_win:  { file: 'red_0_win.mp4',  auto: true },
      red_3_loss: { file: 'red_3_loss.mp4', auto: true }, red_2_loss: { file: 'red_2_loss.mp4', auto: true },
      red_1_loss: { file: 'red_loss.mp4',   auto: true }, red_0_loss: { file: 'red_0_loss.mp4', auto: true },
      red_loss:   { file: 'red_loss.mp4',   auto: true },
      patlite: { file: 'patlite.mp4', auto: true },
      donden:  { file: 'donden.mp4',  auto: true },
      jackpot: { file: 'jackpot.mp4', auto: true },
    };

    const entry = FILE_MAP[step];
    if (entry) {
      items.push({
        key, src: `${basePath}/${entry.file}?v=${VIDEO_VERSION}`,
        step, autoAdvance: entry.auto ?? false,
      });
    }
  });

  return items;
}

// ── フリーズオーバーレイ ─────────────────────────────────────
const FREEZE_CARD_SRCS = Array.from({ length: 11 }, (_, i) => buildGachaAssetPath('cd2', 'freeze-cards', `cd_red_anime_${i}.webp`));

function FreezeOverlay() {
  const [cardIdx, setCardIdx] = useState(0);
  const [loaded, setLoaded] = useState<boolean[]>(Array(11).fill(false));

  useEffect(() => {
    FREEZE_CARD_SRCS.forEach((src, i) => {
      const img = new window.Image();
      img.onload = () => setLoaded((prev) => { const next = [...prev]; next[i] = true; return next; });
      img.src = src;
    });
  }, []);

  const allLoaded = loaded.every(Boolean);
  useEffect(() => {
    if (!allLoaded) return undefined;
    const interval = setInterval(() => setCardIdx((prev) => (prev + 1) % FREEZE_CARD_SRCS.length), 130);
    return () => clearInterval(interval);
  }, [allLoaded]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      {!allLoaded && (
        <div className="flex h-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        </div>
      )}
      {allLoaded && FREEZE_CARD_SRCS.map((src, i) => (
        <img key={src} src={src} alt="" className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: i === cardIdx ? 1 : 0 }} />
      ))}
    </div>
  );
}

// ── 結果カード（オリパワン型） ───────────────────────────────
function ResultCard({
  isWin, prizeName, prizeImageUrl, prizeEmoji, prizeGradient, coinCost,
  onClose, onRetry, onReplayAnimation,
}: {
  isWin: boolean;
  prizeName?: string;
  prizeImageUrl?: string;
  prizeEmoji?: string;
  prizeGradient?: string;
  coinCost?: number;
  onClose?: () => void;
  onRetry?: () => void;
  onReplayAnimation?: () => void;
}) {
  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: '#f2f2ed' }}>

      {/* ── ヘッダー ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-white"
        style={{ borderBottom: '1px solid #e8e8e8' }}>
        <div className="w-12" />
        <h2 className="text-sm font-bold" style={{ color: '#1a1a2e' }}>ガチャ結果</h2>
        <button
          className="text-sm font-medium"
          style={{ color: '#888' }}
          onClick={onClose}
        >
          あとで
        </button>
      </div>

      {/* ── 当選バナー（当たり時のみ） ── */}
      {isWin && (
        <button
          className="flex items-center gap-3 w-full text-left px-4 py-3"
          style={{ background: '#e53935', color: '#fff' }}
          onClick={onReplayAnimation}
        >
          <span className="text-2xl flex-shrink-0">🏆</span>
          <div className="flex-1 min-w-0">
            <p className="font-black text-sm leading-tight">当選おめでとう！</p>
            <p className="text-xs mt-0.5" style={{ opacity: 0.85 }}>ガチャ演出をもう一度見る</p>
          </div>
          <span className="text-xl flex-shrink-0" style={{ opacity: 0.8 }}>›</span>
        </button>
      )}

      {/* ── スクロールコンテンツ ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4">

        {/* 結果カード行 */}
        <div className="bg-white rounded-2xl p-3 flex gap-3"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>

          {/* 商品画像 */}
          <div
            className="w-20 flex-shrink-0 rounded-xl overflow-hidden flex items-center justify-center"
            style={{
              aspectRatio: '3/4',
              background: prizeGradient ?? 'linear-gradient(135deg,#1a1a2e,#16213e)',
            }}
          >
            {prizeImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={prizeImageUrl}
                alt={prizeName ?? ''}
                className="w-full h-full object-cover"
              />
            ) : (
              <span style={{ fontSize: 28 }}>{prizeEmoji ?? '🎰'}</span>
            )}
          </div>

          {/* 商品情報 */}
          <div className="flex-1 flex flex-col justify-between min-w-0">
            <div>
              <span
                className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-1"
                style={{
                  background: isWin ? '#fff3cd' : '#f0f0f0',
                  color: isWin ? '#92400e' : '#666',
                  border: isWin ? '1px solid #f59e0b' : '1px solid #ddd',
                }}
              >
                {isWin ? '当選' : '未当選'}
              </span>
              <p className="text-sm font-bold leading-snug" style={{ color: '#1a1a2e' }}>
                {prizeName ?? (isWin ? '当たりカード' : 'またチャレンジ！')}
              </p>
            </div>
            {coinCost != null && (
              <div
                className="mt-2 py-2 px-3 rounded-lg text-sm font-bold flex items-center gap-1.5"
                style={{ background: '#f5f5f0', color: '#555' }}
              >
                🪙 {coinCost.toLocaleString()}コイン
              </div>
            )}
          </div>
        </div>

        {/* ハズレ時メッセージ */}
        {!isWin && (
          <p className="text-center text-sm mt-4" style={{ color: '#999' }}>
            次回のチャレンジに期待しましょう！
          </p>
        )}
      </div>

      {/* ── 下部ボタン ── */}
      <div className="px-4 pb-8 pt-3 flex flex-col gap-3 bg-white"
        style={{ borderTop: '1px solid #e8e8e8' }}>
        <a href="/purchase" className="block">
          <button
            className="w-full py-3 rounded-xl font-black text-sm"
            style={{ background: 'linear-gradient(135deg,#e8cc7a,#c9a84c)', color: '#1a1200' }}
          >
            コインを購入する
          </button>
        </a>
        <button
          className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
          style={{ border: '2px solid #ddd', color: '#555', background: '#fff' }}
          onClick={onRetry}
        >
          もう一度引く 🪙 {coinCost?.toLocaleString() ?? 0}
        </button>
      </div>
    </div>
  );
}

// ── メインプレイヤー ──────────────────────────────────────────
function ActivePlayer({
  onClose, onRetry, prizeName, prizeImageUrl, prizeEmoji, prizeGradient, coinCost, productId,
}: {
  onClose?: () => void;
  onRetry?: () => void;
  prizeName?: string;
  prizeImageUrl?: string;
  prizeEmoji?: string;
  prizeGradient?: string;
  coinCost?: number;
  productId: string;
}) {
  const [playState, setPlayState] = useState<PlayState>({ status: 'loading' });
  const [queue, setQueue]         = useState<VideoItem[]>([]);
  const [index, setIndex]         = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  const videoRef        = useRef<HTMLVideoElement>(null);
  const lastReadyKeyRef = useRef<string | null>(null);
  const allowUnmuteRef  = useRef(false);

  // APIコール
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await startCd2Gacha(productId);
        if (cancelled) return;
        setQueue(buildQueue(res.sequence, res.videoBasePath));
        setPlayState({ status: 'ready', ...res });
        setIndex(0);
        setVideoReady(false);
      } catch (err) {
        if (cancelled) return;
        setPlayState({ status: 'error', message: err instanceof Error ? err.message : '開始に失敗しました' });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const allSources = useMemo(() => queue.map((v) => v.src).filter(Boolean), [queue]);
  const { resolveAssetSrc } = useSignedAssetResolver(allSources);

  const current = queue[index] ?? null;
  const stickyUrlRef = useRef<{ forIndex: number; src: string } | null>(null);
  const resolvedSrc = useMemo(() => {
    if (!current?.src) { stickyUrlRef.current = null; return null; }
    if (stickyUrlRef.current?.forIndex === index) return stickyUrlRef.current.src;
    const url = resolveAssetSrc(current.src) ?? current.src;
    stickyUrlRef.current = { forIndex: index, src: url };
    return url;
  }, [current, index, resolveAssetSrc]);

  const videoKey = current ? `${index}-${current.key}` : 'none';

  const upcomingVideos = useMemo(() =>
    queue.slice(index + 1, index + 4)
      .filter((v) => !v.loop && !v.isFreeze && v.src)
      .map((v) => resolveAssetSrc(v.src))
      .filter((s): s is string => Boolean(s)),
  [index, queue, resolveAssetSrc]);

  useEffect(() => {
    upcomingVideos.forEach((src) => { fetch(src, { cache: 'force-cache' }).catch(() => {}); });
  }, [upcomingVideos]);

  const syncPlayback = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    void v.play().then(() => {
      if (allowUnmuteRef.current && videoRef.current) videoRef.current.muted = false;
    }).catch(() => undefined);
  }, []);
  useEffect(() => { syncPlayback(); }, [syncPlayback, resolvedSrc, videoKey]);

  useEffect(() => {
    if (current?.showOverlay) {
      setShowOverlay(true);
      const t = setTimeout(() => setShowOverlay(false), 3000);
      return () => clearTimeout(t);
    }
    setShowOverlay(false);
    return undefined;
  }, [current?.showOverlay, videoKey]);

  useEffect(() => {
    if (!current?.isFreeze) return undefined;
    const t = setTimeout(() => setShowResult(true), 10000);
    return () => clearTimeout(t);
  }, [current?.isFreeze, videoKey]);

  const clearVideoSrc = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.pause(); v.src = ''; v.load();
  }, []);

  const handleReady = useCallback(() => {
    if (lastReadyKeyRef.current === videoKey) return;
    lastReadyKeyRef.current = videoKey;
    setVideoReady(true);
  }, [videoKey]);

  const handleEnded = useCallback(() => {
    lastReadyKeyRef.current = videoKey;
    if (current?.autoAdvance) {
      clearVideoSrc();
      allowUnmuteRef.current = true;
      const next = index + 1;
      if (next >= queue.length) { setShowResult(true); return; }
      setVideoReady(false); setIndex(next);
    } else {
      setVideoReady(true);
    }
  }, [videoKey, current?.autoAdvance, index, queue.length, clearVideoSrc]);

  const handleError = useCallback(() => { setVideoReady(true); }, []);

  useEffect(() => {
    if (videoReady || current?.isFreeze || current?.autoAdvance) return undefined;
    const t = setTimeout(() => setVideoReady(true), 1500);
    return () => clearTimeout(t);
  }, [videoReady, videoKey, current?.isFreeze, current?.autoAdvance]);

  const goNext = useCallback(() => {
    if (!queue.length) return;
    clearVideoSrc();
    allowUnmuteRef.current = true;
    const next = index + 1;
    if (next >= queue.length) { setShowResult(true); return; }
    setVideoReady(false); setIndex(next);
  }, [index, queue.length, clearVideoSrc]);

  // 演出をもう一度見る（API再コールなし）
  const handleReplayAnimation = useCallback(() => {
    clearVideoSrc();
    allowUnmuteRef.current = false;
    stickyUrlRef.current = null;
    lastReadyKeyRef.current = null;
    setShowResult(false);
    setVideoReady(false);
    setIndex(0);
  }, [clearVideoSrc]);

  const isFreezeStep = Boolean(current?.isFreeze);
  const isAutoStep   = Boolean(current?.autoAdvance);
  const nextDisabled = !videoReady || playState.status !== 'ready' || isFreezeStep;
  const showButtons  = !isFreezeStep && !isAutoStep;
  const expStars     = playState.status === 'ready' ? playState.expectationStars : 0;
  const isWin        = playState.status === 'ready' ? playState.isWin : false;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black">
      <div className="relative flex h-full w-full max-w-[430px] flex-col">

        {playState.status === 'loading' && <div className="h-full bg-black" />}

        {playState.status === 'error' && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-white">
            <p className="text-lg font-bold">チャレンジを開始できませんでした</p>
            <p className="text-sm text-white/70">{playState.message}</p>
            <RoundMetalButton label="閉じる" subLabel="CLOSE" onClick={onClose} />
          </div>
        )}

        {playState.status === 'ready' && current && !showResult && (
          <>
            {isFreezeStep ? (
              <div className="h-full w-full"><FreezeOverlay /></div>
            ) : (
              <div className="relative h-full w-full overflow-hidden"
                style={{ background: '#000', WebkitTransform: 'translate3d(0,0,0)', transform: 'translate3d(0,0,0)' }}>
                <div className="absolute inset-0 bg-black" />
                <video
                  ref={videoRef}
                  src={resolvedSrc ?? undefined}
                  className="absolute inset-0 block h-full w-full object-cover"
                  autoPlay muted preload="auto"
                  loop={Boolean(current.loop)}
                  playsInline
                  onCanPlayThrough={handleReady}
                  onLoadedData={handleReady}
                  onEnded={handleEnded}
                  onError={handleError}
                  style={{ background: '#000' }}
                />
                <div className="pointer-events-none absolute inset-0 bg-black"
                  style={{ opacity: videoReady ? 0 : 1 }} />
                {showOverlay && expStars > 0 && <StarOverlay starCount={expStars} />}
              </div>
            )}

            {showButtons && (
              <div className="absolute bottom-12 left-0 right-0 flex items-center justify-center gap-4">
                <RoundMetalButton label="NEXT" subLabel="進む" onClick={goNext} disabled={nextDisabled} />
                <RoundMetalButton label="SKIP" subLabel="スキップ" onClick={() => setShowResult(true)} />
              </div>
            )}
          </>
        )}

        {showResult && playState.status === 'ready' && (
          <ResultCard
            isWin={isWin}
            prizeName={prizeName}
            prizeImageUrl={prizeImageUrl}
            prizeEmoji={prizeEmoji}
            prizeGradient={prizeGradient}
            coinCost={coinCost}
            onClose={onClose}
            onRetry={onRetry}
            onReplayAnimation={handleReplayAnimation}
          />
        )}
      </div>

      {/* 先読み */}
      <div aria-hidden style={{ position: 'fixed', top: -2, left: -2, width: 1, height: 1, opacity: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {upcomingVideos.map((src) => (
          <video key={src} src={src} preload="auto" playsInline muted autoPlay />
        ))}
      </div>
    </div>
  );
}

// ── Portal ────────────────────────────────────────────────────
export function Cd2GachaPlayer({
  open, onClose, onRetry, prizeName, prizeImageUrl, prizeEmoji, prizeGradient, coinCost, productId,
}: {
  open: boolean;
  onClose?: () => void;
  onRetry?: () => void;
  prizeName?: string;
  prizeImageUrl?: string;
  prizeEmoji?: string;
  prizeGradient?: string;
  coinCost?: number;
  productId: string;
}) {
  useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const nav = document.querySelector('nav') as HTMLElement | null;
    const prevNav = nav?.style.display;
    if (nav) nav.style.display = 'none';
    return () => {
      document.body.style.overflow = prev;
      if (nav) nav.style.display = prevNav ?? '';
    };
  }, [open]);

  const portalTarget = typeof window === 'undefined' ? null : document.body;
  if (!open || !portalTarget) return null;
  return createPortal(
    <ActivePlayer
      onClose={onClose}
      onRetry={onRetry}
      prizeName={prizeName}
      prizeImageUrl={prizeImageUrl}
      prizeEmoji={prizeEmoji}
      prizeGradient={prizeGradient}
      coinCost={coinCost}
      productId={productId}
    />,
    portalTarget,
  );
}
