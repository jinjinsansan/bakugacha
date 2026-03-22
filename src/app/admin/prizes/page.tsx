import { getServiceSupabase } from '@/lib/supabase/service';
import { fetchAllPrizeClaims } from '@/lib/data/prize-claims';
import { updatePrizeClaim } from '@/app/admin/actions';

const STATUS_OPTIONS = [
  { value: 'all', label: '全て' },
  { value: 'pending', label: '選択待ち' },
  { value: 'delivery_requested', label: '配送希望' },
  { value: 'shipped', label: '発送済み' },
  { value: 'delivered', label: '配達完了' },
  { value: 'code_sent', label: 'コード送付済み' },
  { value: 'converted', label: 'コイン交換済み' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-400',
  delivery_requested: 'text-blue-400',
  shipped: 'text-emerald-400',
  delivered: 'text-gray-400',
  code_sent: 'text-emerald-400',
  converted: 'text-gray-500',
};

export default async function AdminPrizesPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; saved?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = params?.status ?? 'all';
  const supabase = getServiceSupabase();
  const claims = await fetchAllPrizeClaims(supabase, statusFilter);

  const pendingCount = claims.filter((c) => c.status === 'pending').length;
  const deliveryCount = claims.filter((c) => c.status === 'delivery_requested').length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-white">当選品管理</h1>
        <div className="flex gap-2 text-xs">
          {pendingCount > 0 && (
            <span className="px-2 py-1 rounded-full bg-yellow-400/20 text-yellow-400 font-bold">
              選択待ち {pendingCount}
            </span>
          )}
          {deliveryCount > 0 && (
            <span className="px-2 py-1 rounded-full bg-blue-400/20 text-blue-400 font-bold">
              配送希望 {deliveryCount}
            </span>
          )}
        </div>
      </div>

      {params?.saved && (
        <div className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3">
          <p className="text-sm font-semibold text-emerald-300">更新しました</p>
        </div>
      )}

      {/* フィルター */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_OPTIONS.map((opt) => (
          <a
            key={opt.value}
            href={`/admin/prizes${opt.value === 'all' ? '' : `?status=${opt.value}`}`}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
              statusFilter === opt.value
                ? 'bg-white/20 text-white'
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            {opt.label}
          </a>
        ))}
      </div>

      {claims.length === 0 ? (
        <div className="card-premium p-8 text-center text-gray-500 text-sm">
          該当する当選品はありません
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {claims.map((claim) => (
            <div key={claim.id} className="card-premium p-4 flex flex-col gap-3">
              {/* ヘッダー */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{claim.prizeName}</p>
                  <p className="text-[10px] text-gray-500">
                    {claim.userEmail || claim.userDisplayName || claim.userId.slice(0, 8)}
                    {' / '}
                    {new Date(claim.createdAt).toLocaleString('ja-JP')}
                  </p>
                </div>
                <span className={`text-xs font-bold shrink-0 ${STATUS_COLORS[claim.status] ?? 'text-gray-400'}`}>
                  {STATUS_OPTIONS.find((o) => o.value === claim.status)?.label ?? claim.status}
                </span>
              </div>

              {/* 配送先情報（配送希望時） */}
              {claim.recipientName && (
                <div className="rounded-lg bg-white/5 px-3 py-2 text-xs text-white/70 space-y-0.5">
                  <p><span className="text-white/40">氏名:</span> {claim.recipientName}</p>
                  <p><span className="text-white/40">〒:</span> {claim.postalCode}</p>
                  <p><span className="text-white/40">住所:</span> {claim.address}</p>
                  <p><span className="text-white/40">TEL:</span> {claim.phone}</p>
                </div>
              )}

              {/* 管理者操作フォーム */}
              {claim.status !== 'converted' && (
                <form action={updatePrizeClaim} className="flex flex-col gap-2">
                  <input type="hidden" name="claim_id" value={claim.id} />
                  <input type="hidden" name="current_filter" value={statusFilter} />
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-white/40">ステータス</label>
                      <select
                        name="status"
                        defaultValue={claim.status}
                        className="rounded-lg bg-white/10 border border-white/10 px-2 py-1.5 text-xs text-white focus:outline-none focus:border-yellow-400/50"
                      >
                        <option value="pending" className="bg-zinc-900">選択待ち</option>
                        <option value="delivery_requested" className="bg-zinc-900">配送希望</option>
                        <option value="shipped" className="bg-zinc-900">発送済み</option>
                        <option value="delivered" className="bg-zinc-900">配達完了</option>
                        <option value="code_sent" className="bg-zinc-900">コード送付済み</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-white/40">追跡番号</label>
                      <input
                        name="tracking_number"
                        defaultValue={claim.trackingNumber ?? ''}
                        placeholder="任意"
                        className="rounded-lg bg-white/10 border border-white/10 px-2 py-1.5 text-xs text-white focus:outline-none focus:border-yellow-400/50"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-white/40">ギフトコード</label>
                      <input
                        name="gift_code"
                        defaultValue={claim.giftCode ?? ''}
                        placeholder="Amazonギフト券等"
                        className="rounded-lg bg-white/10 border border-white/10 px-2 py-1.5 text-xs text-white focus:outline-none focus:border-yellow-400/50"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-white/40">メモ</label>
                      <input
                        name="notes"
                        defaultValue={claim.notes ?? ''}
                        placeholder="任意"
                        className="rounded-lg bg-white/10 border border-white/10 px-2 py-1.5 text-xs text-white focus:outline-none focus:border-yellow-400/50"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="btn-gold px-4 py-1.5 rounded-lg text-xs font-bold self-start"
                  >
                    更新
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
