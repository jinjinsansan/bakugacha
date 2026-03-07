'use client';

import { useTransition } from 'react';

export function DeleteButton({ title, deleteAction }: { title: string; deleteAction: () => Promise<{ ok: boolean; error?: string }> }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="px-2 py-1 rounded bg-red-900/50 hover:bg-red-800/70 text-red-300 text-xs transition-colors disabled:opacity-50"
      onClick={() => {
        if (!confirm(`「${title}」を削除しますか？`)) return;
        startTransition(async () => {
          const result = await deleteAction();
          if (!result.ok) {
            alert(result.error ?? '削除に失敗しました');
          }
        });
      }}
    >
      {pending ? '...' : '削除'}
    </button>
  );
}
