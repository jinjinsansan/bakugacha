'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { StarOverlay } from '@/components/gacha/overlays/StarOverlay';
import { RoundMetalButton } from '@/components/gacha/controls/RoundMetalButton';
import { startEcardGacha } from '@/lib/api/ecard-gacha';
import { useSignedAssetResolver } from '@/lib/gacha/client-assets';
import { buildGachaAssetPath } from '@/lib/gacha/assets';
import type { EcardStep } from '@/lib/ecard-gacha/types';

type VideoItem = {
  key: string;
  src: string;
  loop?: boolean;
  step: EcardStep;
  showOverlay?: boolean;
  autoAdvance?: boolean;
  reverse?: boolean;
};

type PlayState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready';
      isWin: boolean;
      isDonten: boolean;
      sequence: EcardStep[];
      videoBasePath: string;
      expectationStars: number;
      scenarioCode: string;
    };

const VIDEO_VERSION = '2';

function buildQueue(sequence: EcardStep[], basePath: string): VideoItem[] {
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

    if (step === 'title') {
      items.push({
        key,
        src: `${basePath}/ecard_title.mp4?v=${VIDEO_VERSION}`,
        step,
        showOverlay: true,
        autoAdvance: true,
      });
      return;
    }

    // autoAdvance steps (play through without NEXT button)
    const AUTO_STEPS: EcardStep[] = ['donten', 'final_win', 'final_lose'];

    // 皇帝・奴隷は逆再生版を使用
    const REVERSE_STEPS: EcardStep[] = ['my_emperor', 'my_slave', 'opp_emperor', 'opp_slave'];

    // Map step to file name
    const FILE_MAP: Partial<Record<EcardStep, string>> = {
      my_blackout:  'ecard_my_blackout.mp4',
      opp_blackout: 'ecard_opp_blackout.mp4',
      my_card_back: 'ecard_my_card_back.mp4',
      opp_card_back: 'ecard_opp_card_back.mp4',
      my_emperor:   'ecard_my_emperor_reverse.mp4',
      my_slave:     'ecard_my_slave_reverse.mp4',
      my_citizen:   'ecard_my_citizen.mp4',
      opp_emperor:  'ecard_opp_king_reverse.mp4',
      opp_slave:    'ecard_opp_joker_reverse.mp4',
      opp_citizen:  'ecard_opp_citizen.mp4',
      win:          'ecard_win.mp4',
      lose:         'ecard_lose.mp4',
      draw:         'ecard_draw.mp4',
      donten:       'ecard_donten.mp4',
      final_win:    'ecard_final_win.mp4',
      final_lose:   'ecard_lose.mp4',
    };

    const fileName = FILE_MAP[step];
    if (fileName) {
      items.push({
        key,
        src: `${basePath}/${fileName}?v=${VIDEO_VERSION}`,
        step,
        autoAdvance: AUTO_STEPS.includes(step),
        reverse: REVERSE_STEPS.includes(step),
      });
    }
  });

  return items;
}

// ── 結果カード（CD2と同パターン） ─────────────────────────────
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
      <div className="flex items-center justify-between px-4 py-3 bg-white"
        style={{ borderBottom: '1px solid #e8e8e8' }}>
        <div className="w-12" />
        <h2 className="text-sm font-bold" style={{ color: '#1a1a2e' }}>ガチャ結果</h2>
        <button className="text-sm font-medium" style={{ color: '#888' }} onClick={onClose}>
          あとで
        </button>
      </div>

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

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="bg-white rounded-2xl p-3 flex gap-3"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <div
            className="w-20 flex-shrink-0 rounded-xl overflow-hidden flex items-center justify-center"
            style={{
              aspectRatio: '3/4',
              background: prizeGradient ?? 'linear-gradient(135deg,#1a1a2e,#16213e)',
            }}
          >
            {prizeImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={prizeImageUrl} alt={prizeName ?? ''} className="w-full h-full object-cover" />
            ) : (
              <span style={{ fontSize: 28 }}>{prizeEmoji ?? '🃏'}</span>
            )}
          </div>
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

        {!isWin && (
          <p className="text-center text-sm mt-4" style={{ color: '#999' }}>
            次回のチャレンジに期待しましょう！
          </p>
        )}
      </div>

      <div className="px-4 pt-3 flex flex-col gap-3 bg-white"
        style={{ borderTop: '1px solid #e8e8e8', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>
        <button
          className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
          style={{ border: '2px solid #ddd', color: '#555', background: '#fff' }}
          onClick={onRetry}
        >
          もう一度引く 🪙 {coinCost?.toLocaleString() ?? 0}
        </button>
        <div className="grid grid-cols-4 gap-2">
          {([
            { href: '/home',           icon: '🏠', label: '爆ガチャ' },
            { href: '/mypage#history', icon: '🎁', label: '獲得商品' },
            { href: '/purchase',       icon: '🪙', label: 'コイン' },
            { href: '/mypage',         icon: '👤', label: 'マイページ' },
          ] as const).map(({ href, icon, label }) => (
            <a key={label} href={href} className="flex flex-col items-center gap-1 py-2 rounded-xl"
              style={{ background: '#f5f5f0' }}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              <span className="text-[10px] font-bold" style={{ color: '#555' }}>{label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── メインプレイヤー ──────────────────────────────────────────
function ActivePlayer({
  onClose, onRetry, prizeName, prizeImageUrl, prizeEmoji, prizeGradient, coinCost, productId, quality,
}: {
  onClose?: () => void;
  onRetry?: () => void;
  prizeName?: string;
  prizeImageUrl?: string;
  prizeEmoji?: string;
  prizeGradient?: string;
  coinCost?: number;
  productId: string;
  quality: 'high' | 'low';
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
  const reverseAnimRef  = useRef<number>(0);
  const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // APIコール
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await startEcardGacha(productId, quality);
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
  }, [productId, quality]);

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
      .filter((v) => !v.loop && v.src)
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
  useEffect(() => {
    if (current?.reverse) return; // 逆再生は別エフェクトで処理
    syncPlayback();
  }, [syncPlayback, resolvedSrc, videoKey, current?.reverse]);

  // ── 逆再生処理 ───────────────────────────────────────────────
  useEffect(() => {
    if (!current?.reverse) return undefined;
    const v = videoRef.current;
    if (!v) return undefined;

    let cancelled = false;
    cancelAnimationFrame(reverseAnimRef.current);
    let lastTs: number | null = null;

    const stepBack = (ts: number) => {
      if (cancelled) return;
      if (!lastTs) { lastTs = ts; reverseAnimRef.current = requestAnimationFrame(stepBack); return; }
      const delta = (ts - lastTs) / 1000;
      lastTs = ts;
      if (v.currentTime <= 0.05) {
        v.currentTime = 0;
        setVideoReady(true);
        return;
      }
      v.currentTime = Math.max(0, v.currentTime - delta);
      reverseAnimRef.current = requestAnimationFrame(stepBack);
    };

    const startReverse = () => {
      if (cancelled) return;
      v.pause();
      v.muted = true;
      if (v.duration > 0) v.currentTime = v.duration - 0.05;
      reverseAnimRef.current = requestAnimationFrame(stepBack);
    };

    if (v.readyState >= 2 && v.duration > 0) {
      startReverse();
    } else {
      v.addEventListener('loadeddata', startReverse, { once: true });
    }

    // フォールバック: 5秒以内に完了しなければ強制的にvideoReadyをtrueにする
    const fallbackTimer = setTimeout(() => {
      if (!cancelled) {
        cancelAnimationFrame(reverseAnimRef.current);
        setVideoReady(true);
      }
    }, 5000);

    return () => {
      cancelled = true;
      cancelAnimationFrame(reverseAnimRef.current);
      clearTimeout(fallbackTimer);
      v.removeEventListener('loadeddata', startReverse);
    };
  }, [current?.reverse, videoKey]);

  useEffect(() => {
    if (current?.showOverlay) {
      setShowOverlay(true);
      const t = setTimeout(() => setShowOverlay(false), 3000);
      return () => clearTimeout(t);
    }
    setShowOverlay(false);
    return undefined;
  }, [current?.showOverlay, videoKey]);

  const clearVideoSrc = useCallback(() => {
    cancelAnimationFrame(reverseAnimRef.current);
    const v = videoRef.current;
    if (!v) return;
    v.pause(); v.src = ''; v.load();
  }, []);

  const handleReady = useCallback(() => {
    if (current?.reverse) return; // 逆再生は専用エフェクトで制御
    if (lastReadyKeyRef.current === videoKey) return;
    lastReadyKeyRef.current = videoKey;
    setVideoReady(true);
  }, [videoKey, current?.reverse]);

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
    if (videoReady || current?.autoAdvance || current?.reverse) return undefined;
    const timeout = isMobile ? 700 : 1500;
    const t = setTimeout(() => setVideoReady(true), timeout);
    return () => clearTimeout(t);
  }, [videoReady, videoKey, current?.autoAdvance, current?.reverse, isMobile]);

  const goNext = useCallback(() => {
    if (!queue.length) return;
    clearVideoSrc();
    allowUnmuteRef.current = true;
    const next = index + 1;
    if (next >= queue.length) { setShowResult(true); return; }
    setVideoReady(false); setIndex(next);
  }, [index, queue.length, clearVideoSrc]);

  const handleReplayAnimation = useCallback(() => {
    clearVideoSrc();
    allowUnmuteRef.current = false;
    stickyUrlRef.current = null;
    lastReadyKeyRef.current = null;
    setShowResult(false);
    setVideoReady(false);
    setIndex(0);
  }, [clearVideoSrc]);

  const isAutoStep   = Boolean(current?.autoAdvance);
  const nextDisabled = !videoReady || playState.status !== 'ready' || isAutoStep;
  const expStars     = playState.status === 'ready' ? playState.expectationStars : 0;
  const isWin        = playState.status === 'ready' ? playState.isWin : false;

  const isLowQuality = quality === 'low';

  // ── 軽量モード ────────────────────────────────────────────
  if (isLowQuality) {
    return (
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/90">
        {showResult && playState.status === 'ready' && (
          <div className="fixed inset-0 z-10">
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
          </div>
        )}

        {!showResult && (
          <>
            <div style={{
              width: '72vw',
              maxWidth: 300,
              flexShrink: 0,
              borderRadius: 12,
              overflow: 'hidden',
              border: '2px solid rgba(255,255,255,0.3)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 8px 40px rgba(0,0,0,0.9)',
              background: '#000',
            }}>
              {playState.status === 'loading' && (
                <div style={{ aspectRatio: '9/16', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                </div>
              )}
              {playState.status === 'error' && (
                <div style={{ aspectRatio: '9/16', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 16 }}>
                  <p className="text-white text-sm text-center font-bold">開始できませんでした</p>
                  <p className="text-white/60 text-xs text-center">{playState.message}</p>
                </div>
              )}
              {playState.status === 'ready' && current && (
                <div style={{ position: 'relative', aspectRatio: '9/16', width: '100%', background: '#000', WebkitTransform: 'translate3d(0,0,0)', transform: 'translate3d(0,0,0)' }}>
                  <div className="absolute inset-0 bg-black" />
                  <video
                    ref={videoRef}
                    src={resolvedSrc ?? undefined}
                    className="absolute inset-0 block h-full w-full object-cover"
                    autoPlay={!current.reverse} muted preload="auto"
                    loop={Boolean(current.loop)}
                    playsInline
                    onCanPlayThrough={handleReady}
                    onLoadedData={handleReady}
                    onEnded={handleEnded}
                    onError={handleError}
                    style={{ background: '#000' }}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-black"
                    style={{ opacity: (videoReady || current.reverse) ? 0 : 1 }} />
                  {showOverlay && expStars > 0 && <StarOverlay starCount={expStars} />}
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-4 mt-6" style={{ flexShrink: 0 }}>
              <RoundMetalButton label="NEXT" subLabel="進む" onClick={goNext} disabled={nextDisabled} />
              <RoundMetalButton label="SKIP" subLabel="スキップ" onClick={() => setShowResult(true)} />
            </div>
          </>
        )}

        <div aria-hidden style={{ position: 'fixed', top: -2, left: -2, width: 1, height: 1, opacity: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          {upcomingVideos.map((src) => (
            <video key={src} src={src} preload="auto" playsInline muted autoPlay />
          ))}
        </div>
      </div>
    );
  }

  // ── 高画質モード ────────────────────────────────────────────
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
            <div className="relative h-full w-full overflow-hidden"
              style={{ background: '#000', WebkitTransform: 'translate3d(0,0,0)', transform: 'translate3d(0,0,0)' }}>
              <div className="absolute inset-0 bg-black" />
              <video
                ref={videoRef}
                src={resolvedSrc ?? undefined}
                className="absolute inset-0 block h-full w-full object-cover"
                autoPlay={!current.reverse} muted preload="auto"
                loop={Boolean(current.loop)}
                playsInline
                onCanPlayThrough={handleReady}
                onLoadedData={handleReady}
                onEnded={handleEnded}
                onError={handleError}
                style={{ background: '#000' }}
              />
              <div className="pointer-events-none absolute inset-0 bg-black"
                style={{ opacity: (videoReady || current.reverse) ? 0 : 1 }} />
              {showOverlay && expStars > 0 && <StarOverlay starCount={expStars} />}
            </div>

            <div className="absolute bottom-12 left-0 right-0 flex items-center justify-center gap-4">
              <RoundMetalButton label="NEXT" subLabel="進む" onClick={goNext} disabled={nextDisabled} />
              <RoundMetalButton label="SKIP" subLabel="スキップ" onClick={() => setShowResult(true)} />
            </div>
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

      <div aria-hidden style={{ position: 'fixed', top: -2, left: -2, width: 1, height: 1, opacity: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {upcomingVideos.map((src) => (
          <video key={src} src={src} preload="auto" playsInline muted autoPlay />
        ))}
      </div>
    </div>
  );
}

// ── Portal ──────────────────────────────────────────────────
export function EcardGachaPlayer({
  open, onClose, onRetry, prizeName, prizeImageUrl, prizeEmoji, prizeGradient, coinCost, productId, quality,
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
  quality: 'high' | 'low';
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
      quality={quality}
    />,
    portalTarget,
  );
}
