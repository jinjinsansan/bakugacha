'use client';

import { useEffect, useState } from 'react';

export function StarOverlay({ starCount }: { starCount: number }) {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    setVisible(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < starCount; i++) {
      timers.push(setTimeout(() => setVisible(i + 1), i * 300));
    }
    return () => timers.forEach(clearTimeout);
  }, [starCount]);

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="inline-flex flex-col items-center gap-2 rounded-full bg-black/45 px-6 py-3 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
        <p className="text-[10px] tracking-[0.4em] text-white/70">期待度</p>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => {
            const lit = i < visible;
            return (
              <span
                key={i}
                className={`text-3xl leading-none transition-all duration-300 ${lit ? 'scale-100 opacity-100 text-yellow-300' : 'scale-90 opacity-35 text-zinc-500'}`}
                style={{ textShadow: lit ? '0 0 12px rgba(250,250,210,0.9), 0 0 26px rgba(201,168,76,0.7)' : undefined }}
              >
                ★
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
