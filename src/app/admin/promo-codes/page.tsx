import { getServiceSupabase } from '@/lib/supabase/service';
import { createPromoCode } from '@/app/admin/actions';
import { PromoCodeRow } from './PromoCodeRow';

interface PromoCodeRowData {
  id: string;
  code: string;
  coin_amount: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  description: string | null;
  created_at: string;
}

export default async function AdminPromoCodesPage({
  searchParams,
}: {
  searchParams?: Promise<{ saved?: string; error?: string }>;
}) {
  const params = await searchParams;
  const supabase = getServiceSupabase();

  const { data } = await supabase
    .from('promo_codes')
    .select('*')
    .order('created_at', { ascending: false });

  const codes: PromoCodeRowData[] = (data ?? []) as PromoCodeRowData[];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-black text-white">🎫 プロモコード管理</h1>

      {params?.saved && (
        <div className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3">
          <p className="text-sm font-semibold text-emerald-300">✅ 保存しました</p>
        </div>
      )}
      {params?.error && (
        <div className="rounded-xl border border-red-400/40 bg-red-400/10 px-4 py-3">
          <p className="text-sm font-semibold text-red-300">❌ {params.error}</p>
        </div>
      )}

      {/* 新規作成フォーム */}
      <div className="card-premium p-6">
        <h2 className="text-sm font-black text-white mb-4">新規コード作成</h2>
        <form action={createPromoCode} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-white/60">
                コード <span className="text-red-400">*</span>
              </label>
              <input
                name="code"
                type="text"
                required
                placeholder="例: WELCOME2026"
                maxLength={40}
                className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm text-white uppercase tracking-wider placeholder-white/30 focus:outline-none focus:border-violet-400/50"
                style={{ textTransform: 'uppercase' }}
              />
              <p className="text-[10px] text-white/40">半角英数字推奨 (自動で大文字化)</p>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-white/60">
                付与コイン数 <span className="text-red-400">*</span>
              </label>
              <input
                name="coin_amount"
                type="number"
                required
                min={1}
                placeholder="例: 500"
                className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-400/50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-white/60">全体利用上限 (空欄=無制限)</label>
              <input
                name="max_uses"
                type="number"
                min={1}
                placeholder="例: 100"
                className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-400/50"
              />
              <p className="text-[10px] text-white/40">最大何人に付与するか</p>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-white/60">有効期限 (空欄=無期限)</label>
              <input
                name="expires_at"
                type="datetime-local"
                className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-400/50"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-white/60">説明 (任意・管理用メモ)</label>
            <input
              name="description"
              type="text"
              maxLength={120}
              placeholder="例: 新規登録キャンペーン用"
              className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-400/50"
            />
          </div>
          <button
            type="submit"
            className="self-start px-6 py-2 rounded-xl text-sm font-black text-white"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
              boxShadow: '0 2px 8px rgba(124,58,237,0.35)',
            }}
          >
            コードを作成
          </button>
        </form>
      </div>

      {/* コード一覧 */}
      <div className="card-premium p-6">
        <h2 className="text-sm font-black text-white mb-4">コード一覧 ({codes.length})</h2>
        {codes.length === 0 ? (
          <p className="text-sm text-white/40 text-center py-8">
            まだコードが作成されていません
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10 text-white/50">
                  <th className="text-left py-2 px-2 font-bold">コード</th>
                  <th className="text-right py-2 px-2 font-bold">コイン</th>
                  <th className="text-right py-2 px-2 font-bold">使用/上限</th>
                  <th className="text-left py-2 px-2 font-bold">有効期限</th>
                  <th className="text-left py-2 px-2 font-bold">説明</th>
                  <th className="text-center py-2 px-2 font-bold">状態</th>
                  <th className="text-center py-2 px-2 font-bold">操作</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((c) => (
                  <PromoCodeRow key={c.id} code={c} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
