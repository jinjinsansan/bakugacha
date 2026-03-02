import { getServiceSupabase } from '@/lib/supabase/service';
import { fetchAppSettings } from '@/lib/data/app-settings';
import { WinnerTicker, type WinnerItem } from './WinnerTicker';

function maskName(name: string): string {
  if (!name || name.length === 0) return '***';
  // Show first character + ** (safe for LINE display names)
  return name[0] + '**';
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

// Dummy names and products for placeholder mode
const DUMMY_NAMES = [
  'ゆ**', 'た**', 'さ**', 'み**', 'け**',
  'あ**', 'は**', 'り**', 'な**', 'こ**',
  'ま**', 'し**', 'か**', 'と**', 'や**',
];

const DUMMY_PRODUCTS = [
  'ポケモンカード 151 BOX', 'ワンピースカード ブースターBOX',
  '遊戯王 レアリティコレクション', 'ポケモン バイオレットex BOX',
  'ワンピース 新時代の主役 BOX', 'ポケモン スカーレットex BOX',
  '遊戯王 エイジオブオーバーロード', 'ポケモン 黒炎の支配者 BOX',
];

function generateDummyItems(count: number): WinnerItem[] {
  const items: WinnerItem[] = [];
  for (let i = 0; i < count; i++) {
    const minsAgo = Math.floor(Math.random() * 180) + 1; // 1-180 min ago
    items.push({
      id: `dummy-${i}`,
      maskedName: DUMMY_NAMES[i % DUMMY_NAMES.length],
      productTitle: DUMMY_PRODUCTS[i % DUMMY_PRODUCTS.length],
      timeAgo: minsAgo < 60 ? `${minsAgo}分前` : `${Math.floor(minsAgo / 60)}時間前`,
    });
  }
  return items;
}

export async function WinnerFeed() {
  const supabase = getServiceSupabase();

  const [{ data }, appSettings] = await Promise.all([
    supabase
      .from('gacha_results')
      .select('id, played_at, app_users(display_name, email), gacha_products(title)')
      .eq('result', 'win')
      .order('played_at', { ascending: false })
      .limit(10),
    fetchAppSettings(supabase),
  ]);

  type UserRow = { display_name: string | null; email: string };
  type ProductRow = { title: string };

  const realItems: WinnerItem[] = (data ?? []).map((row) => {
    const uRaw = row.app_users as unknown;
    const u: UserRow | null = (Array.isArray(uRaw) ? uRaw[0] : uRaw) as UserRow | null;
    const pRaw = row.gacha_products as unknown;
    const product: ProductRow | null = (Array.isArray(pRaw) ? pRaw[0] : pRaw) as ProductRow | null;
    const rawName = u ? (u.display_name ?? u.email.split('@')[0]) : '???';
    return {
      id: row.id,
      maskedName: maskName(rawName),
      productTitle: product?.title ?? '???',
      timeAgo: timeAgo(row.played_at),
    };
  });

  // If dummy mode enabled and real winners are few, fill with dummy data
  let items = realItems;
  if (appSettings.winnerDummyEnabled && realItems.length < 10) {
    const dummyCount = 10 - realItems.length;
    const dummies = generateDummyItems(dummyCount);
    items = [...realItems, ...dummies];
  }

  if (items.length === 0) return null;

  return (
    <section className="px-4 py-6">
      <div className="max-w-[860px] w-full mx-auto">
        <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--gold)' }}>
          &#127942; 最近の当選者
        </h2>
        <WinnerTicker items={items} />
      </div>
    </section>
  );
}
