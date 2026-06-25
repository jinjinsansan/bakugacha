import type { WinRateResult } from '@/lib/gacha/win-rate';

/**
 * 排出確率の明示（景品表示法に基づく表記）。
 * 当たり/ハズレの実確率を横バーで表示する。架空の値は使わない。
 */
export function DropRateDisclosure({
  rate,
  prizeName,
  hasCap,
}: {
  rate: WinRateResult;
  prizeName: string;
  hasCap?: boolean;
}) {
  const rows = [
    { label: `当たり（${prizeName}）`, pct: rate.winRate, accent: '#d8b15a' },
    { label: 'ハズレ', pct: rate.lossRate, accent: '#7c84a3' },
  ];

  return (
    <div className="card-premium rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-bold text-white">排出確率</h2>
        <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>（景品表示法に基づく表記）</span>
      </div>

      <div className="flex flex-col gap-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3">
            <span className="text-[11px] w-[130px] shrink-0 truncate" style={{ color: 'var(--text-muted)' }}>
              {r.label}
            </span>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: r.accent }} />
            </div>
            <span className="font-en text-xs font-bold w-[46px] text-right" style={{ color: r.accent }}>
              {r.pct}%
            </span>
          </div>
        ))}
      </div>

      {hasCap && (
        <p className="text-[10px] mt-3 leading-relaxed" style={{ color: 'var(--text-dim)' }}>
          ※ 在庫・当選上限に達した場合は、以降の抽選はハズレとなります。
        </p>
      )}
    </div>
  );
}
