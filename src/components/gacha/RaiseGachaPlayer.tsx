'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { RoundMetalButton } from '@/components/gacha/controls/RoundMetalButton';
import { startRaiseGacha } from '@/lib/api/raise-gacha';
import { useSignedAssetResolver } from '@/lib/gacha/client-assets';
import { buildGachaAssetPath } from '@/lib/gacha/assets';
import { RaiseDigitalCard } from '@/components/gacha/raise/RaiseDigitalCard';
import { StarOverlay } from '@/components/gacha/overlays/StarOverlay';
import { downloadRaiseCardAsPng } from '@/lib/raise-gacha/card-download';
import { getCardDef, rarityToCssClass } from '@/lib/raise-gacha/scenarios';
import type { RaiseStep, RaiseCharacterId } from '@/lib/raise-gacha/types';

// ── 型定義 ────────────────────────────────────────────────────

type PlayState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready';
      isLoss: boolean;
      characterId: RaiseCharacterId;
      cardId: string;
      starLevel: number;
      rarity: string;
      hasDonden: boolean;
      steps: RaiseStep[];
      starDisplay: number;
      videoBasePath: string;
      card: {
        serialNumber: string;
        cardId: string;
        cardNumber: string;
        characterId: string;
        rarity: string;
        starLevel: number;
      } | null;
    };

const VIDEO_VERSION = '1';

/** autoAdvance するステップ */
function isAutoAdvanceStep(step: RaiseStep): boolean {
  return step.autoAdvance === true;
}

function stepToSrc(step: RaiseStep, basePath: string): string {
  const base = step.src ?? `${basePath}/${step.file}`;
  return `${base}?v=${VIDEO_VERSION}`;
}

function getAllVideoSources(steps: RaiseStep[], basePath: string): string[] {
  const sources = new Set<string>();
  for (const step of steps) {
    sources.add(stepToSrc(step, basePath));
  }
  return Array.from(sources);
}

// ── Rarity color helpers ──────────────────────────────────────

const RARITY_COLORS: Record<string, string> = {
  LR: '#c850ff',
  UR: '#7b68ee',
  SSR: '#ffd700',
  SR: '#a0b0c0',
  R: '#b08040',
  N: '#888888',
};

function getRarityColor(rarity: string): string {
  return RARITY_COLORS[rarity] ?? '#888';
}

// ── 埋め込みカード演出 ──────────────────────────────────────

function EmbeddedCard({
  characterId, cardId, serialNumber, rarity,
}: {
  characterId: RaiseCharacterId;
  cardId: string;
  serialNumber: string;
  rarity: string;
}) {
  const [phase, setPhase] = useState<'back' | 'flip' | 'done'>('back');
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('flip'), 800);
    const t2 = setTimeout(() => setPhase('done'), 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleDownload = useCallback(async () => {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    try {
      await downloadRaiseCardAsPng(cardRef.current, serialNumber);
    } catch (e) {
      console.error('[card-download]', e);
    } finally {
      setDownloading(false);
    }
  }, [serialNumber, downloading]);

  const rarityColor = getRarityColor(rarity);
  const isDark = rarity === 'SSR' || rarity === 'LR';

  return (
    <div className="flex flex-col items-center py-5" style={{ perspective: 1200 }}>
      {phase === 'back' && (
        <div
          style={{
            width: 260, height: 380, borderRadius: 14,
            background: `linear-gradient(135deg, #1a1a2e 0%, ${rarityColor}33 50%, #1a1a2e 100%)`,
            border: `2px solid ${rarityColor}66`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 60px ${rarityColor}40`,
            animation: 'raisePulse 0.8s ease-in-out',
          }}
        >
          <span style={{ fontSize: 64, color: rarityColor, textShadow: `0 0 20px ${rarityColor}` }}>🃏</span>
        </div>
      )}

      {phase === 'flip' && (
        <div style={{
          transformStyle: 'preserve-3d',
          animation: 'raiseFlip 0.8s ease-out forwards',
        }}>
          <RaiseDigitalCard characterId={characterId} cardId={cardId} serialNumber={serialNumber} size="full" cardRef={cardRef} />
        </div>
      )}

      {phase === 'done' && (
        <RaiseDigitalCard characterId={characterId} cardId={cardId} serialNumber={serialNumber} size="full" cardRef={cardRef} />
      )}

      {phase === 'done' && (
        <div className="flex flex-col items-center mt-3 gap-2">
          <p className="text-xs font-bold tracking-widest" style={{ color: rarityColor }}>{serialNumber}</p>
          <button
            className="px-5 py-2 rounded-xl text-sm font-bold transition hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${rarityColor}, ${rarityColor}cc)`,
              color: isDark ? '#1a1a2e' : '#fff',
              boxShadow: `0 4px 20px ${rarityColor}40`,
            }}
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? '保存中...' : 'PNGダウンロード'}
          </button>
        </div>
      )}

      <style jsx>{`
        @keyframes raisePulse {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes raiseFlip {
          0% { transform: rotateY(180deg); opacity: 0; }
          100% { transform: rotateY(0deg); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── 結果カード ────────────────────────────────────────────────

function ResultCard({
  isLoss, coinCost,
  onClose, onRetry, onReplayAnimation,
  characterId, cardId, cardSerialNumber, cardRarity,
}: {
  isLoss: boolean;
  coinCost?: number;
  onClose?: () => void;
  onRetry?: () => void;
  onReplayAnimation?: () => void;
  characterId?: RaiseCharacterId;
  cardId?: string;
  cardSerialNumber?: string;
  cardRarity?: string;
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

      {!isLoss && (
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

      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center"
        style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)' }}>
        {characterId && cardId && cardSerialNumber ? (
          <EmbeddedCard
            characterId={characterId}
            cardId={cardId}
            serialNumber={cardSerialNumber}
            rarity={cardRarity ?? 'N'}
          />
        ) : (
          <div className="flex flex-col items-center gap-3 px-6">
            <span style={{ fontSize: 48 }}>{isLoss ? '😭' : '🏆'}</span>
            <p className="text-lg font-black text-white">
              {isLoss ? 'ハズレ...' : '当たり！'}
            </p>
            {isLoss && (
              <p className="text-sm text-white/50">次回のチャレンジに期待しましょう！</p>
            )}
          </div>
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
  onClose, onRetry, coinCost, productId, quality, characterId,
}: {
  onClose?: () => void;
  onRetry?: () => void;
  coinCost?: number;
  productId: string;
  quality: 'high' | 'low';
  characterId: RaiseCharacterId;
}) {
  const [playState, setPlayState] = useState<PlayState>({ status: 'loading' });
  const [isStandby, setIsStandby] = useState(true);
  const [stepIdx, setStepIdx]     = useState(0);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const videoRef        = useRef<HTMLVideoElement>(null);
  const lastReadyKeyRef = useRef<string | null>(null);
  const allowUnmuteRef  = useRef(false);
  const stepIdxRef      = useRef(stepIdx);
  stepIdxRef.current    = stepIdx;

  const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|Android/i.test(navigator.userAgent);

  // APIコール
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await startRaiseGacha(productId, quality, characterId);
        if (cancelled) return;
        setPlayState({ status: 'ready', ...res });
        const folder = quality === 'low' ? `raise-${characterId}-mobile` : `raise-${characterId}`;
        setCurrentSrc(buildGachaAssetPath(folder, `${characterId}_standby.mp4`));
        setIsStandby(true);
        setVideoReady(false);
      } catch (err) {
        if (cancelled) return;
        setPlayState({ status: 'error', message: err instanceof Error ? err.message : '開始に失敗しました' });
      }
    })();
    return () => { cancelled = true; };
  }, [productId, quality, characterId]);

  // 全動画ソース
  const allSources = useMemo(() => {
    if (playState.status !== 'ready') return [];
    return getAllVideoSources(playState.steps, playState.videoBasePath);
  }, [playState]);
  const { resolveAssetSrc } = useSignedAssetResolver(allSources);

  const isLoss         = playState.status === 'ready' ? playState.isLoss : true;
  const steps          = playState.status === 'ready' ? playState.steps : [];
  const basePath       = playState.status === 'ready' ? playState.videoBasePath : '';
  const cardInfo       = playState.status === 'ready' ? playState.card : null;
  const starDisplay    = playState.status === 'ready' ? playState.starDisplay : 0;

  const currentStep = !isStandby ? steps[stepIdx] : undefined;
  const isAutoStep = currentStep ? isAutoAdvanceStep(currentStep) : false;

  const showStarOverlay = !isStandby && !showResult && currentStep?.name === 'title' && starDisplay > 0;

  // 解決済みURL
  const resolvedSrc = useMemo(() => {
    if (!currentSrc) return null;
    return resolveAssetSrc(currentSrc) ?? currentSrc;
  }, [currentSrc, resolveAssetSrc]);

  const videoKey = `${isStandby ? 'standby' : stepIdx}-${currentSrc ?? 'none'}`;

  // ── ステップ遷移 ────────────────────────────────────────

  const goToStep = useCallback((idx: number) => {
    if (idx >= steps.length) {
      setShowResult(true);
      return;
    }
    const step = steps[idx];
    setStepIdx(idx);
    stepIdxRef.current = idx;
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

  // ── 動画終了ハンドラ ─────────────────────────────────────

  const handleEnded = useCallback(() => {
    if (isStandby) return;

    const step = steps[stepIdxRef.current];
    if (step && isAutoAdvanceStep(step)) {
      clearVideoSrc();
      allowUnmuteRef.current = true;
      goToStep(stepIdxRef.current + 1);
    } else {
      setVideoReady(true);
    }
  }, [isStandby, steps, clearVideoSrc, goToStep]);

  const handleError = useCallback(() => {
    const step = steps[stepIdxRef.current];
    if (step && isAutoAdvanceStep(step)) {
      clearVideoSrc();
      allowUnmuteRef.current = true;
      goToStep(stepIdxRef.current + 1);
    } else {
      setVideoReady(true);
    }
  }, [steps, clearVideoSrc, goToStep]);

  // videoReady タイムアウト
  useEffect(() => {
    if (videoReady || isAutoStep) return undefined;
    const timeout = isMobile ? 700 : 1500;
    const t = setTimeout(() => setVideoReady(true), timeout);
    return () => clearTimeout(t);
  }, [videoReady, videoKey, isAutoStep, isMobile]);

  // ── ユーザー操作 ────────────────────────────────────────

  const handleStart = useCallback(() => {
    clearVideoSrc();
    allowUnmuteRef.current = true;
    setIsStandby(false);
    goToStep(0);
  }, [clearVideoSrc, goToStep]);

  const goNext = useCallback(() => {
    if (!steps.length) return;
    clearVideoSrc();
    allowUnmuteRef.current = true;
    const next = stepIdxRef.current + 1;
    if (next >= steps.length) {
      setShowResult(true);
      return;
    }
    setVideoReady(false);
    goToStep(next);
  }, [steps.length, clearVideoSrc, goToStep]);

  const handleReplayAnimation = useCallback(() => {
    clearVideoSrc();
    allowUnmuteRef.current = false;
    lastReadyKeyRef.current = null;
    setShowResult(false);
    setVideoReady(false);
    const folder = quality === 'low' ? `raise-${characterId}-mobile` : `raise-${characterId}`;
    setCurrentSrc(buildGachaAssetPath(folder, `${characterId}_standby.mp4`));
    setIsStandby(true);
    setStepIdx(0);
  }, [clearVideoSrc, quality, characterId]);

  const handleSkip = useCallback(() => {
    setShowResult(true);
  }, []);

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
  const isPlaying = !isStandby && !showResult;
  const nextDisabled = !videoReady || playState.status !== 'ready' || isAutoStep;
  const isLoop = isStandby;

  const isLowQuality = quality === 'low';

  // ── 描画: 軽量モード ──────────────────────────────────

  if (isLowQuality) {
    return (
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/90">
        {showResult && playState.status === 'ready' && (
          <div className="fixed inset-0 z-10 flex items-center justify-center bg-black">
            <div className="relative h-full w-full max-w-[430px]">
              <ResultCard
                isLoss={isLoss} coinCost={coinCost}
                onClose={onClose} onRetry={onRetry}
                onReplayAnimation={handleReplayAnimation}
                characterId={cardInfo?.characterId as RaiseCharacterId}
                cardId={cardInfo?.cardId}
                cardSerialNumber={cardInfo?.serialNumber}
                cardRarity={cardInfo?.rarity}
              />
            </div>
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
                  {showStarOverlay && <StarOverlay starCount={starDisplay} />}
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-4 mt-6" style={{ flexShrink: 0 }}>
              {showStandbyStart && (
                <RoundMetalButton label="START" subLabel="開始" onClick={handleStart} />
              )}
              {isPlaying && (
                <>
                  <RoundMetalButton label="NEXT" subLabel="進む" onClick={goNext} disabled={nextDisabled} />
                  <RoundMetalButton label="SKIP" subLabel="スキップ" onClick={handleSkip} />
                </>
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
              {showStarOverlay && <StarOverlay starCount={starDisplay} />}
            </div>

            {showStandbyStart && (
              <div className="absolute bottom-12 left-0 right-0 flex items-center justify-center gap-4">
                <RoundMetalButton label="START" subLabel="開始" onClick={handleStart} />
              </div>
            )}

            {isPlaying && (
              <div className="absolute bottom-12 left-0 right-0 flex items-center justify-center gap-4">
                <RoundMetalButton label="NEXT" subLabel="進む" onClick={goNext} disabled={nextDisabled} />
                <RoundMetalButton label="SKIP" subLabel="スキップ" onClick={handleSkip} />
              </div>
            )}
          </>
        )}

        {showResult && playState.status === 'ready' && (
          <ResultCard
            isLoss={isLoss} coinCost={coinCost}
            onClose={onClose} onRetry={onRetry}
            onReplayAnimation={handleReplayAnimation}
            characterId={cardInfo?.characterId as RaiseCharacterId}
            cardId={cardInfo?.cardId}
            cardSerialNumber={cardInfo?.serialNumber}
            cardRarity={cardInfo?.rarity}
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

export function RaiseGachaPlayer({
  open, onClose, onRetry, coinCost, productId, quality, characterId,
}: {
  open: boolean;
  onClose?: () => void;
  onRetry?: () => void;
  coinCost?: number;
  productId: string;
  quality: 'high' | 'low';
  characterId: RaiseCharacterId;
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
      coinCost={coinCost}
      productId={productId}
      quality={quality}
      characterId={characterId}
    />,
    portalTarget,
  );
}
