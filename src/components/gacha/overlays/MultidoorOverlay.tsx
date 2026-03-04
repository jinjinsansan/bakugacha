'use client';

import { useState } from 'react';

export function MultidoorOverlay({
  onSelect,
}: {
  onSelect: (doorIndex: number) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  const handlePick = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setTimeout(() => onSelect(idx), 400);
  };

  const doors = [
    { label: 'A', color: '#c9a84c' },
    { label: 'B', color: '#8b9dc3' },
    { label: 'C', color: '#c97b4c' },
  ];

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
      <p className="text-sm font-bold text-white/80 mb-4 tracking-wider">
        ドアを選べ
      </p>
      <div className="flex gap-4">
        {doors.map((door, idx) => {
          const isSelected = selected === idx;
          const isOther = selected !== null && !isSelected;
          return (
            <button
              key={door.label}
              onClick={() => handlePick(idx)}
              disabled={selected !== null}
              className="flex flex-col items-center gap-2 transition-all duration-300 pointer-events-auto"
              style={{
                opacity: isOther ? 0.3 : 1,
                transform: isSelected ? 'scale(1.15)' : isOther ? 'scale(0.9)' : 'scale(1)',
              }}
            >
              <div
                className="w-20 h-28 rounded-xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(180deg, ${door.color}33 0%, ${door.color}11 100%)`,
                  border: isSelected
                    ? `3px solid ${door.color}`
                    : `2px solid ${door.color}66`,
                  boxShadow: isSelected
                    ? `0 0 30px ${door.color}55`
                    : `0 0 10px ${door.color}22`,
                }}
              >
                <span
                  className="text-3xl font-black"
                  style={{ color: door.color }}
                >
                  {door.label}
                </span>
              </div>
              <span className="text-xs text-white/50 font-bold">
                DOOR {door.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
