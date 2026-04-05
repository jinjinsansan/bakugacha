'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { claimDailyLoginBonus } from '@/app/(main)/mypage/actions';

interface DailyLoginBonusProps {
  amount: number;
  alreadyClaimed: boolean;
}

export function DailyLoginBonus({ amount, alreadyClaimed }: DailyLoginBonusProps) {
  const [isPending, startTransition] = useTransition();
  const [claimed, setClaimed] = useState(alreadyClaimed);

  // 金額が 0 の場合は「準備中」カードを表示
  if (amount <= 0) {
    return (
      <div
        className="rounded-2xl p-5 mb-6 overflow-hidden"
        style={{
          background: '#0a0a1c',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] tracking-[0.3em] text-gray-500 uppercase mb-1">
              Daily Login Bonus
            </p>
            <p className="text-sm font-bold text-white/60">🎁 デイリーログインボーナス</p>
            <p className="text-xs text-white/40 mt-1">現在準備中です。お楽しみに！</p>
          </div>
        </div>
      </div>
    );
  }

  const handleClaim = () => {
    startTransition(async () => {
      const result = await claimDailyLoginBonus();
      if (result.ok) {
        toast.success(`ログインボーナス +${result.amount} コインを受け取りました！`);
        setClaimed(true);
      } else {
        toast.error(result.error);
        if (result.error.includes('受け取り済み')) setClaimed(true);
      }
    });
  };

  return (
    <div
      className="rounded-2xl p-5 mb-6 overflow-hidden"
      style={{
        background: claimed
          ? '#0a0a1c'
          : 'linear-gradient(135deg, rgba(201,168,76,0.18), rgba(201,168,76,0.06))',
        border: claimed
          ? '1px solid rgba(255,255,255,0.07)'
          : '1px solid rgba(201,168,76,0.45)',
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] tracking-[0.3em] text-gray-500 uppercase mb-1">
            Daily Login Bonus
          </p>
          <p className="text-sm text-white/80">
            {claimed ? (
              <>本日のログインボーナスは受け取り済みです</>
            ) : (
              <>
                本日のログインボーナス <span className="text-gold font-black">+{amount} コイン</span> を受け取れます！
              </>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={handleClaim}
          disabled={claimed || isPending}
          className={
            claimed
              ? 'shrink-0 px-3 py-2 rounded-xl text-xs font-black bg-white/5 text-gray-500 cursor-not-allowed whitespace-nowrap'
              : 'btn-gold shrink-0 px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap disabled:opacity-60'
          }
        >
          {claimed ? '受取済' : isPending ? '処理中...' : '🎁 受け取る'}
        </button>
      </div>
    </div>
  );
}
