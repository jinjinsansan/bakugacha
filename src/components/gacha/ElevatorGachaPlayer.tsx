'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { RoundMetalButton } from '@/components/gacha/controls/RoundMetalButton';
import { startElevatorGacha } from '@/lib/api/elevator-gacha';
import { useSignedAssetResolver } from '@/lib/gacha/client-assets';
import { buildGachaAssetPath } from '@/lib/gacha/assets';
import type { ElevatorStep } from '@/lib/elevator-gacha/types';
import { PAUSE_STEPS } from '@/lib/elevator-gacha/types';

// ── 型定義 ────────────────────────────────────────────────────

type PlayState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready';
      isWin: boolean;
      steps: ElevatorStep[];
      videoBasePath: string;
    };

const VIDEO_VERSION = '1';

// ── ステップ→動画ファイルマッピング ────────────────────────────

const STEP_FILE: Record<ElevatorStep, string> = {
  title:       'eelev_title.mp4',
  rise:        'eelev_rise.mp4',
  stop:        'eelev_stop.mp4',
  open_or_skip:'eelev_open_skip.mp4',
  open_coin:   'eelev_open_coin.mp4',
  open_hole:   'eelev_open_hole.mp4',
  result_win:  'eelev_final_win.mp4',
  result_lose: 'eelev_final_lose.mp4',
};

function stepToSrc(step: ElevatorStep, basePath: string): string {
  return `${basePath}/${STEP_FILE[step]}?v=${VIDEO_VERSION}`;
}

function getAllVideoSources(steps: ElevatorStep[], basePath: string): string[] {
  const sources = new Set<string>();
  for (const step of steps) {
    sources.add(stepToSrc(step, basePath));
  }
  return Array.from(sources);
}

// ── 結果カード ────────────────────────────────────────────────

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
              <span style={{ fontSize: 28 }}>{prizeEmoji ?? '🛗'}</span>
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
                {prizeName ?? (isWin ? '当たり！' : 'またチャレンジ！')}
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
  const [isStandby, setIsStandby] = useState(true);
  const [stepIdx, setStepIdx]     = useState(0);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [waitingForUser, setWaitingForUser] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const videoRef        = useRef<HTMLVideoElement>(null);
  const lastReadyKeyRef = useRef<string | null>(null);
  const allowUnmuteRef  = useRef(false);
  const stepIdxRef      = useRef(stepIdx);
  stepIdxRef.current    = stepIdx;

  // APIコール
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await startElevatorGacha(productId, quality);
        if (cancelled) return;
        setPlayState({ status: 'ready', ...res });
        // standby で開始
        const STANDBY_FILES = [
          'blackstandby.mp4', 'bluestandby.mp4', 'rainbowstandby.mp4',
          'redstandby.mp4', 'whitestandby.mp4', 'yellowstandby.mp4',
        ];
        const picked = STANDBY_FILES[Math.floor(Math.random() * STANDBY_FILES.length)];
        setCurrentSrc(buildGachaAssetPath('cd2', 'standby', picked));
        setIsStandby(true);
        setVideoReady(false);
      } catch (err) {
        if (cancelled) return;
        setPlayState({ status: 'error', message: err instanceof Error ? err.message : '開始に失敗しました' });
      }
    })();
    return () => { cancelled = true; };
  }, [productId, quality]);

  // 全動画ソース（プリフェッチ用）
  const allSources = useMemo(() => {
    if (playState.status !== 'ready') return [];
    return getAllVideoSources(playState.steps, playState.videoBasePath);
  }, [playState]);
  const { resolveAssetSrc } = useSignedAssetResolver(allSources);

  const isWin    = playState.status === 'ready' ? playState.isWin : false;
  const steps    = playState.status === 'ready' ? playState.steps : [];
  const basePath = playState.status === 'ready' ? playState.videoBasePath : '';

  const currentStep = steps[stepIdx] as ElevatorStep | undefined;

  // 解決済みURL
  const resolvedSrc = useMemo(() => {
    if (!currentSrc) return null;
    return resolveAssetSrc(currentSrc) ?? currentSrc;
  }, [currentSrc, resolveAssetSrc]);

  const videoKey = `${isStandby ? 'standby' : stepIdx}-${currentSrc ?? 'none'}`;

  // ── ステップ遷移 ────────────────────────────────────────

  const goToStep = useCallback((idx: number) => {
    if (idx >= steps.length) {
      // 全ステップ完了 → 結果表示
      setShowResult(true);
      return;
    }
    const step = steps[idx];
    setStepIdx(idx);
    stepIdxRef.current = idx;
    setWaitingForUser(false);
    setVideoReady(false);
    lastReadyKeyRef.current = null;
    setCurrentSrc(stepToSrc(step, basePath));
  }, [steps, basePath]);

  // ── 動画再生同期 ────────────────────────────────────────

  const syncPlayback = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    void v.play().then(() => {
      if (allowUnmuteRef.current && videoRef.current) videoRef.current.muted = false;
    }).catch(() => undefined);
  }, []);
  useEffect(() => { syncPlayback(); }, [syncPlayback, resolvedSrc, videoKey]);

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
    if (isStandby) return; // standby はループ

    const idx = stepIdxRef.current;
    const step = steps[idx];
    if (!step) return;

    if (PAUSE_STEPS.has(step)) {
      // ユーザー操作待ち
      setWaitingForUser(true);
      return;
    }

    // autoAdvance → 次のステップへ
    clearVideoSrc();
    goToStep(idx + 1);
  }, [isStandby, steps, clearVideoSrc, goToStep]);

  const handleError = useCallback(() => { setVideoReady(true); }, []);

  // ── ユーザー操作ハンドラ ──────────────────────────────

  const handleStart = useCallback(() => {
    clearVideoSrc();
    allowUnmuteRef.current = true;
    setIsStandby(false);
    goToStep(0);
  }, [clearVideoSrc, goToStep]);

  const handleOpen = useCallback(() => {
    clearVideoSrc();
    setWaitingForUser(false);
    goToStep(stepIdxRef.current + 1);
  }, [clearVideoSrc, goToStep]);

  const handleReplayAnimation = useCallback(() => {
    clearVideoSrc();
    allowUnmuteRef.current = false;
    lastReadyKeyRef.current = null;
    setShowResult(false);
    setVideoReady(false);
    setWaitingForUser(false);
    const STANDBY_FILES = [
      'blackstandby.mp4', 'bluestandby.mp4', 'rainbowstandby.mp4',
      'redstandby.mp4', 'whitestandby.mp4', 'yellowstandby.mp4',
    ];
    const picked = STANDBY_FILES[Math.floor(Math.random() * STANDBY_FILES.length)];
    setCurrentSrc(buildGachaAssetPath('cd2', 'standby', picked));
    setIsStandby(true);
    setStepIdx(0);
  }, [clearVideoSrc]);

  // 次の動画プリフェッチ
  const upcomingVideos = useMemo(() => {
    if (playState.status !== 'ready' || isStandby) return [];
    const nextIdx = stepIdx + 1;
    const srcs: string[] = [];
    for (let i = nextIdx; i < Math.min(nextIdx + 2, steps.length); i++) {
      srcs.push(stepToSrc(steps[i], basePath));
    }
    return srcs
      .map((s) => resolveAssetSrc(s))
      .filter((s): s is string => Boolean(s));
  }, [playState, isStandby, stepIdx, steps, basePath, resolveAssetSrc]);

  useEffect(() => {
    upcomingVideos.forEach((src) => { fetch(src, { cache: 'force-cache' }).catch(() => {}); });
  }, [upcomingVideos]);

  // ── 表示判定 ────────────────────────────────────────────

  const showStandbyStart = isStandby && videoReady;
  const showOpenButton = !isStandby && waitingForUser && currentStep === 'open_or_skip';
  const isAutoPhase = !isStandby && !waitingForUser && !showResult;
  const isLoop = isStandby;

  const isLowQuality = quality === 'low';

  // ── 描画: 軽量モード ──────────────────────────────────

  if (isLowQuality) {
    return (
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/90">
        {showResult && playState.status === 'ready' && (
          <div className="fixed inset-0 z-10">
            <ResultCard
              isWin={isWin} prizeName={prizeName}
              prizeImageUrl={prizeImageUrl} prizeEmoji={prizeEmoji}
              prizeGradient={prizeGradient} coinCost={coinCost}
              onClose={onClose} onRetry={onRetry}
              onReplayAnimation={handleReplayAnimation}
            />
          </div>
        )}

        {!showResult && (
          <>
            <div style={{
              width: '72vw', maxWidth: 300, flexShrink: 0, borderRadius: 12,
              overflow: 'hidden', border: '2px solid rgba(255,255,255,0.3)',
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
              {playState.status === 'ready' && resolvedSrc && (
                <div style={{ position: 'relative', aspectRatio: '9/16', width: '100%', background: '#000', WebkitTransform: 'translate3d(0,0,0)', transform: 'translate3d(0,0,0)' }}>
                  <div className="absolute inset-0 bg-black" />
                  <video
                    ref={videoRef}
                    src={resolvedSrc}
                    className="absolute inset-0 block h-full w-full object-cover"
                    autoPlay muted preload="auto"
                    loop={isLoop}
                    playsInline
                    onCanPlayThrough={handleReady}
                    onLoadedData={handleReady}
                    onEnded={handleEnded}
                    onError={handleError}
                    style={{ background: '#000' }}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-black"
                    style={{ opacity: videoReady ? 0 : 1 }} />
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-4 mt-6" style={{ flexShrink: 0 }}>
              {showOpenButton && (
                <RoundMetalButton label="OPEN" subLabel="開ける" onClick={handleOpen} />
              )}
              {showStandbyStart && (
                <RoundMetalButton label="START" subLabel="開始" onClick={handleStart} />
              )}
              {/* 自動再生中はスキップ可能 */}
              {isAutoPhase && (
                <RoundMetalButton label="SKIP" subLabel="スキップ" onClick={() => setShowResult(true)} />
              )}
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

  // ── 描画: 高画質モード ────────────────────────────────

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

        {playState.status === 'ready' && resolvedSrc && !showResult && (
          <>
            <div className="relative h-full w-full overflow-hidden"
              style={{ background: '#000', WebkitTransform: 'translate3d(0,0,0)', transform: 'translate3d(0,0,0)' }}>
              <div className="absolute inset-0 bg-black" />
              <video
                ref={videoRef}
                src={resolvedSrc}
                className="absolute inset-0 block h-full w-full object-cover"
                autoPlay muted preload="auto"
                loop={isLoop}
                playsInline
                onCanPlayThrough={handleReady}
                onLoadedData={handleReady}
                onEnded={handleEnded}
                onError={handleError}
                style={{ background: '#000' }}
              />
              <div className="pointer-events-none absolute inset-0 bg-black"
                style={{ opacity: videoReady ? 0 : 1 }} />

              {/* OPENボタン（高画質モードではビデオ上にオーバーレイ） */}
              {showOpenButton && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <RoundMetalButton label="OPEN" subLabel="開ける" onClick={handleOpen} />
                </div>
              )}
            </div>

            {/* standby: STARTボタン */}
            {showStandbyStart && (
              <div className="absolute bottom-12 left-0 right-0 flex items-center justify-center gap-4">
                <RoundMetalButton label="START" subLabel="開始" onClick={handleStart} />
              </div>
            )}

            {/* 自動再生中はスキップ可能 */}
            {isAutoPhase && (
              <div className="absolute bottom-12 left-0 right-0 flex items-center justify-center gap-4">
                <RoundMetalButton label="SKIP" subLabel="スキップ" onClick={() => setShowResult(true)} />
              </div>
            )}
          </>
        )}

        {showResult && playState.status === 'ready' && (
          <ResultCard
            isWin={isWin} prizeName={prizeName}
            prizeImageUrl={prizeImageUrl} prizeEmoji={prizeEmoji}
            prizeGradient={prizeGradient} coinCost={coinCost}
            onClose={onClose} onRetry={onRetry}
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

export function ElevatorGachaPlayer({
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
