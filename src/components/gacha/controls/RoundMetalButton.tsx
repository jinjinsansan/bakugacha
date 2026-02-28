'use client';

import { Fragment, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

type Props = {
  label: ReactNode;
  subLabel?: ReactNode;
  labelClassName?: string;
} & ComponentPropsWithoutRef<'button'>;

export function RoundMetalButton({ label, subLabel, labelClassName, className, disabled, ...props }: Props) {
  const normalizedLabel =
    typeof label === 'string' && label.includes('\n')
      ? label.split('\n').map((seg, i, arr) => (
          <Fragment key={i}>
            {seg}
            {i < arr.length - 1 ? <br /> : null}
          </Fragment>
        ))
      : label;

  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        'group relative h-32 w-32 shrink-0 rounded-full transition-transform active:scale-95 disabled:opacity-40 disabled:saturate-50 disabled:brightness-75 disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    >
      <div className="absolute inset-0 rounded-full border-[5px] border-zinc-500 bg-black shadow-[0_0_18px_rgba(0,0,0,0.6)]" />
      <div className="absolute inset-3 rounded-full border border-zinc-600 bg-gradient-to-b from-zinc-200 via-zinc-400 to-zinc-500 shadow-[inset_0_3px_6px_rgba(255,255,255,0.85),inset_0_-3px_6px_rgba(0,0,0,0.55),0_6px_12px_rgba(0,0,0,0.6)]" />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
        <span className={cn('relative z-10 whitespace-pre-line text-sm font-bold uppercase leading-tight tracking-[0.15em] text-zinc-800 drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]', labelClassName)}>
          {normalizedLabel}
        </span>
        {subLabel && (
          <span className="relative z-10 mt-0.5 text-[9px] font-bold uppercase tracking-[0.25em] text-zinc-700">
            {subLabel}
          </span>
        )}
      </div>
      <div className="pointer-events-none absolute inset-3 rounded-full bg-gradient-to-br from-white/50 to-transparent opacity-60" />
    </button>
  );
}
