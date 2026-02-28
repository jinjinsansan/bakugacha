import { getServiceSupabase } from '@/lib/supabase/service';

async function fetchStats() {
  const supabase = getServiceSupabase();

  const [users, plays, wins, coins] = await Promise.all([
    supabase.from('app_users').select('id', { count: 'exact', head: true }),
    supabase.from('gacha_results').select('id', { count: 'exact', head: true }),
    supabase.from('gacha_results').select('id', { count: 'exact', head: true }).eq('result', 'win'),
    supabase.from('app_users').select('coins'),
  ]);

  const totalCoins = (coins.data ?? []).reduce((sum, u) => sum + ((u.coins as number) ?? 0), 0);

  return {
    userCount:  users.count  ?? 0,
    playCount:  plays.count  ?? 0,
    winCount:   wins.count   ?? 0,
    totalCoins,
  };
}

async function fetchRecentResults() {
  const supabase = getServiceSupabase();
  const { data } = await supabase
    .from('gacha_results')
    .select('id, result, prize_name, coins_spent, played_at, app_users(email), gacha_products(title)')
    .order('played_at', { ascending: false })
    .limit(15);
  return data ?? [];
}

export default async function AdminDashboard() {
  const [stats, recentResults] = await Promise.all([fetchStats(), fetchRecentResults()]);

  const STAT_CARDS = [
    { label: '総ユーザー数',  value: stats.userCount.toLocaleString(),  icon: '👤' },
    { label: '総プレイ数',    value: stats.playCount.toLocaleString(),   icon: '🎰' },
    { label: '当選数',        value: stats.winCount.toLocaleString(),    icon: '🏆' },
    { label: '流通コイン総計', value: stats.totalCoins.toLocaleString(), icon: '🪙' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-black text-white">ダッシュボード</h1>

      {/* 統計カード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STAT_CARDS.map(({ label, value, icon }) => (
          <div key={label} className="card-premium p-4 flex flex-col gap-1">
            <span className="text-2xl">{icon}</span>
            <p className="text-xs text-white/50">{label}</p>
            <p className="text-2xl font-black text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* 直近の結果 */}
      <div className="card-premium p-4">
        <h2 className="text-sm font-bold text-white/70 mb-3">直近のプレイ結果</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-white/70">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="pb-2 pr-4">結果</th>
                <th className="pb-2 pr-4">商品</th>
                <th className="pb-2 pr-4">ユーザー</th>
                <th className="pb-2 pr-4">コスト</th>
                <th className="pb-2">日時</th>
              </tr>
            </thead>
            <tbody>
              {recentResults.map((row) => {
                type UserRow = { email: string };
                type ProductRow = { title: string };
                const uRaw = row.app_users as unknown;
                const u: UserRow | null = (Array.isArray(uRaw) ? uRaw[0] : uRaw) as UserRow | null;
                const pRaw = row.gacha_products as unknown;
                const p: ProductRow | null = (Array.isArray(pRaw) ? pRaw[0] : pRaw) as ProductRow | null;
                return (
                  <tr key={row.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-2 pr-4">
                      <span className={row.result === 'win' ? 'text-yellow-300 font-bold' : 'text-zinc-500'}>
                        {row.result === 'win' ? '当選' : 'ハズレ'}
                      </span>
                    </td>
                    <td className="py-2 pr-4 truncate max-w-[120px]">{p?.title ?? '???'}</td>
                    <td className="py-2 pr-4 truncate max-w-[120px]">{u?.email ?? '???'}</td>
                    <td className="py-2 pr-4">🪙 {(row.coins_spent as number).toLocaleString()}</td>
                    <td className="py-2 text-white/40">
                      {new Date(row.played_at as string).toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
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
