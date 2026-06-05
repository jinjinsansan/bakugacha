import Link from 'next/link';
import { getServiceSupabase } from '@/lib/supabase/service';

const PER_PAGE = 50;

const PERIODS = [
  { key: '24h', label: '24時間' },
  { key: '7d', label: '7日' },
  { key: '30d', label: '30日' },
  { key: 'all', label: '全期間' },
] as const;

type ProductSummary = { product_id: string; title: string; plays: number; wins: number; coins_spent: number };
type ResultsSummary = { total_plays: number; total_wins: number; total_coins_spent: number; by_product: ProductSummary[] };

function sinceFor(period: string): string | null {
  const now = Date.now();
  switch (period) {
    case '24h': return new Date(now - 24 * 60 * 60 * 1000).toISOString();
    case '7d': return new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    case '30d': return new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    default: return null; // all
  }
}

function rate(wins: number, plays: number): string {
  return plays > 0 ? `${((wins / plays) * 100).toFixed(1)}%` : '—';
}

export default async function AdminResultsPage({
  searchParams,
}: {
  searchParams?: Promise<{ period?: string; page?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const period = PERIODS.some((p) => p.key === sp.period) ? (sp.period as string) : '7d';
  const page = Math.max(0, Number(sp.page ?? 0) || 0);
  const since = sinceFor(period);

  const supabase = getServiceSupabase();

  // ── サマリー(RPC、未適用時はフォールバック) ──
  let summary: ResultsSummary | null = null;
  let degraded = false;
  const { data: summaryData, error: summaryError } = await supabase.rpc('admin_results_summary', { p_since: since });
  if (!summaryError && summaryData) {
    summary = summaryData as ResultsSummary;
  } else {
    degraded = true;
    const base = supabase.from('gacha_results').select('id', { count: 'exact', head: true });
    const [plays, wins] = await Promise.all([
      since ? base.gte('played_at', since) : base,
      (since
        ? supabase.from('gacha_results').select('id', { count: 'exact', head: true }).eq('result', 'win').gte('played_at', since)
        : supabase.from('gacha_results').select('id', { count: 'exact', head: true }).eq('result', 'win')),
    ]);
    summary = { total_plays: plays.count ?? 0, total_wins: wins.count ?? 0, total_coins_spent: 0, by_product: [] };
  }

  // ── 明細(ページング) ──
  let listQuery = supabase
    .from('gacha_results')
    .select('id, result, prize_name, coins_spent, played_at, gacha_products(title)', { count: 'exact' })
    .order('played_at', { ascending: false });
  if (since) listQuery = listQuery.gte('played_at', since);
  const { data: rows, count: listCount } = await listQuery.range(page * PER_PAGE, page * PER_PAGE + PER_PAGE - 1);

  const totalPages = Math.max(1, Math.ceil((listCount ?? 0) / PER_PAGE));
  const currentPeriodLabel = PERIODS.find((p) => p.key === period)?.label ?? '';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-black text-white">結果一覧・分析</h1>
        <a
          href={`/api/admin/results/export?period=${period}`}
          className="btn-outline px-4 py-2 rounded-xl text-xs font-bold"
        >
          ⬇ CSVエクスポート
        </a>
      </div>

      {/* 期間セレクタ */}
      <div className="flex gap-2 flex-wrap">
        {PERIODS.map((p) => (
          <Link
            key={p.key}
            href={`/admin/results?period=${p.key}`}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${
              period === p.key ? 'border-yellow-400 text-yellow-300 bg-yellow-400/10' : 'border-white/10 text-white/50 bg-white/5'
            }`}
          >
            {p.label}
          </Link>
        ))}
      </div>

      {degraded && (
        <div className="rounded-xl px-4 py-3 text-xs text-amber-300"
          style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)' }}>
          ⚠️ 商品別内訳とコイン消費は migration 043 (admin_results_summary) を本番DBに適用すると表示されます。
        </div>
      )}

      {/* 期間サマリー */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card-premium p-4"><p className="text-xs text-white/50">プレイ数（{currentPeriodLabel}）</p><p className="text-2xl font-black text-white">{summary!.total_plays.toLocaleString()}</p></div>
        <div className="card-premium p-4"><p className="text-xs text-white/50">当選数</p><p className="text-2xl font-black text-yellow-300">{summary!.total_wins.toLocaleString()}</p></div>
        <div className="card-premium p-4"><p className="text-xs text-white/50">勝率</p><p className="text-2xl font-black text-white">{rate(summary!.total_wins, summary!.total_plays)}</p></div>
        <div className="card-premium p-4"><p className="text-xs text-white/50">コイン消費</p><p className="text-2xl font-black text-white">🪙 {summary!.total_coins_spent.toLocaleString()}</p></div>
      </div>

      {/* 商品別内訳 */}
      {summary!.by_product.length > 0 && (
        <div className="card-premium p-4">
          <h2 className="text-sm font-bold text-white/70 mb-3">商品別内訳（{currentPeriodLabel}）</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-white/70">
              <thead>
                <tr className="border-b border-white/10 text-left text-white/50">
                  <th className="px-3 py-2">商品</th>
                  <th className="px-3 py-2 text-right">プレイ</th>
                  <th className="px-3 py-2 text-right">当選</th>
                  <th className="px-3 py-2 text-right">勝率</th>
                  <th className="px-3 py-2 text-right">コイン消費</th>
                </tr>
              </thead>
              <tbody>
                {summary!.by_product.map((p) => (
                  <tr key={p.product_id} className="border-b border-white/5">
                    <td className="px-3 py-2 truncate max-w-[200px]">{p.title}</td>
                    <td className="px-3 py-2 text-right">{p.plays.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right text-yellow-300">{p.wins.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">{rate(p.wins, p.plays)}</td>
                    <td className="px-3 py-2 text-right">🪙 {p.coins_spent.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 明細 */}
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
              {(rows ?? []).map((row) => {
                type ProductRow = { title: string };
                const pRaw = row.gacha_products as unknown;
                const p: ProductRow | null = (Array.isArray(pRaw) ? pRaw[0] : pRaw) as ProductRow | null;
                return (
                  <tr key={row.id as string} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-3 py-2.5">
                      <span className={row.result === 'win' ? 'text-yellow-300 font-bold' : 'text-zinc-500'}>
                        {row.result === 'win' ? '🏆 当選' : '💀 ハズレ'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="block truncate max-w-[130px] sm:max-w-[200px]">{p?.title ?? (row.prize_name as string) ?? '???'}</span>
                      <span className="sm:hidden text-white/30 text-[11px]">🪙 {(row.coins_spent as number).toLocaleString()}</span>
                    </td>
                    <td className="px-3 py-2.5 hidden sm:table-cell">🪙 {(row.coins_spent as number).toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-white/40 text-[11px]">
                      {new Date(row.played_at as string).toLocaleString('ja-JP', {
                        month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ページング */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 text-xs">
          {page > 0 ? (
            <Link href={`/admin/results?period=${period}&page=${page - 1}`} className="btn-outline px-3 py-1.5 rounded-lg">← 前へ</Link>
          ) : <span className="px-3 py-1.5 text-white/20">← 前へ</span>}
          <span className="text-white/50">{page + 1} / {totalPages}</span>
          {page < totalPages - 1 ? (
            <Link href={`/admin/results?period=${period}&page=${page + 1}`} className="btn-outline px-3 py-1.5 rounded-lg">次へ →</Link>
          ) : <span className="px-3 py-1.5 text-white/20">次へ →</span>}
        </div>
      )}
    </div>
  );
}
