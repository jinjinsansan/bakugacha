'use client';

import { useEffect, useRef, useState } from 'react';

export function CountdownOverlay({
  seconds = 5,
  onTimeout,
  onOpen,
}: {
  seconds?: number;
  onTimeout: () => void;
  onOpen: () => void;
}) {
  const [remaining, setRemaining] = useState(seconds);
  const timedOutRef = useRef(false);

  useEffect(() => {
    if (remaining <= 0) {
      if (!timedOutRef.current) {
        timedOutRef.current = true;
        onTimeout();
      }
      return;
    }
    const t = setTimeout(() => setRemaining((prev) => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onTimeout]);

  const isUrgent = remaining <= 2;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
      <div
        className="flex flex-col items-center gap-3 px-10 py-8 rounded-2xl"
        style={{
          background: 'radial-gradient(circle, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.9) 100%)',
          border: isUrgent ? '2px solid rgba(255,60,60,0.6)' : '2px solid rgba(200,170,80,0.4)',
          boxShadow: isUrgent
            ? '0 0 40px rgba(255,60,60,0.4)'
            : '0 0 40px rgba(200,170,80,0.2)',
        }}
      >
        <span className="text-xs font-bold tracking-[0.2em] text-white/60 uppercase">
          TIME LIMIT
        </span>
        <span
          className="font-black tabular-nums"
          style={{
            fontSize: 80,
            color: isUrgent ? '#ff4444' : '#c9a84c',
            textShadow: isUrgent
              ? '0 0 30px rgba(255,60,60,0.8)'
              : '0 0 20px rgba(200,170,80,0.6)',
            transition: 'color 0.3s, text-shadow 0.3s',
          }}
        >
          {remaining}
        </span>
        {remaining > 0 && (
          <button
            className="mt-2 px-8 py-2.5 rounded-full font-bold text-sm text-white/90 pointer-events-auto"
            style={{
              background: 'linear-gradient(135deg, #c9a84c 0%, #a07c30 100%)',
              boxShadow: '0 4px 20px rgba(200,170,80,0.4)',
            }}
            onClick={onOpen}
          >
            OPEN
          </button>
        )}
      </div>
    </div>
  );
}
