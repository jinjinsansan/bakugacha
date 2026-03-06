'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { RoundMetalButton } from '@/components/gacha/controls/RoundMetalButton';
import { startKeibaGacha } from '@/lib/api/keiba-gacha';
import { useSignedAssetResolver } from '@/lib/gacha/client-assets';
import { buildGachaAssetPath } from '@/lib/gacha/assets';
import { KeibaDigitalCard } from '@/components/gacha/keiba/KeibaDigitalCard';
import { downloadCardAsPng } from '@/lib/keiba-gacha/card-download';
import { KEIBA_CARD_MAP } from '@/lib/keiba-gacha/cards';
import type { KeibaStep } from '@/lib/keiba-gacha/types';

// ── 型定義 ────────────────────────────────────────────────────

type PlayState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready';
      isWin: boolean;
      charaId: string;
      resultCharaId: string;
      charaName: string;
      charaWeight: string;
      expectationStars: number;
      raceName: string;
      distance: string;
      trackCondition: string;
      steps: KeibaStep[];
      videoBasePath: string;
      card: { serialNumber: string; charaId: string; cardNumber: string } | null;
    };

const VIDEO_VERSION = '1';

/** autoAdvance するステップ名 */
const AUTO_STEPS = new Set(['result_win', 'result_lose']);

function stepToSrc(step: KeibaStep, basePath: string): string {
  return `${basePath}/${step.file}?v=${VIDEO_VERSION}`;
}

function getAllVideoSources(steps: KeibaStep[], basePath: string): string[] {
  const sources = new Set<string>();
  for (const step of steps) {
    sources.add(stepToSrc(step, basePath));
  }
  return Array.from(sources);
}

// ── レースタイトルオーバーレイ ────────────────────────────────

function RaceTitleOverlay({
  raceName, distance, trackCondition, starCount,
}: {
  raceName: string;
  distance: string;
  trackCondition: string;
  starCount: number;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(t);
  }, []);

  const starLabel = starCount >= 6 ? '★MAX' : '★'.repeat(starCount);
  const starColor = starCount >= 6 ? '#ff6b35' : starCount >= 5 ? '#ff4444' : starCount >= 4 ? '#c9a84c' : '#aaa';

  return (
    <div
      className="pointer-events-none absolute inset-0 flex flex-col justify-end pb-48 px-5"
      style={{
        background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.0) 55%)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s ease',
      }}
    >
      {/* 期待度★ */}
      <div className="mb-2 flex items-center gap-1.5">
        <span
          className="text-xs font-bold tracking-[0.2em] px-2 py-0.5 rounded-sm"
          style={{
            color: starColor,
            border: `1px solid ${starColor}55`,
            background: `${starColor}18`,
            textShadow: `0 0 8px ${starColor}`,
          }}
        >
          期待度 {starLabel}
        </span>
      </div>

      {/* レース名 */}
      <p
        className="font-black leading-tight mb-1"
        style={{
          fontSize: 26,
          color: '#fff',
          textShadow: '0 0 20px rgba(201,168,76,0.6), 0 2px 6px rgba(0,0,0,0.9)',
          letterSpacing: '0.05em',
        }}
      >
        {raceName}
      </p>

      {/* 距離・馬場 */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-white/70 tracking-wider">{distance}</span>
        <span className="text-white/30 text-xs">|</span>
        <span className="text-xs font-bold text-white/70 tracking-wider">{trackCondition}</span>
      </div>
    </div>
  );
}

// ── キャライントロオーバーレイ ────────────────────────────────

function CharaIntroOverlay({ name, weight }: { name: string; weight: string }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="pointer-events-none absolute inset-0 flex flex-col justify-end pb-48 px-5"
      style={{
        background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.0) 50%)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}
    >
      <p
        className="font-black text-white leading-tight mb-0.5"
        style={{
          fontSize: 28,
          letterSpacing: '0.15em',
          textShadow: '0 0 16px rgba(201,168,76,0.7), 0 2px 5px rgba(0,0,0,0.9)',
        }}
      >
        {name}
      </p>
      <p className="text-xs font-bold tracking-widest" style={{ color: 'rgba(255,255,255,0.55)' }}>
        馬体重 {weight}
      </p>
    </div>
  );
}

// ── 埋め込みカード演出 ──────────────────────────────────────

function EmbeddedCard({ charaId, serialNumber }: { charaId: string; serialNumber: string }) {
  const [phase, setPhase] = useState<'back' | 'flip' | 'done'>('back');
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const def = KEIBA_CARD_MAP.get(charaId);

  useEffect(() => {
    // back → flip → done を自動進行
    const t1 = setTimeout(() => setPhase('flip'), 800);
    const t2 = setTimeout(() => setPhase('done'), 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleDownload = useCallback(async () => {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    try {
      await downloadCardAsPng(cardRef.current, serialNumber);
    } catch (e) {
      console.error('[card-download]', e);
    } finally {
      setDownloading(false);
    }
  }, [serialNumber, downloading]);

  if (!def) return null;

  const rarityColor = def.rarity === 'rainbow' ? '#c850ff'
    : def.rarity === 'gold' ? '#ffd700'
    : def.rarity === 'silver' ? '#a0b0c0'
    : '#b08040';

  return (
    <div className="flex flex-col items-center py-5" style={{ perspective: 1200 }}>
      {/* Card back */}
      {phase === 'back' && (
        <div
          style={{
            width: 260, height: 380, borderRadius: 14,
            background: `linear-gradient(135deg, #1a1a2e 0%, ${rarityColor}33 50%, #1a1a2e 100%)`,
            border: `2px solid ${rarityColor}66`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 60px ${rarityColor}40`,
            animation: 'cardPulse 0.8s ease-in-out',
          }}
        >
          <span style={{ fontSize: 64, color: rarityColor, textShadow: `0 0 20px ${rarityColor}` }}>🃏</span>
        </div>
      )}

      {/* Card flip */}
      {phase === 'flip' && (
        <div style={{
          transformStyle: 'preserve-3d',
          animation: 'cardFlip 0.8s ease-out forwards',
        }}>
          <KeibaDigitalCard charaId={charaId} serialNumber={serialNumber} size="full" cardRef={cardRef} />
        </div>
      )}

      {/* Card done */}
      {phase === 'done' && (
        <KeibaDigitalCard charaId={charaId} serialNumber={serialNumber} size="full" cardRef={cardRef} />
      )}

      {/* Serial + Download */}
      {phase === 'done' && (
        <div className="flex flex-col items-center mt-3 gap-2">
          <p className="text-xs font-bold tracking-widest" style={{ color: rarityColor }}>{serialNumber}</p>
          <button
            className="px-5 py-2 rounded-xl text-sm font-bold transition hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${rarityColor}, ${rarityColor}cc)`,
              color: def.rarity === 'gold' || def.rarity === 'rainbow' ? '#1a1a2e' : '#fff',
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
        @keyframes cardPulse {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes cardFlip {
          0% { transform: rotateY(180deg); opacity: 0; }
          100% { transform: rotateY(0deg); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── 結果カード ────────────────────────────────────────────────

function ResultCard({
  isWin, coinCost,
  onClose, onRetry, onReplayAnimation, cardCharaId, cardSerialNumber,
}: {
  isWin: boolean;
  coinCost?: number;
  onClose?: () => void;
  onRetry?: () => void;
  onReplayAnimation?: () => void;
  cardCharaId?: string;
  cardSerialNumber?: string;
}) {
  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: '#0d0d1a' }}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: '#12122a' }}>
        <div className="w-12" />
        <h2 className="text-sm font-bold text-white/80">ガチャ結果</h2>
        <button className="text-sm font-medium text-white/50" onClick={onClose}>
          閉じる
        </button>
      </div>

      {/* 当選バナー */}
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

      {/* カード表示エリア（メイン） */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center">
        {cardCharaId && cardSerialNumber ? (
          <EmbeddedCard charaId={cardCharaId} serialNumber={cardSerialNumber} />
        ) : (
          <div className="flex flex-col items-center gap-3 px-6">
            <span style={{ fontSize: 48 }}>{isWin ? '🏆' : '🏇'}</span>
            <p className="text-lg font-black text-white/80">
              {isWin ? '当たり！' : 'ハズレ...'}
            </p>
            {!isWin && (
              <p className="text-sm text-white/40">次回のチャレンジに期待しましょう！</p>
            )}
          </div>
        )}
      </div>

      {/* フッター */}
      <div className="px-4 pt-3 flex flex-col gap-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.1)', background: '#12122a', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>
        <button
          className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
          style={{ border: '2px solid rgba(255,255,255,0.15)', color: '#fff', background: 'rgba(255,255,255,0.05)' }}
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
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              <span className="text-[10px] font-bold text-white/50">{label}</span>
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
        const res = await startKeibaGacha(productId, quality);
        if (cancelled) return;
        setPlayState({ status: 'ready', ...res });
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

  const isWin          = playState.status === 'ready' ? playState.isWin : false;
  const steps          = playState.status === 'ready' ? playState.steps : [];
  const basePath       = playState.status === 'ready' ? playState.videoBasePath : '';
  const charaName      = playState.status === 'ready' ? playState.charaName : '';
  const charaWeight    = playState.status === 'ready' ? playState.charaWeight : '';
  const expStars       = playState.status === 'ready' ? playState.expectationStars : 0;
  const raceName       = playState.status === 'ready' ? playState.raceName : '';
  const distance       = playState.status === 'ready' ? playState.distance : '';
  const trackCondition = playState.status === 'ready' ? playState.trackCondition : '';
  const cardInfo       = playState.status === 'ready' ? playState.card : null;

  // 現在のステップ名
  const currentStepName = (!isStandby && steps[stepIdx]?.name) || '';
  const isAutoStep = AUTO_STEPS.has(currentStepName);

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
    if (isStandby) return; // standby はループ

    const stepName = steps[stepIdxRef.current]?.name ?? '';
    if (AUTO_STEPS.has(stepName)) {
      // autoAdvance → 自動で次へ
      clearVideoSrc();
      allowUnmuteRef.current = true;
      goToStep(stepIdxRef.current + 1);
    } else {
      // manual → NEXT ボタン待ち
      setVideoReady(true);
    }
  }, [isStandby, steps, clearVideoSrc, goToStep]);

  const handleError = useCallback(() => {
    const stepName = steps[stepIdxRef.current]?.name ?? '';
    if (AUTO_STEPS.has(stepName)) {
      clearVideoSrc();
      allowUnmuteRef.current = true;
      goToStep(stepIdxRef.current + 1);
    } else {
      setVideoReady(true);
    }
  }, [steps, clearVideoSrc, goToStep]);

  // videoReady タイムアウト（autoAdvance以外）
  useEffect(() => {
    if (videoReady || isAutoStep) return undefined;
    const timeout = isMobile ? 700 : 1500;
    const t = setTimeout(() => setVideoReady(true), timeout);
    return () => clearTimeout(t);
  }, [videoReady, videoKey, isAutoStep, isMobile]);

  // ── ユーザー操作ハンドラ ──────────────────────────────

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
    const STANDBY_FILES = [
      'blackstandby.mp4', 'bluestandby.mp4', 'rainbowstandby.mp4',
      'redstandby.mp4', 'whitestandby.mp4', 'yellowstandby.mp4',
    ];
    const picked = STANDBY_FILES[Math.floor(Math.random() * STANDBY_FILES.length)];
    setCurrentSrc(buildGachaAssetPath('cd2', 'standby', picked));
    setIsStandby(true);
    setStepIdx(0);
  }, [clearVideoSrc]);

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

  // オーバーレイ表示判定
  const showTitleOverlay  = currentStepName === 'title' && raceName !== '';
  const showCharaIntro    = currentStepName === 'chara_intro' && charaName !== '';

  const isLowQuality = quality === 'low';

  // ── オーバーレイ共通 JSX ──────────────────────────────

  const overlays = (
    <>
      {showTitleOverlay && (
        <RaceTitleOverlay
          raceName={raceName}
          distance={distance}
          trackCondition={trackCondition}
          starCount={expStars}
        />
      )}
      {showCharaIntro && <CharaIntroOverlay name={charaName} weight={charaWeight} />}
    </>
  );

  // ── 描画: 軽量モード ──────────────────────────────────

  if (isLowQuality) {
    return (
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/90">
        {showResult && playState.status === 'ready' && (
          <div className="fixed inset-0 z-10">
            <ResultCard
              isWin={isWin} coinCost={coinCost}
              onClose={onClose} onRetry={onRetry}
              onReplayAnimation={handleReplayAnimation}
              cardCharaId={cardInfo?.charaId}
              cardSerialNumber={cardInfo?.serialNumber}
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
                  {overlays}
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
              {overlays}
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
            isWin={isWin} coinCost={coinCost}
            onClose={onClose} onRetry={onRetry}
            onReplayAnimation={handleReplayAnimation}
            cardCharaId={cardInfo?.charaId}
            cardSerialNumber={cardInfo?.serialNumber}
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

export function KeibaGachaPlayer({
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
