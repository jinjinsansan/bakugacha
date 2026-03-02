'use client';

import { useTransition } from 'react';
import { createDelivery, updateDeliveryStatus } from '@/app/admin/actions';

export function CreateDeliveryButton({ gachaResultId, userId }: { gachaResultId: string; userId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => createDelivery(gachaResultId, userId))}
      className="px-2 py-1 rounded bg-yellow-900/50 hover:bg-yellow-800/70 text-yellow-300 text-xs font-bold transition-colors disabled:opacity-50"
    >
      {pending ? '...' : '配達登録'}
    </button>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DeliveryStatusForm({ delivery }: { delivery: Record<string, any> }) {
  const [pending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    startTransition(() => updateDeliveryStatus(delivery.id as string, formData));
  };

  return (
    <form action={handleSubmit} className="flex flex-col gap-2 mt-2 p-3 rounded-lg bg-white/5 border border-white/10">
      <div className="flex gap-2 items-center flex-wrap">
        <select
          name="status"
          defaultValue={delivery.status as string}
          className="px-2 py-1 rounded bg-white/10 text-white text-xs border border-white/10"
        >
          <option value="pending">未発送</option>
          <option value="shipped">発送済み</option>
          <option value="delivered">配達完了</option>
        </select>
        <input
          name="tracking_number"
          defaultValue={(delivery.tracking_number as string) ?? ''}
          placeholder="追跡番号"
          className="px-2 py-1 rounded bg-white/10 text-white text-xs border border-white/10 placeholder-white/30 w-40"
        />
      </div>
      <textarea
        name="notes"
        defaultValue={(delivery.notes as string) ?? ''}
        placeholder="メモ"
        rows={2}
        className="px-2 py-1 rounded bg-white/10 text-white text-xs border border-white/10 placeholder-white/30 resize-none"
      />
      <button
        type="submit"
        disabled={pending}
        className="self-start px-3 py-1 rounded bg-blue-900/50 hover:bg-blue-800/70 text-blue-300 text-xs font-bold transition-colors disabled:opacity-50"
      >
        {pending ? '更新中...' : '更新'}
      </button>
    </form>
  );
}
