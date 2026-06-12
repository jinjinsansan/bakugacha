import type { MetadataRoute } from 'next';
import { getPublicEnv } from '@/lib/env';
import { getServiceSupabase } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

const STATIC_PATHS = [
  '',
  '/how-to-play',
  '/faq',
  '/contact',
  '/terms',
  '/privacy',
  '/tradelaw',
  '/anti-social-policy',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getPublicEnv().NEXT_PUBLIC_SITE_URL;

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${base}${path}`,
    changeFrequency: path === '' ? 'daily' : 'monthly',
    priority: path === '' ? 1 : 0.5,
  }));

  // 公開中のガチャ商品ページ (DB 障害時は静的ページのみ返す)
  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const supabase = getServiceSupabase();
    const { data } = await supabase
      .from('gacha_products')
      .select('id')
      .eq('status', 'active');
    productEntries = (data ?? []).map((p) => ({
      url: `${base}/gacha/${p.id}`,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));
  } catch (err) {
    console.error('[sitemap] failed to load products:', err);
  }

  return [...staticEntries, ...productEntries];
}
