'use client';

export interface WinnerItem {
  id: string;
  maskedName: string;
  productTitle: string;
  timeAgo: string;
}

export function WinnerTicker({ items }: { items: WinnerItem[] }) {
  if (items.length === 0) return null;

  // Duplicate the list so the scroll loops seamlessly
  const doubled = [...items, ...items];

  return (
    <div className="winner-ticker-wrap overflow-hidden relative" style={{ height: `${Math.min(items.length, 5) * 52}px` }}>
      <div className="winner-ticker-track flex flex-col gap-2">
        {doubled.map((item, i) => (
          <div
            key={`${item.id}-${i}`}
            className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 shrink-0"
          >
            <span className="text-yellow-300 text-lg shrink-0">&#127942;</span>
            <div className="flex-1 min-w-0 text-sm truncate">
              <span className="font-bold text-white">{item.maskedName}</span>
              <span className="text-white/50 text-xs mx-1">さんが</span>
              <span className="text-yellow-200 font-medium">{item.productTitle}</span>
              <span className="text-white/50 text-xs ml-1">に当選</span>
            </div>
            <span className="text-xs text-white/40 shrink-0">{item.timeAgo}</span>
          </div>
        ))}
      </div>

      <style jsx>{`
        .winner-ticker-wrap {
          mask-image: linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%);
          -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%);
        }
        .winner-ticker-track {
          animation: ticker-scroll ${items.length * 3}s linear infinite;
        }
        .winner-ticker-track:hover {
          animation-play-state: paused;
        }
        @keyframes ticker-scroll {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
      `}</style>
    </div>
  );
}
