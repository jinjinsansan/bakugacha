import { getServiceSupabase } from '@/lib/supabase/service';

export default async function AdminResultsPage() {
  const supabase = getServiceSupabase();
  const { data: results } = await supabase
    .from('gacha_results')
    .select('id, result, prize_name, coins_spent, played_at, app_users(email), gacha_products(title)')
    .order('played_at', { ascending: false })
    .limit(100);

  const wins   = (results ?? []).filter((r) => r.result === 'win').length;
  const losses = (results ?? []).filter((r) => r.result === 'loss').length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-black text-white">結果一覧（直近100件）</h1>
        <div className="flex gap-3 text-sm">
          <span className="text-yellow-300">🏆 当選 {wins}件</span>
          <span className="text-zinc-400">💀 ハズレ {losses}件</span>
          <span className="text-white/30">
            勝率 {results?.length ? ((wins / results.length) * 100).toFixed(1) : '0.0'}%
          </span>
        </div>
      </div>

      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-white/70">
            <thead>
              <tr className="border-b border-white/10 text-left text-white/50">
                <th className="px-3 py-3">結果</th>
                <th className="px-3 py-3">商品</th>
                <th className="px-3 py-3 hidden sm:table-cell">コスト</th>
                <th className="px-3 py-3">日時</th>
              </tr>
            </thead>
            <tbody>
              {(results ?? []).map((row) => {
                type ProductRow = { title: string };
                const pRaw = row.gacha_products as unknown;
                const p: ProductRow | null = (Array.isArray(pRaw) ? pRaw[0] : pRaw) as ProductRow | null;
                return (
                  <tr key={row.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-3 py-2.5">
                      <span className={row.result === 'win' ? 'text-yellow-300 font-bold' : 'text-zinc-500'}>
                        {row.result === 'win' ? '🏆 当選' : '💀 ハズレ'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="block truncate max-w-[130px] sm:max-w-[200px]">{p?.title ?? row.prize_name ?? '???'}</span>
                      <span className="sm:hidden text-white/30 text-[11px]">🪙 {(row.coins_spent as number).toLocaleString()}</span>
                    </td>
                    <td className="px-3 py-2.5 hidden sm:table-cell">🪙 {(row.coins_spent as number).toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-white/40 text-[11px]">
                      {new Date(row.played_at as string).toLocaleString('ja-JP', {
                        month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
