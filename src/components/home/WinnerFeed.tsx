import { getServiceSupabase } from '@/lib/supabase/service';
import { WinnerTicker, type WinnerItem } from './WinnerTicker';

function maskName(name: string): string {
  if (!name || name.length === 0) return '***';
  // 先頭1文字 + 残り文字数分の * (最大3つ)
  const stars = '*'.repeat(Math.min(name.length - 1, 3));
  return name[0] + stars;
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

  // 実際の当選結果のみを表示する（架空＝ダミー当選者は廃止）
  const { data } = await supabase
    .from('gacha_results')
    .select('id, played_at, app_users(display_name, line_display_name, email), gacha_products(title)')
    .eq('result', 'win')
    .order('played_at', { ascending: false })
    .limit(10);

  type UserRow = { display_name: string | null; line_display_name: string | null; email: string };
  type ProductRow = { title: string };

  const items: WinnerItem[] = (data ?? []).map((row) => {
    const uRaw = row.app_users as unknown;
    const u: UserRow | null = (Array.isArray(uRaw) ? uRaw[0] : uRaw) as UserRow | null;
    const pRaw = row.gacha_products as unknown;
    const product: ProductRow | null = (Array.isArray(pRaw) ? pRaw[0] : pRaw) as ProductRow | null;
    const rawName = u ? (u.line_display_name ?? u.display_name ?? u.email.split('@')[0]) : '???';
    return {
      id: row.id,
      maskedName: maskName(rawName),
      productTitle: product?.title ?? '???',
      timeAgo: timeAgo(row.played_at),
    };
  });

  // 実当選が無い場合はフィード自体を表示しない
  if (items.length === 0) return null;

  return (
    <section className="px-4 py-6">
      <div className="max-w-[860px] w-full mx-auto">
        <h2 className="headline-serif text-xl mb-4 flex items-center gap-2.5">
          <span
            className="inline-block h-2 w-2 rounded-full animate-pulse"
            style={{ background: '#38d2ff', boxShadow: '0 0 8px #38d2ff' }}
            aria-hidden="true"
          />
          リアルタイム当選
        </h2>
        <WinnerTicker items={items} />
      </div>
    </section>
  );
}
