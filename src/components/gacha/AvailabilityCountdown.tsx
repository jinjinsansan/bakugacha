'use client';

import { useEffect, useState } from 'react';

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

function formatJst(iso: string): string {
  return new Date(iso).toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type Props = {
  availableFrom?: string | null;
  availableUntil?: string | null;
};

export function AvailabilityCountdown({ availableFrom, availableUntil }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const fromMs = availableFrom ? new Date(availableFrom).getTime() : null;
  const untilMs = availableUntil ? new Date(availableUntil).getTime() : null;

  // 受付前
  if (fromMs && now < fromMs) {
    const remaining = fromMs - now;
    return (
      <div
        className="rounded-2xl p-4 text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(255,203,69,0.12), rgba(255,203,69,0.04))',
          border: '1px solid rgba(255,203,69,0.4)',
        }}
      >
        <p className="text-[10px] tracking-[0.3em] text-yellow-500/70 uppercase font-bold mb-1">受付開始まで</p>
        <p
          className="text-4xl font-black tabular-nums tracking-widest"
          style={{ color: '#ffe08a', textShadow: '0 0 20px rgba(255,203,69,0.4)' }}
        >
          {formatCountdown(remaining)}
        </p>
        <p className="text-xs text-white/40 mt-2">
          開始: {formatJst(availableFrom!)}
          {availableUntil && ` 〜 ${formatJst(availableUntil)}`}
        </p>
      </div>
    );
  }

  // 受付中（終了カウントダウン）
  if (untilMs && now < untilMs) {
    const remaining = untilMs - now;
    const isUrgent = remaining < 60 * 60 * 1000; // 残り1時間未満
    return (
      <div
        className="rounded-2xl p-4 text-center"
        style={{
          background: isUrgent
            ? 'linear-gradient(135deg, rgba(220,38,38,0.15), rgba(220,38,38,0.05))'
            : 'linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,197,94,0.04))',
          border: `1px solid ${isUrgent ? 'rgba(220,38,38,0.5)' : 'rgba(34,197,94,0.4)'}`,
        }}
      >
        <p className="text-[10px] tracking-[0.3em] uppercase font-bold mb-1" style={{ color: isUrgent ? '#f87171' : '#4ade80' }}>
          {isUrgent ? '⚡ まもなく終了' : '✅ 受付中 — 終了まで'}
        </p>
        <p
          className="text-4xl font-black tabular-nums tracking-widest"
          style={{
            color: isUrgent ? '#f87171' : '#4ade80',
            textShadow: `0 0 20px ${isUrgent ? 'rgba(220,38,38,0.4)' : 'rgba(34,197,94,0.3)'}`,
          }}
        >
          {formatCountdown(remaining)}
        </p>
        <p className="text-xs text-white/40 mt-2">
          終了: {formatJst(availableUntil!)}
        </p>
      </div>
    );
  }

  // 受付終了
  if (untilMs && now >= untilMs) {
    return (
      <div
        className="rounded-2xl p-4 text-center"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <p className="text-sm font-black text-white/40">受付終了</p>
        <p className="text-xs text-white/25 mt-1">終了: {formatJst(availableUntil!)}</p>
      </div>
    );
  }

  return null;
}
