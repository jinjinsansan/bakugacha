'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { redeemPromoCode } from '@/app/(main)/mypage/actions';

export function PromoCodeInput() {
  const [code, setCode] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error('プロモコードを入力してください。');
      return;
    }
    startTransition(async () => {
      const result = await redeemPromoCode(code);
      if (result.ok) {
        toast.success(`+${result.amount} コインを受け取りました！`);
        setCode('');
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div
      className="rounded-2xl p-5 mb-6"
      style={{
        background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(139,92,246,0.04))',
        border: '1px solid rgba(139,92,246,0.35)',
      }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-1">
          <p className="text-[10px] tracking-[0.3em] text-gray-500 uppercase mb-1">
            Promo Code
          </p>
          <p className="text-sm font-bold text-white mb-1">🎫 プロモコード</p>
          <p className="text-xs text-white/60">
            特別なコードを入力してコインを受け取れます
          </p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="コードを入力"
          disabled={isPending}
          className="flex-1 rounded-lg bg-white/10 border border-white/15 px-4 py-2.5 text-sm font-bold text-white placeholder-white/30 focus:outline-none focus:border-violet-400/70 uppercase tracking-wider disabled:opacity-60"
          maxLength={40}
        />
        <button
          type="submit"
          disabled={isPending || !code.trim()}
          className="px-5 py-2.5 rounded-lg text-xs font-black tracking-wider whitespace-nowrap text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
            boxShadow: '0 2px 8px rgba(124,58,237,0.35)',
          }}
        >
          {isPending ? '処理中...' : '引換'}
        </button>
      </form>
    </div>
  );
}
