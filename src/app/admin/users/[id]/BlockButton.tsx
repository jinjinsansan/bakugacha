'use client';

import { useTransition } from 'react';
import { blockUser, unblockUser } from '@/app/admin/actions';

export function BlockButton({ userId, isBlocked }: { userId: string; isBlocked: boolean }) {
  const [pending, startTransition] = useTransition();

  const handleClick = () => {
    const message = isBlocked
      ? 'このユーザーのブロックを解除しますか？'
      : 'このユーザーをブロックしますか？ブロック中はログインできなくなります。';
    if (!confirm(message)) return;

    startTransition(async () => {
      if (isBlocked) {
        await unblockUser(userId);
      } else {
        await blockUser(userId);
      }
    });
  };

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${
        isBlocked
          ? 'bg-green-900/50 hover:bg-green-800/70 text-green-300'
          : 'bg-red-900/50 hover:bg-red-800/70 text-red-300'
      }`}
    >
      {pending ? '...' : isBlocked ? 'ブロック解除' : 'ブロック'}
    </button>
  );
}
