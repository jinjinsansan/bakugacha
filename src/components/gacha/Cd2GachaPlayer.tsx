'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { StarOverlay } from '@/components/gacha/overlays/StarOverlay';
import { RoundMetalButton } from '@/components/gacha/controls/RoundMetalButton';
import { startCd2Gacha } from '@/lib/api/cd2-gacha';
import { useSignedAssetResolver } from '@/lib/gacha/client-assets';
import { buildGachaAssetPath } from '@/lib/gacha/assets';
import { Home, Gift, Coins, User, X, Copy, Play, Sparkles } from 'lucide-react';
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
      accessCode?: string;
    };

const VIDEO_VERSION = '3';

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
      const standbyUrl = `${basePath}/standby/${picked}`;
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
  onClose, onRetry, onReplayAnimation, accessCode,
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
  accessCode?: string;
}) {
  // 当選カードのメディア（実商品画像 → 絵文字 → カード裏のフォールバック）
  // 景品は縦横比が様々（カード/ゲーム機/ギフト券等）。固定枠に押し込むと切れる/余白が出るため、
  // 商品画像は自然な縦横比でそのまま表示する。過大な高さのみ上限を設け contain で安全に収める。
  const prizeMedia = prizeImageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={prizeImageUrl}
      alt={prizeName ?? ''}
      className="block w-full"
      style={{ borderRadius: 13, maxHeight: '46vh', objectFit: 'contain' }}
    />
  ) : prizeEmoji ? (
    <div className="flex w-full items-center justify-center" style={{ aspectRatio: '3 / 4', borderRadius: 13, background: prizeGradient ?? 'linear-gradient(135deg,#1a1a2e,#16213e)' }}>
      <span style={{ fontSize: 56 }}>{prizeEmoji}</span>
    </div>
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/card-back.png" alt="" className="block w-full" style={{ borderRadius: 13 }} />
  );

  const sparks: { top: number; left?: number; right?: number; c: string; s: number; d: string; delay: string }[] = [
    { top: 120, left: 58, c: '#f0d68a', s: 6, d: '2.4s', delay: '0s' },
    { top: 200, right: 50, c: '#ff72bf', s: 5, d: '2s', delay: '.4s' },
    { top: 330, left: 40, c: '#8fe8ff', s: 4, d: '2.8s', delay: '.8s' },
    { top: 300, right: 44, c: '#f0d68a', s: 6, d: '2.2s', delay: '1.1s' },
  ];

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden" style={{ background: '#06070f', color: '#eef1f8' }}>

      {/* 背景グロー */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: isWin
            ? 'radial-gradient(70% 42% at 50% 30%, rgba(216,177,90,0.22), transparent 60%), radial-gradient(90% 50% at 50% 6%, rgba(255,46,154,0.2), transparent 55%), radial-gradient(80% 50% at 50% 40%, rgba(56,210,255,0.12), transparent 60%)'
            : 'radial-gradient(80% 45% at 50% 22%, rgba(56,210,255,0.1), transparent 58%), radial-gradient(70% 40% at 50% 4%, rgba(154,123,255,0.1), transparent 55%)',
        }}
      />

      {/* 回転光線＋粒子（当選時のみ） */}
      {isWin && (
        <>
          <div
            className="pointer-events-none absolute"
            style={{
              top: 150, left: '50%', width: 560, height: 560, transform: 'translateX(-50%)', borderRadius: '50%',
              background: 'repeating-conic-gradient(from 0deg, rgba(240,214,138,0.14) 0deg 6deg, transparent 6deg 18deg)',
              WebkitMaskImage: 'radial-gradient(circle, #000 0%, transparent 62%)',
              maskImage: 'radial-gradient(circle, #000 0%, transparent 62%)',
              animation: 'gr-rays 60s linear infinite',
            }}
          />
          {sparks.map((p, i) => (
            <span key={i} className="pointer-events-none absolute rounded-full"
              style={{ top: p.top, left: p.left, right: p.right, width: p.s, height: p.s, background: p.c, boxShadow: `0 0 12px ${p.c}`, animation: `gr-spark ${p.d} infinite ${p.delay}` }} />
          ))}
        </>
      )}

      {/* ヘッダー */}
      <div className="relative z-[3] flex items-center justify-between px-[18px] py-4">
        <span className="font-serif" style={{ fontWeight: 600, fontSize: 15, letterSpacing: '0.1em', color: '#fff' }}>ガチャ結果</span>
        <button onClick={onClose} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
          style={{ color: '#a6aecb', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          あとで <X size={13} />
        </button>
      </div>

      {/* コンテンツ */}
      <div className="relative z-[3] flex flex-1 flex-col items-center overflow-y-auto px-5">
        {isWin ? (
          <>
            <div className="mb-3 text-center" style={{ animation: 'gr-rise .6s ease both' }}>
              <div className="font-en mb-2" style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.4em', color: '#ff72bf' }}>CONGRATULATIONS</div>
              <div className="font-serif" style={{ fontWeight: 600, fontSize: 25, letterSpacing: '0.06em', background: 'linear-gradient(135deg,#f0d68a 0%,#ffffff 50%,#ff9ed0 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>当選おめでとう</div>
            </div>

            {/* 当選カード（タップで演出リプレイ） */}
            <button onClick={onReplayAnimation} aria-label="演出をもう一度見る" className="relative mb-4 block w-[230px]" style={{ animation: 'gr-floaty 5s ease-in-out infinite' }}>
              <span className="pointer-events-none absolute" style={{ inset: -14, borderRadius: 22, background: 'radial-gradient(circle, rgba(216,177,90,0.4), transparent 70%)', filter: 'blur(6px)' }} />
              <span className="relative block" style={{ borderRadius: 13, boxShadow: '0 16px 44px rgba(0,0,0,0.6), 0 0 30px rgba(216,177,90,0.3)' }}>
                {prizeMedia}
              </span>
              <span className="absolute left-2.5 top-2.5 z-[2] rounded-lg px-2.5 py-1 text-[10px] font-black"
                style={{ letterSpacing: '0.1em', background: 'linear-gradient(135deg,#f0d68a,#d8b15a)', color: '#2a1e06', boxShadow: '0 0 16px rgba(216,177,90,0.45)' }}>当選</span>
              <span className="absolute -bottom-2 left-1/2 z-[2] inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[10px] font-bold"
                style={{ color: '#eef1f8', background: 'rgba(6,7,15,0.8)', border: '1px solid rgba(216,177,90,0.4)', boxShadow: '0 4px 14px rgba(0,0,0,0.5)' }}>
                <Play size={10} color="#ff72bf" fill="#ff72bf" /> 演出をもう一度見る
              </span>
            </button>

            {/* 商品名＋コスト */}
            <div className="mb-4 mt-2 text-center">
              <div className="mb-2 inline-flex items-center gap-1.5">
                <span style={{ height: 1, width: 24, background: 'linear-gradient(90deg,transparent,#d8b15a)' }} />
                <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.16em', color: '#f0d68a' }}>WINNER</span>
                <span style={{ height: 1, width: 24, background: 'linear-gradient(90deg,#d8b15a,transparent)' }} />
              </div>
              <div className="mb-1.5" style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{prizeName ?? '当たり'}</div>
              {coinCost != null && (
                <div style={{ fontSize: 11, color: '#7c84a3' }}>消費コイン <span className="font-en" style={{ fontSize: 14, fontWeight: 800, verticalAlign: '-1px', background: 'linear-gradient(135deg,#f0d68a,#d8b15a)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{coinCost.toLocaleString()} C</span></div>
              )}
            </div>

            {/* 権利コード */}
            {accessCode && (
              <button onClick={() => navigator.clipboard?.writeText(accessCode)} title="タップでコピー"
                className="mb-4 flex w-full items-center justify-between gap-2.5 rounded-[14px] px-4 py-3 text-left"
                style={{ background: 'rgba(20,26,46,0.7)', border: '1px solid rgba(154,123,255,0.4)' }}>
                <span>
                  <span className="mb-1 block" style={{ fontSize: 9, color: '#c0a8ff', letterSpacing: '0.12em' }}>権利コード</span>
                  <span className="font-en block" style={{ fontSize: 17, fontWeight: 700, letterSpacing: '0.16em', color: '#eef1f8' }}>{accessCode}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-[10px] px-3 py-2 text-[11px] font-extrabold"
                  style={{ color: '#c0a8ff', background: 'rgba(154,123,255,0.16)', border: '1px solid rgba(154,123,255,0.45)' }}>
                  <Copy size={13} /> コピー
                </span>
              </button>
            )}
          </>
        ) : (
          <>
            <div className="my-[18px] text-center">
              <div className="font-en mb-2.5" style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.4em', color: '#7c84a3' }}>NEXT TIME</div>
              <div className="font-serif" style={{ fontWeight: 600, fontSize: 25, letterSpacing: '0.06em', color: '#eef1f8' }}>またチャレンジ</div>
              <div className="mt-2.5" style={{ fontSize: 13, color: '#a6aecb', lineHeight: 1.8 }}>次回のチャレンジに期待しましょう！</div>
            </div>

            {/* カード裏（未当選） */}
            <div className="relative mb-5 w-[210px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/card-back.png" alt="" className="block w-full" style={{ borderRadius: 13, boxShadow: '0 14px 36px rgba(0,0,0,0.55)' }} />
              <span className="absolute left-2.5 top-2.5 rounded-lg px-2.5 py-1 text-[10px] font-black"
                style={{ letterSpacing: '0.1em', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', color: '#a6aecb' }}>未当選</span>
            </div>

            {coinCost != null && (
              <div className="mb-[18px] text-center" style={{ fontSize: 11, color: '#7c84a3' }}>消費コイン <span className="font-en" style={{ fontSize: 14, fontWeight: 800, verticalAlign: '-1px', color: '#a6aecb' }}>{coinCost.toLocaleString()} C</span></div>
            )}

            {/* 励ましバンド（架空の確率は出さない） */}
            <div className="flex w-full items-center gap-3 rounded-[14px] px-4 py-3.5"
              style={{ background: 'linear-gradient(120deg, rgba(56,210,255,0.08), rgba(154,123,255,0.06))', border: '1px solid rgba(56,210,255,0.22)' }}>
              <Sparkles size={22} className="flex-shrink-0" style={{ color: '#8fe8ff' }} />
              <div style={{ fontSize: 12, color: '#a6aecb', lineHeight: 1.7 }}>当選確率は各ガチャ詳細に明記しています。連続チャレンジで当選のチャンスが広がります。</div>
            </div>
          </>
        )}
        <div className="h-2 shrink-0" />
      </div>

      {/* 下部固定: もう一度引く＋4導線 */}
      <div className="relative z-[3] px-[18px] pt-3.5"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 18px)', background: 'linear-gradient(0deg, #06070f 76%, transparent)' }}>
        <button onClick={onRetry} className="mb-3 w-full rounded-[15px] py-4 text-[15px] font-black text-white"
          style={{ background: 'linear-gradient(135deg,#ff2e9a,#c01e6e 55%,#9a7bff)', boxShadow: '0 0 28px rgba(255,46,154,0.5)' }}>
          もう一度引く（{coinCost?.toLocaleString() ?? 0} C）
        </button>
        <div className="grid grid-cols-4 gap-2">
          {([
            { href: '/home',           icon: Home,  label: 'ホーム',     accent: false },
            { href: '/mypage#history', icon: Gift,  label: '獲得商品',   accent: true },
            { href: '/purchase',       icon: Coins, label: 'コイン',     accent: false },
            { href: '/mypage',         icon: User,  label: 'マイページ', accent: false },
          ] as const).map(({ href, icon: Icon, label, accent }) => (
            <a key={label} href={href} className="flex flex-col items-center gap-1.5 rounded-xl py-2.5"
              style={accent
                ? { background: 'rgba(216,177,90,0.1)', border: '1px solid rgba(216,177,90,0.32)', color: '#f0d68a' }
                : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#a6aecb' }}>
              <Icon size={18} />
              <span style={{ fontSize: 9, fontWeight: 700 }}>{label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── メインプレイヤー ──────────────────────────────────────────
function ActivePlayer({
  onClose, onRetry, prizeName, prizeImageUrl, prizeEmoji, prizeGradient, coinCost, productId, quality, accessCode, bonusWinVideoUrl,
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
  accessCode?: string;
  bonusWinVideoUrl?: string;
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
  const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // APIコール
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await startCd2Gacha(productId, quality, accessCode);
        if (cancelled) return;
        const builtQueue = buildQueue(res.sequence, res.videoBasePath);
        if (res.isWin && bonusWinVideoUrl) {
          builtQueue.push({ key: 'bonus-win', src: `${res.videoBasePath}/${bonusWinVideoUrl}`, step: 'bonus_win', autoAdvance: true });
        }
        setQueue(builtQueue);
        setPlayState({ status: 'ready', ...res });
        setIndex(0);
        setVideoReady(false);
      } catch (err) {
        if (cancelled) return;
        setPlayState({ status: 'error', message: err instanceof Error ? err.message : '開始に失敗しました' });
      }
    })();
    return () => { cancelled = true; };
  }, [productId, quality, accessCode, bonusWinVideoUrl]);

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

  const clearVideoSrc = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.pause(); v.src = ''; v.load();
  }, []);

  useEffect(() => {
    if (!current?.isFreeze) return undefined;
    const t = setTimeout(() => setShowResult(true), 10000);
    return () => clearTimeout(t);
  }, [current?.isFreeze, videoKey]);

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
    const timeout = isMobile ? 700 : 1500;
    const t = setTimeout(() => setVideoReady(true), timeout);
    return () => clearTimeout(t);
  }, [videoReady, videoKey, current?.isFreeze, current?.autoAdvance, isMobile]);

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
  const nextDisabled = !videoReady || playState.status !== 'ready' || isFreezeStep || isAutoStep;
  const expStars     = playState.status === 'ready' ? playState.expectationStars : 0;
  const isWin        = playState.status === 'ready' ? playState.isWin : false;

  const isLowQuality = quality === 'low';

  // ── 軽量モード ────────────────────────────────────────────
  if (isLowQuality) {
    return (
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/90">

        {/* 結果画面（枠外・フルスクリーン相当） */}
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
              accessCode={playState.accessCode}
            />
          </div>
        )}

        {!showResult && (
          <>
            {/* 動画枠（枠線あり・固定サイズ） */}
            <div style={{
              width: '72vw',
              maxWidth: 300,
              flexShrink: 0,
              borderRadius: 12,
              overflow: 'hidden',
              border: '2px solid rgba(255,46,154,0.4)',
              boxShadow: '0 0 0 1px rgba(255,46,154,0.12), 0 0 28px rgba(255,46,154,0.25), 0 8px 40px rgba(0,0,0,0.9)',
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
                  {isFreezeStep ? (
                    <FreezeOverlay />
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              )}
            </div>

            {/* NEXT/SKIPボタン（常時表示・枠外・固定）。エラー時は閉じるボタンに切替（詰み防止） */}
            <div className="flex items-center justify-center gap-4 mt-6" style={{ flexShrink: 0 }}>
              {playState.status === 'error' ? (
                <RoundMetalButton label="閉じる" subLabel="CLOSE" onClick={onClose} />
              ) : (
                <>
                  <RoundMetalButton label="NEXT" subLabel="進む" onClick={goNext} disabled={nextDisabled} />
                  <RoundMetalButton label="SKIP" subLabel="スキップ" onClick={() => setShowResult(true)} />
                </>
              )}
            </div>
          </>
        )}

        {/* 先読み */}
        <div aria-hidden style={{ position: 'fixed', top: -2, left: -2, width: 1, height: 1, opacity: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          {upcomingVideos.map((src) => (
            <video key={src} src={src} preload="auto" playsInline muted autoPlay />
          ))}
        </div>
      </div>
    );
  }

  // ── 高画質モード（従来レイアウト） ───────────────────────
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

            {!isFreezeStep && (
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
            accessCode={playState.accessCode}
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
  open, onClose, onRetry, prizeName, prizeImageUrl, prizeEmoji, prizeGradient, coinCost, productId, quality, accessCode, bonusWinVideoUrl,
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
  accessCode?: string;
  bonusWinVideoUrl?: string;
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
      accessCode={accessCode}
      bonusWinVideoUrl={bonusWinVideoUrl}
    />,
    portalTarget,
  );
}
