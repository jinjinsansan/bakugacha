'use client';

import { useEffect, useState } from 'react';
export function FloorNumberOverlay({
  floorNumber,
  stopType,
}: {
  floorNumber: number;
  stopType: string;
}) {
  const [displayNum, setDisplayNum] = useState(floorNumber);
  const [settled, setSettled] = useState(false);

  // stop_numchaos: 高速切替アニメーション後に確定
  useEffect(() => {
    if (stopType !== 'stop_numchaos') {
      setDisplayNum(floorNumber);
      setSettled(true);
      return;
    }
    setSettled(false);
    let count = 0;
    const maxCount = 20;
    const interval = setInterval(() => {
      setDisplayNum(Math.floor(Math.random() * 99) + 1);
      count++;
      if (count >= maxCount) {
        clearInterval(interval);
        setDisplayNum(floorNumber);
        setSettled(true);
      }
    }, 80);
    return () => clearInterval(interval);
  }, [floorNumber, stopType]);

  const isBoss = stopType === 'stop_boss';
  const isReverse = stopType === 'stop_numreverse';

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      <div
        className="flex flex-col items-center gap-2 px-8 py-6 rounded-2xl"
        style={{
          background: isBoss
            ? 'radial-gradient(circle, rgba(180,30,30,0.85) 0%, rgba(80,0,0,0.9) 100%)'
            : 'radial-gradient(circle, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.85) 100%)',
          boxShadow: isBoss
            ? '0 0 40px rgba(255,60,60,0.5), 0 0 80px rgba(255,30,30,0.3)'
            : '0 0 40px rgba(200,170,80,0.3)',
          border: isBoss ? '2px solid rgba(255,100,100,0.6)' : '2px solid rgba(200,170,80,0.4)',
        }}
      >
        {isBoss && (
          <span className="text-xs font-black tracking-[0.3em] text-red-300 uppercase">
            BOSS
          </span>
        )}
        <span
          className="font-black tabular-nums"
          style={{
            fontSize: isBoss ? 72 : 64,
            color: isBoss ? '#ff6b6b' : '#c9a84c',
            textShadow: isBoss
              ? '0 0 20px rgba(255,100,100,0.8), 0 2px 4px rgba(0,0,0,0.5)'
              : '0 0 20px rgba(200,170,80,0.6), 0 2px 4px rgba(0,0,0,0.5)',
            transform: isReverse ? 'rotate(180deg)' : undefined,
            transition: settled ? 'none' : 'transform 0.05s',
          }}
        >
          {displayNum}F
        </span>
        {!isBoss && (
          <span className="text-xs text-white/50 tracking-widest">FLOOR</span>
        )}
      </div>
    </div>
  );
}
