'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { StarOverlay } from '@/components/gacha/overlays/StarOverlay';
import { FloorNumberOverlay } from '@/components/gacha/overlays/FloorNumberOverlay';
import { OpenSkipOverlay } from '@/components/gacha/overlays/OpenSkipOverlay';
import { CountdownOverlay } from '@/components/gacha/overlays/CountdownOverlay';
import { MultidoorOverlay } from '@/components/gacha/overlays/MultidoorOverlay';
import { RoundMetalButton } from '@/components/gacha/controls/RoundMetalButton';
import { startElevatorGacha } from '@/lib/api/elevator-gacha';
import { useSignedAssetResolver } from '@/lib/gacha/client-assets';
import { buildGachaAssetPath } from '@/lib/gacha/assets';
import type { ElevatorFloor } from '@/lib/elevator-gacha/types';

// ── 型定義 ────────────────────────────────────────────────────

type PlayerPhase =
  | 'standby' | 'title'
  | 'rise' | 'stop' | 'open_skip' | 'choice'
  | 'open_result'
  | 'result';

type PlayState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready';
      isWin: boolean;
      isDonten: boolean;
      floors: ElevatorFloor[];
      videoBasePath: string;
      expectationStars: number;
      scenarioCode: string;
      countdownSeconds: number;
    };

const VIDEO_VERSION = '1';

// ── 動画パスマッピング ────────────────────────────────────────

const RISE_FILE: Record<string, string> = {
  rise_normal: 'eelev_rise.mp4',
  rise_fast:   'eelev_rise_fast.mp4',
  rise_down:   'eelev_rise_down.mp4',
};

const STOP_FILE: Record<string, string> = {
  stop_normal:      'eelev_stop.mp4',
  stop_boss:        'eelev_stop_boss.mp4',
  stop_countdown:   'eelev_stop_countdown.mp4',
  stop_multidoor:   'eelev_stop_multidoor.mp4',
  stop_numchaos:    'eelev_stop_numchaos.mp4',
  stop_numreverse:  'eelev_stop_numreverse.mp4',
  stop_vibration:   'eelev_stop_vibration.mp4',
  stop_emergency:   'eelev_stop_emergency.mp4',
  stop_transparent: 'eelev_stop_transparent.mp4',
  stop_halfopen:    'eelev_stop_halfopen.mp4',
  stop_mirror:      'eelev_stop_mirror.mp4',
  stop_ghost:       'eelev_stop_ghost.mp4',
  stop_ice:         'eelev_stop_ice.mp4',
  stop_fire:        'eelev_stop_fire.mp4',
};

const OPEN_FILE: Record<string, string> = {
  wall:           'eelev_open_wall.mp4',
  hole:           'eelev_open_hole.mp4',
  coin:           'eelev_open_coin.mp4',
  coin_boss:      'eelev_open_coin_boss.mp4',
  coin_explosion: 'eelev_open_coin_explosion.mp4',
  wall_collapse:  'eelev_open_wall_collapse.mp4',
};

function computeVideoSrc(
  phase: PlayerPhase,
  floor: ElevatorFloor | null,
  basePath: string,
  isWin: boolean,
): string | null {
  const v = VIDEO_VERSION;
  switch (phase) {
    case 'standby': {
      const STANDBY_FILES = [
        'blackstandby.mp4', 'bluestandby.mp4', 'rainbowstandby.mp4',
        'redstandby.mp4', 'whitestandby.mp4', 'yellowstandby.mp4',
      ];
      const picked = STANDBY_FILES[Math.floor(Math.random() * STANDBY_FILES.length)];
      return buildGachaAssetPath('cd2', 'standby', picked);
    }
    case 'title':
      return `${basePath}/eelev_title.mp4?v=${v}`;
    case 'rise':
      return floor ? `${basePath}/${RISE_FILE[floor.riseType] ?? 'eelev_rise.mp4'}?v=${v}` : null;
    case 'stop':
      return floor ? `${basePath}/${STOP_FILE[floor.stopType] ?? 'eelev_stop.mp4'}?v=${v}` : null;
    case 'open_skip':
      return `${basePath}/eelev_open_skip.mp4?v=${v}`;
    case 'choice':
      return null; // 停止フレームをそのまま表示
    case 'open_result':
      return floor ? `${basePath}/${OPEN_FILE[floor.openResult] ?? 'eelev_open_wall.mp4'}?v=${v}` : null;
    case 'result':
      return `${basePath}/eelev_final_${isWin ? 'win' : 'lose'}.mp4?v=${v}`;
    default:
      return null;
  }
}

function getAllVideoSources(floors: ElevatorFloor[], basePath: string): string[] {
  const v = VIDEO_VERSION;
  const sources = new Set<string>();
  sources.add(`${basePath}/eelev_title.mp4?v=${v}`);
  sources.add(`${basePath}/eelev_open_skip.mp4?v=${v}`);
  sources.add(`${basePath}/eelev_final_win.mp4?v=${v}`);
  sources.add(`${basePath}/eelev_final_lose.mp4?v=${v}`);
  for (const floor of floors) {
    sources.add(`${basePath}/${RISE_FILE[floor.riseType] ?? 'eelev_rise.mp4'}?v=${v}`);
    sources.add(`${basePath}/${STOP_FILE[floor.stopType] ?? 'eelev_stop.mp4'}?v=${v}`);
    sources.add(`${basePath}/${OPEN_FILE[floor.openResult] ?? 'eelev_open_wall.mp4'}?v=${v}`);
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
  const [phase, setPhase]         = useState<PlayerPhase>('standby');
  const [floorIdx, setFloorIdx]   = useState(0);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const [isLoop, setIsLoop]       = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  const videoRef        = useRef<HTMLVideoElement>(null);
  const lastReadyKeyRef = useRef<string | null>(null);
  const allowUnmuteRef  = useRef(false);
  // Refs for latest state in callbacks
  const phaseRef    = useRef(phase);
  const floorIdxRef = useRef(floorIdx);
  phaseRef.current    = phase;
  floorIdxRef.current = floorIdx;

  const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // APIコール
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await startElevatorGacha(productId, quality);
        if (cancelled) return;
        setPlayState({ status: 'ready', ...res });
        // standby で開始
        const standbyUrl = computeVideoSrc('standby', null, '', false);
        setCurrentSrc(standbyUrl);
        setIsLoop(true);
        setPhase('standby');
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
    return getAllVideoSources(playState.floors, playState.videoBasePath);
  }, [playState]);
  const { resolveAssetSrc } = useSignedAssetResolver(allSources);

  const currentFloor = playState.status === 'ready' ? playState.floors[floorIdx] ?? null : null;
  const basePath     = playState.status === 'ready' ? playState.videoBasePath : '';
  const isWin        = playState.status === 'ready' ? playState.isWin : false;
  const expStars        = playState.status === 'ready' ? playState.expectationStars : 0;
  const countdownSecs   = playState.status === 'ready' ? playState.countdownSeconds : 5;

  // 解決済みURL
  const resolvedSrc = useMemo(() => {
    if (!currentSrc) return null;
    return resolveAssetSrc(currentSrc) ?? currentSrc;
  }, [currentSrc, resolveAssetSrc]);

  const videoKey = `${phase}-${floorIdx}-${currentSrc ?? 'none'}`;

  // フェーズ遷移
  const goToPhase = useCallback((nextPhase: PlayerPhase, nextFloorIdx?: number) => {
    const fi = nextFloorIdx ?? floorIdxRef.current;
    const floors = playState.status === 'ready' ? playState.floors : [];
    const floor = floors[fi] ?? null;
    const base = playState.status === 'ready' ? playState.videoBasePath : '';
    const win = playState.status === 'ready' ? playState.isWin : false;

    const src = computeVideoSrc(nextPhase, floor, base, win);

    if (nextFloorIdx !== undefined) setFloorIdx(nextFloorIdx);
    setPhase(nextPhase);
    setIsLoop(nextPhase === 'standby');
    setVideoEnded(false);

    if (src !== null) {
      setCurrentSrc(src);
      setVideoReady(false);
      lastReadyKeyRef.current = null;
    }
  }, [playState]);

  // 動画再生同期
  const syncPlayback = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    void v.play().then(() => {
      if (allowUnmuteRef.current && videoRef.current) videoRef.current.muted = false;
    }).catch(() => undefined);
  }, []);
  useEffect(() => { syncPlayback(); }, [syncPlayback, resolvedSrc, videoKey]);

  // タイトルオーバーレイ
  useEffect(() => {
    if (phase === 'title') {
      setShowOverlay(true);
      const t = setTimeout(() => setShowOverlay(false), 3000);
      return () => clearTimeout(t);
    }
    setShowOverlay(false);
    return undefined;
  }, [phase]);

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
    setVideoEnded(true);
    const p = phaseRef.current;

    // 自動遷移フェーズ
    switch (p) {
      case 'title':
        clearVideoSrc();
        allowUnmuteRef.current = true;
        goToPhase('rise', 0);
        break;
      case 'rise':
        clearVideoSrc();
        goToPhase('stop');
        break;
      case 'stop': {
        const floors = playState.status === 'ready' ? playState.floors : [];
        const floor = floors[floorIdxRef.current] ?? null;
        if (floor?.stopType === 'stop_boss') {
          // ボス階: 自動OPEN
          clearVideoSrc();
          goToPhase('open_result');
        } else {
          // open_skip映像→choiceへ
          clearVideoSrc();
          goToPhase('open_skip');
        }
        break;
      }
      case 'open_skip':
        // OPEN/SKIP選択映像が終了 → choice（ボタン表示待ち）
        setPhase('choice');
        phaseRef.current = 'choice';
        break;
      case 'open_result': {
        const floors = playState.status === 'ready' ? playState.floors : [];
        const floor = floors[floorIdxRef.current] ?? null;
        if (!floor) break;
        const result = floor.openResult;
        if (result === 'wall') {
          // 壁 → 次フロアへ
          clearVideoSrc();
          goToPhase('rise', floorIdxRef.current + 1);
        } else {
          // hole / coin / coin_boss / coin_explosion / wall_collapse → 最終結果
          clearVideoSrc();
          goToPhase('result');
        }
        break;
      }
      case 'result':
        setShowResult(true);
        break;
      default:
        break;
    }
  }, [playState, goToPhase, clearVideoSrc]);

  const handleError = useCallback(() => { setVideoReady(true); }, []);

  // 動画レディのフォールバックタイマー
  useEffect(() => {
    const autoPhases: PlayerPhase[] = ['title', 'rise', 'open_skip', 'open_result', 'result'];
    if (videoReady || autoPhases.includes(phase)) return undefined;
    const timeout = isMobile ? 700 : 1500;
    const t = setTimeout(() => setVideoReady(true), timeout);
    return () => clearTimeout(t);
  }, [videoReady, videoKey, phase, isMobile]);

  // ── ユーザー操作ハンドラ ──────────────────────────────

  const handleStandbyNext = useCallback(() => {
    clearVideoSrc();
    allowUnmuteRef.current = true;
    goToPhase('title');
  }, [clearVideoSrc, goToPhase]);

  const handleOpen = useCallback(() => {
    clearVideoSrc();
    allowUnmuteRef.current = true;
    goToPhase('open_result');
  }, [clearVideoSrc, goToPhase]);

  const handleSkip = useCallback(() => {
    // SKIP → 次フロアのriseへ直接遷移
    clearVideoSrc();
    allowUnmuteRef.current = true;
    goToPhase('rise', floorIdxRef.current + 1);
  }, [clearVideoSrc, goToPhase]);

  const handleReplayAnimation = useCallback(() => {
    clearVideoSrc();
    allowUnmuteRef.current = false;
    lastReadyKeyRef.current = null;
    setShowResult(false);
    setVideoReady(false);
    setVideoEnded(false);
    const standbyUrl = computeVideoSrc('standby', null, '', false);
    setCurrentSrc(standbyUrl);
    setIsLoop(true);
    setPhase('standby');
    setFloorIdx(0);
  }, [clearVideoSrc]);

  // 動画のプリフェッチ（次の2つ）
  const upcomingVideos = useMemo(() => {
    if (playState.status !== 'ready') return [];
    const floors = playState.floors;
    const base = playState.videoBasePath;
    const win = playState.isWin;
    const srcs: string[] = [];

    // 現在のフェーズの次に必要な動画を予測
    const fi = floorIdx;
    const floor = floors[fi];
    if (!floor) return [];

    if (phase === 'standby' || phase === 'title') {
      const s = computeVideoSrc('rise', floor, base, win);
      if (s) srcs.push(s);
    }
    if (phase === 'rise') {
      const s = computeVideoSrc('stop', floor, base, win);
      if (s) srcs.push(s);
    }
    if (phase === 'stop' || phase === 'choice') {
      const s = computeVideoSrc('open_result', floor, base, win);
      if (s) srcs.push(s);
      // 次のフロアのrise
      const nextFloor = floors[fi + 1];
      if (nextFloor) {
        const s2 = computeVideoSrc('rise', nextFloor, base, win);
        if (s2) srcs.push(s2);
      }
    }

    return srcs
      .map((s) => resolveAssetSrc(s))
      .filter((s): s is string => Boolean(s));
  }, [phase, floorIdx, playState, resolveAssetSrc]);

  useEffect(() => {
    upcomingVideos.forEach((src) => { fetch(src, { cache: 'force-cache' }).catch(() => {}); });
  }, [upcomingVideos]);

  // ── オーバーレイ表示判定 ──────────────────────────────

  const showFloorNumber = (phase === 'stop' || phase === 'choice') && currentFloor;
  const showOpenSkip = phase === 'choice' && videoEnded && currentFloor
    && currentFloor.stopType !== 'stop_countdown'
    && currentFloor.stopType !== 'stop_multidoor';
  const showCountdown = phase === 'choice' && videoEnded && currentFloor?.stopType === 'stop_countdown';
  const showMultidoor = phase === 'choice' && videoEnded && currentFloor?.stopType === 'stop_multidoor';
  const skipDisabled = currentFloor?.isFinal ?? false;

  const isAutoPhase = ['title', 'rise', 'open_skip', 'open_result', 'result'].includes(phase);
  const showStandbyNext = phase === 'standby' && videoReady;

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
                  {showOverlay && expStars > 0 && <StarOverlay starCount={expStars} />}
                  {showFloorNumber && (
                    <FloorNumberOverlay floorNumber={currentFloor.floorNumber} stopType={currentFloor.stopType} />
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-4 mt-6" style={{ flexShrink: 0 }}>
              {/* オーバーレイUI（軽量モードではフレーム外に表示） */}
              {showOpenSkip && (
                <div className="flex items-center gap-4">
                  <RoundMetalButton label="OPEN" subLabel="開ける" onClick={handleOpen} />
                  <RoundMetalButton label="SKIP" subLabel="見送る" onClick={handleSkip} disabled={skipDisabled} />
                </div>
              )}
              {showCountdown && (
                <CountdownOverlay seconds={countdownSecs} onTimeout={handleOpen} onOpen={handleOpen} />
              )}
              {showMultidoor && (
                <MultidoorOverlay onSelect={() => handleOpen()} />
              )}
              {showStandbyNext && (
                <RoundMetalButton label="START" subLabel="開始" onClick={handleStandbyNext} />
              )}
              {!showOpenSkip && !showCountdown && !showMultidoor && !showStandbyNext && !isAutoPhase && (
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
              {showOverlay && expStars > 0 && <StarOverlay starCount={expStars} />}
              {showFloorNumber && (
                <FloorNumberOverlay floorNumber={currentFloor.floorNumber} stopType={currentFloor.stopType} />
              )}
              {showOpenSkip && (
                <OpenSkipOverlay onOpen={handleOpen} onSkip={handleSkip} skipDisabled={skipDisabled} />
              )}
              {showCountdown && (
                <CountdownOverlay onTimeout={handleOpen} onOpen={handleOpen} />
              )}
              {showMultidoor && (
                <MultidoorOverlay onSelect={() => handleOpen()} />
              )}
            </div>

            {/* standby: STARTボタン */}
            {showStandbyNext && (
              <div className="absolute bottom-12 left-0 right-0 flex items-center justify-center gap-4">
                <RoundMetalButton label="START" subLabel="開始" onClick={handleStandbyNext} />
              </div>
            )}

            {/* 全体SKIPボタン（自動遷移フェーズ以外・choice以外で表示） */}
            {!showStandbyNext && !isAutoPhase && phase !== 'choice' && (
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
