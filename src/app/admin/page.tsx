import Link from 'next/link';
import { getServiceSupabase } from '@/lib/supabase/service';

type WindowStat = {
  plays: number;
  wins: number;
  new_users: number;
  coins_granted: number;
  coins_spent: number;
};

type DashboardStats = {
  total_users: number;
  total_plays: number;
  total_wins: number;
  total_coins: number;
  pending_claims: number;
  windows: { d1: WindowStat; d7: WindowStat; d30: WindowStat };
};

const EMPTY_WINDOW: WindowStat = { plays: 0, wins: 0, new_users: 0, coins_granted: 0, coins_spent: 0 };

/**
 * 集計 RPC(admin_dashboard_stats / migration 041)を呼ぶ。
 * RPC が未適用の環境では基本集計のみのフォールバックに切り替える(画面は壊さない)。
 */
async function fetchDashboard(): Promise<{ stats: DashboardStats; degraded: boolean }> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase.rpc('admin_dashboard_stats');

  if (!error && data) {
    return { stats: data as DashboardStats, degraded: false };
  }

  // ── フォールバック(migration 041 未適用時) ──
  const [users, plays, wins, coins, pending] = await Promise.all([
    supabase.from('app_users').select('id', { count: 'exact', head: true }),
    supabase.from('gacha_results').select('id', { count: 'exact', head: true }),
    supabase.from('gacha_results').select('id', { count: 'exact', head: true }).eq('result', 'win'),
    supabase.from('app_users').select('coins'),
    supabase.from('prize_claims').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);
  const totalCoins = (coins.data ?? []).reduce((s, u) => s + ((u.coins as number) ?? 0), 0);

  return {
    degraded: true,
    stats: {
      total_users: users.count ?? 0,
      total_plays: plays.count ?? 0,
      total_wins: wins.count ?? 0,
      total_coins: totalCoins,
      pending_claims: pending.count ?? 0,
      windows: { d1: EMPTY_WINDOW, d7: EMPTY_WINDOW, d30: EMPTY_WINDOW },
    },
  };
}

function winRate(w: WindowStat): string {
  if (w.plays === 0) return '—';
  return `${((w.wins / w.plays) * 100).toFixed(1)}%`;
}

export default async function AdminDashboard() {
  const { stats, degraded } = await fetchDashboard();

  const periods: { key: keyof DashboardStats['windows']; label: string }[] = [
    { key: 'd1', label: '直近24時間' },
    { key: 'd7', label: '直近7日' },
    { key: 'd30', label: '直近30日' },
  ];

  const STAT_CARDS = [
    { label: '総ユーザー数', value: stats.total_users.toLocaleString(), icon: '👤' },
    { label: '総プレイ数', value: stats.total_plays.toLocaleString(), icon: '🎰' },
    { label: '総当選数', value: stats.total_wins.toLocaleString(), icon: '🏆' },
    { label: '流通コイン総計', value: `🪙 ${stats.total_coins.toLocaleString()}`, icon: '🪙' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-black text-white">ダッシュボード</h1>

      {degraded && (
        <div className="rounded-xl px-4 py-3 text-xs text-amber-300"
          style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)' }}>
          ⚠️ 期間別の詳細指標は migration 041 (admin_dashboard_stats) を本番DBに適用すると表示されます。現在は累計のみ表示しています。
        </div>
      )}

      {/* 未発送アラート(運用で最重要) */}
      <Link
        href="/admin/prizes"
        className="card-premium p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
        style={stats.pending_claims > 0 ? { border: '1px solid rgba(248,113,113,0.4)' } : undefined}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">📦</span>
          <div>
            <p className="text-xs text-white/50">未対応の当選品</p>
            <p className="text-2xl font-black" style={{ color: stats.pending_claims > 0 ? '#fca5a5' : '#fff' }}>
              {stats.pending_claims.toLocaleString()} 件
            </p>
          </div>
        </div>
        <span className="text-xs text-white/40">当選品管理へ →</span>
      </Link>

      {/* 累計カード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STAT_CARDS.map(({ label, value, icon }) => (
          <div key={label} className="card-premium p-4 flex flex-col gap-1">
            <span className="text-2xl">{icon}</span>
            <p className="text-xs text-white/50">{label}</p>
            <p className="text-xl font-black text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* 期間別KPI */}
      <div className="card-premium p-4">
        <h2 className="text-sm font-bold text-white/70 mb-3">期間別サマリー</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-white/70">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="pb-2 pr-4">期間</th>
                <th className="pb-2 pr-4 text-right">プレイ</th>
                <th className="pb-2 pr-4 text-right">当選</th>
                <th className="pb-2 pr-4 text-right">勝率</th>
                <th className="pb-2 pr-4 text-right">新規ユーザー</th>
                <th className="pb-2 pr-4 text-right">コイン発行</th>
                <th className="pb-2 text-right">コイン消費</th>
              </tr>
            </thead>
            <tbody>
              {periods.map(({ key, label }) => {
                const w = stats.windows[key] ?? EMPTY_WINDOW;
                return (
                  <tr key={key} className="border-b border-white/5">
                    <td className="py-2 pr-4 font-bold text-white/80">{label}</td>
                    <td className="py-2 pr-4 text-right">{w.plays.toLocaleString()}</td>
                    <td className="py-2 pr-4 text-right text-yellow-300">{w.wins.toLocaleString()}</td>
                    <td className="py-2 pr-4 text-right">{winRate(w)}</td>
                    <td className="py-2 pr-4 text-right">{w.new_users.toLocaleString()}</td>
                    <td className="py-2 pr-4 text-right text-green-400">+{w.coins_granted.toLocaleString()}</td>
                    <td className="py-2 text-right text-red-400">-{w.coins_spent.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-white/30 mt-2">
          ※ コイン発行=ボーナス/プロモ/ログイン/紹介等の付与合計、コイン消費=ガチャ消費合計（直近期間・ローリング集計）
        </p>
      </div>

      {/* 詳細な結果一覧へ */}
      <Link href="/admin/results" className="text-xs text-white/40 hover:text-white/70 transition-colors">
        プレイ結果の一覧を見る →
      </Link>
    </div>
  );
}
