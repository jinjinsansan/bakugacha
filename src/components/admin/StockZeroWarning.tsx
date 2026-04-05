'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * 商品フォーム内で「提供回数」「残り回数」の入力を監視し、
 * 0 以下が入力された瞬間に「終了ガチャとして公開される」警告バーを表示する。
 * 0 より大きい間は、通常のヒント文を表示する。
 */
export function StockZeroWarning() {
  const ref = useRef<HTMLDivElement>(null);
  const [isZero, setIsZero] = useState(false);

  useEffect(() => {
    const form = ref.current?.closest('form');
    if (!form) return;

    const check = () => {
      const totalEl = form.querySelector('[name="stock_total"]') as HTMLInputElement | null;
      const remainingEl = form.querySelector('[name="stock_remaining"]') as HTMLInputElement | null;
      if (!totalEl) {
        setIsZero(false);
        return;
      }
      const tv = totalEl.value.trim();
      if (tv === '') {
        setIsZero(false);
        return;
      }
      const tn = Number(tv);
      const rv = remainingEl?.value.trim() ?? '';
      const rn = rv === '' ? tn : Number(rv);
      const zero = !Number.isNaN(tn) && (tn <= 0 || (!Number.isNaN(rn) && rn <= 0));
      setIsZero(zero);
    };

    check();
    form.addEventListener('input', check);
    return () => form.removeEventListener('input', check);
  }, []);

  return (
    <div ref={ref} className="-mt-2">
      {isZero ? (
        <div
          className="rounded-lg border px-4 py-3 text-sm font-bold flex items-start gap-2"
          style={{
            background: 'rgba(120,20,20,0.35)',
            borderColor: 'rgba(220,80,80,0.6)',
            color: '#fecaca',
            boxShadow: '0 0 0 1px rgba(220,80,80,0.25), 0 4px 12px rgba(0,0,0,0.4)',
          }}
          role="alert"
        >
          <span className="text-base leading-none pt-0.5">⚠️</span>
          <span>
            提供回数が <strong className="text-red-200">0</strong> のため、この商品は
            <strong className="text-red-200">「SOLD OUT（終了ガチャ）」</strong>として公開されます。
            <br />
            <span className="font-normal text-red-200/80">
              サムネイルはグレーアウト表示となり、ガチャボタンは非表示になります。
            </span>
          </span>
        </div>
      ) : (
        <p className="text-xs text-yellow-300/70">
          💡 提供回数を <strong>0</strong> で作成すると、サイトに
          <strong>「SOLD OUT（終了ガチャ）」</strong>として表示されます。
        </p>
      )}
    </div>
  );
}
