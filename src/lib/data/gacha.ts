import type { SupabaseClient } from '@supabase/supabase-js';
import type { Product } from '@/types/product';

// DB行 → Product型に変換
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToProduct(row: Record<string, any>): Product {
  // 在庫 0 以下なら安全網として sold-out 扱い (DBのstatusが古くても確実に表示)
  const stockTotal = row.stock_total as number | null | undefined;
  const stockRemaining = row.stock_remaining as number | null | undefined;
  const isZeroStock = stockTotal != null && (stockTotal <= 0 || (stockRemaining != null && stockRemaining <= 0));
  const effectiveStatus: 'active' | 'sold-out' = isZeroStock ? 'sold-out' : (row.status as 'active' | 'sold-out');

  return {
    id: row.id,
    title: row.title,
    href: `/gacha/${row.id}`,
    imageSrc: row.image_url ?? '',
    imageSizes: '',
    price: row.price,
    stock: stockTotal != null
      ? {
          text: `残り${((stockRemaining ?? 0) as number).toLocaleString()}回 / ${stockTotal.toLocaleString()}回`,
          progressClass: buildProgressClass(stockRemaining ?? 0, stockTotal || 1),
        }
      : null,
    buttons: effectiveStatus === 'sold-out' ? null : buildButtons({
      single:  row.button_1 !== false,
      ten:     row.button_10 !== false,
      hundred: row.button_100 !== false,
    }),
    status: effectiveStatus,
    category: row.category,
    thumbnailGradient: row.thumbnail_gradient ?? undefined,
    thumbnailEmoji: row.thumbnail_emoji ?? undefined,
    thumbnailLabel: row.thumbnail_label ?? undefined,
  };
}

function buildButtons(
  flags: { single: boolean; ten: boolean; hundred: boolean },
): string[] | null {
  const labels: string[] = [];
  if (flags.single)  labels.push('1回ガチャ');
  if (flags.ten)     labels.push('10連ガチャ');
  if (flags.hundred) labels.push('100連ガチャ');
  return labels.length > 0 ? labels : null;
}

function buildProgressClass(remaining: number, total: number): string {
  const pct = Math.round((1 - remaining / total) * 100);
  const color = pct > 80 ? 'bg-yellow-600' : pct > 50 ? 'bg-yellow-500' : 'bg-green-500';
  return `${color} box-border caret-transparent basis-[0%] grow h-full translate-x-[-${pct}%] w-full`;
}

export async function fetchFeaturedProducts(client: SupabaseClient): Promise<Product[]> {
  const { data } = await client
    .from('gacha_products')
    .select('*')
    .eq('is_featured', true)
    .order('sort_order', { ascending: true });
  return (data ?? []).map(rowToProduct);
}

export async function fetchRegularProducts(client: SupabaseClient): Promise<Product[]> {
  const { data } = await client
    .from('gacha_products')
    .select('*')
    .eq('is_featured', false)
    .order('sort_order', { ascending: true });
  return (data ?? []).map(rowToProduct);
}

export async function fetchProductById(
  client: SupabaseClient,
  id: string,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<Record<string, any> | null> {
  const { data } = await client
    .from('gacha_products')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return data ?? null;
}
