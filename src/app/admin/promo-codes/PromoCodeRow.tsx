'use client';

import { useTransition } from 'react';
import { togglePromoCode, deletePromoCode } from '@/app/admin/actions';

interface Props {
  code: {
    id: string;
    code: string;
    coin_amount: number;
    max_uses: number | null;
    used_count: number;
    expires_at: string | null;
    is_active: boolean;
    description: string | null;
  };
}

export function PromoCodeRow({ code }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      await togglePromoCode(code.id, !code.is_active);
    });
  };

  const handleDelete = () => {
    if (!confirm(`コード "${code.code}" を削除します。よろしいですか？`)) return;
    startTransition(async () => {
      await deletePromoCode(code.id);
    });
  };

  const expired = code.expires_at != null && new Date(code.expires_at) < new Date();
  const limitReached = code.max_uses != null && code.used_count >= code.max_uses;

  return (
    <tr className="border-b border-white/5">
      <td className="py-3 px-2">
        <span className="font-mono font-black text-violet-300 tracking-wider">
          {code.code}
        </span>
      </td>
      <td className="py-3 px-2 text-right font-bold text-gold">
        🪙 {code.coin_amount.toLocaleString()}
      </td>
      <td className="py-3 px-2 text-right text-white/70">
        {code.used_count.toLocaleString()} / {code.max_uses != null ? code.max_uses.toLocaleString() : '∞'}
      </td>
      <td className="py-3 px-2 text-white/70">
        {code.expires_at ? new Date(code.expires_at).toLocaleString('ja-JP') : '無期限'}
      </td>
      <td className="py-3 px-2 text-white/60 max-w-[200px] truncate">
        {code.description ?? '-'}
      </td>
      <td className="py-3 px-2 text-center">
        {expired ? (
          <span className="text-[10px] font-bold text-gray-500 px-2 py-0.5 rounded bg-gray-500/10">
            期限切れ
          </span>
        ) : limitReached ? (
          <span className="text-[10px] font-bold text-orange-400 px-2 py-0.5 rounded bg-orange-400/10">
            上限到達
          </span>
        ) : code.is_active ? (
          <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-400/10">
            有効
          </span>
        ) : (
          <span className="text-[10px] font-bold text-gray-500 px-2 py-0.5 rounded bg-gray-500/10">
            無効
          </span>
        )}
      </td>
      <td className="py-3 px-2">
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={handleToggle}
            disabled={isPending}
            className="text-[10px] font-bold px-2 py-1 rounded bg-white/5 text-white/70 hover:bg-white/10 disabled:opacity-50"
          >
            {code.is_active ? '無効化' : '有効化'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="text-[10px] font-bold px-2 py-1 rounded bg-red-500/15 text-red-400 hover:bg-red-500/25 disabled:opacity-50"
          >
            削除
          </button>
        </div>
      </td>
    </tr>
  );
}
