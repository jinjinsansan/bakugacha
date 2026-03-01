import { getServiceSupabase } from '@/lib/supabase/service';

function maskName(name: string): string {
  if (name.length <= 1) return name + '***';
  if (name.length <= 3) return name[0] + '***';
  return name.slice(0, 2) + '***';
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'たった今';
  if (mins < 60) return `${mins}分前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  return `${days}日前`;
}

export async function WinnerFeed() {
  const supabase = getServiceSupabase();
  const { data } = await supabase
    .from('gacha_results')
    .select('id, played_at, app_users(display_name, email), gacha_products(title)')
    .eq('result', 'win')
    .order('played_at', { ascending: false })
    .limit(10);

  if (!data?.length) return null;

  return (
    <section className="px-4 py-6">
      <div className="max-w-[860px] w-full mx-auto">
        <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--gold)' }}>
          🏆 最近の当選者
        </h2>
        <div className="flex flex-col gap-2">
        {data.map((row) => {
          type UserRow = { display_name: string | null; email: string };
          type ProductRow = { title: string };
          const uRaw = row.app_users as unknown;
          const u: UserRow | null = (Array.isArray(uRaw) ? uRaw[0] : uRaw) as UserRow | null;
          const pRaw = row.gacha_products as unknown;
          const product: ProductRow | null = (Array.isArray(pRaw) ? pRaw[0] : pRaw) as ProductRow | null;
          const rawName = u ? (u.display_name ?? u.email.split('@')[0]) : '???';
          return (
            <div key={row.id} className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
              <span className="text-yellow-300 text-lg shrink-0">🏆</span>
              <div className="flex-1 min-w-0 text-sm">
                <span className="font-bold text-white">{maskName(rawName)}</span>
                <span className="text-white/50 text-xs mx-1">さんが</span>
                <span className="text-yellow-200 font-medium">{product?.title ?? '???'}</span>
                <span className="text-white/50 text-xs ml-1">に当選</span>
              </div>
              <span className="text-xs text-white/40 shrink-0">{timeAgo(row.played_at)}</span>
            </div>
          );
        })}
        </div>
      </div>
    </section>
  );
}
