'use client';

import { useTransition } from 'react';
import { deleteBanner } from '@/app/admin/actions';

/** バナー削除ボタン（確認ダイアログ付き）。 */
export function BannerDeleteButton({ id, title }: { id: string; title: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
      onClick={() => {
        if (!confirm(`バナー「${title}」を削除しますか？この操作は取り消せません。`)) return;
        startTransition(async () => {
          await deleteBanner(id);
        });
      }}
    >
      {pending ? '...' : '削除'}
    </button>
  );
}
