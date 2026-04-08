import { getServiceSupabase } from '@/lib/supabase/service';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export const PRIZE_TYPES = [
  { value: 'paypay',      label: '🟡 PayPay', color: 'text-yellow-400' },
  { value: 'amazon_gift', label: '🛒 Amazonギフト券', color: 'text-orange-400' },
  { value: 'delivery',    label: '📦 配達（物品）', color: 'text-blue-400' },
  { value: 'digital',     label: '💿 デジタルカード', color: 'text-purple-400' },
  { value: 'other',       label: '🎁 その他', color: 'text-gray-400' },
];

async function createPrize(formData: FormData) {
  'use server';
  const supabase = getServiceSupabase();
  const name        = formData.get('name') as string;
  const type        = formData.get('type') as string;
  const value       = formData.get('value') ? Number(formData.get('value')) : null;
  const description = formData.get('description') as string || null;
  const image_url   = formData.get('image_url') as string || null;

  await supabase.from('prizes').insert({ name, type, value, description, image_url });
  revalidatePath('/admin/prize-master');
  redirect('/admin/prize-master?saved=1');
}

async function deletePrize(formData: FormData) {
  'use server';
  const supabase = getServiceSupabase();
  const id = formData.get('id') as string;
  await supabase.from('prizes').delete().eq('id', id);
  revalidatePath('/admin/prize-master');
  redirect('/admin/prize-master');
}

export default async function AdminPrizeMasterPage({
  searchParams,
}: {
  searchParams?: Promise<{ saved?: string }>;
}) {
  const params = await searchParams;
  const supabase = getServiceSupabase();
  const { data: prizes } = await supabase
    .from('prizes')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-black text-white">景品マスタ管理</h1>

      {params?.saved && (
        <div className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3">
          <p className="text-sm font-semibold text-emerald-300">景品を追加しました</p>
        </div>
      )}

      {/* 追加フォーム */}
      <div className="card-premium p-5 flex flex-col gap-4">
        <h2 className="text-sm font-black text-white">景品を追加</h2>
        <form action={createPrize} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-white/60">景品名 *</label>
              <input
                name="name"
                required
                placeholder="PayPay 10,000円"
                className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-yellow-400/50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-white/60">種別 *</label>
              <select
                name="type"
                required
                className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400/50"
              >
                {PRIZE_TYPES.map((t) => (
                  <option key={t.value} value={t.value} className="bg-zinc-900">{t.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-white/60">金額（円）</label>
              <input
                name="value"
                type="number"
                placeholder="10000"
                className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-yellow-400/50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-white/60">画像URL（任意）</label>
              <input
                name="image_url"
                placeholder="https://..."
                className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-yellow-400/50"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-white/60">説明（任意）</label>
            <textarea
              name="description"
              rows={2}
              placeholder="当選後、PayPayにて送金いたします"
              className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-yellow-400/50 resize-none"
            />
          </div>
          <button type="submit" className="btn-gold px-6 py-2 rounded-xl text-sm font-bold self-start">
            追加する
          </button>
        </form>
      </div>

      {/* 景品一覧 */}
      <div className="card-premium overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="text-sm font-black text-white">登録済み景品一覧</h2>
        </div>
        {(prizes ?? []).length === 0 ? (
          <div className="px-5 py-8 text-center text-white/30 text-sm">まだ景品が登録されていません</div>
        ) : (
          <table className="w-full text-xs text-white/70">
            <thead>
              <tr className="border-b border-white/10 text-left text-white/50">
                <th className="px-4 py-3">景品名</th>
                <th className="px-4 py-3">種別</th>
                <th className="px-4 py-3">金額</th>
                <th className="px-4 py-3">説明</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {(prizes ?? []).map((p) => {
                const typeInfo = PRIZE_TYPES.find((t) => t.value === p.type);
                return (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3 font-bold text-white">{p.name}</td>
                    <td className={`px-4 py-3 font-bold ${typeInfo?.color ?? 'text-white/50'}`}>
                      {typeInfo?.label ?? p.type}
                    </td>
                    <td className="px-4 py-3">
                      {p.value ? `¥${p.value.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3 max-w-[200px] truncate text-white/40">
                      {p.description ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <form action={deletePrize}>
                        <input type="hidden" name="id" value={p.id} />
                        <button
                          type="submit"
                          className="px-2 py-1 rounded bg-red-900/40 hover:bg-red-900/60 text-red-400 text-xs transition-colors"
                        >
                          削除
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
