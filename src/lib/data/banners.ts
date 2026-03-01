import type { SupabaseClient } from '@supabase/supabase-js';

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  tag: string | null;
  badge: string | null;
  badge_color: string;
  image_url: string | null;
  overlay: string;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** アクティブなバナーを取得（ホーム表示用） */
export async function fetchActiveBanners(client: SupabaseClient): Promise<Banner[]> {
  const { data } = await client
    .from('campaign_banners')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  return (data ?? []) as Banner[];
}

/** 全バナーを取得（管理画面用） */
export async function fetchAllBanners(client: SupabaseClient): Promise<Banner[]> {
  const { data } = await client
    .from('campaign_banners')
    .select('*')
    .order('sort_order', { ascending: true });
  return (data ?? []) as Banner[];
}

/** バナーをIDで取得 */
export async function fetchBannerById(client: SupabaseClient, id: string): Promise<Banner | null> {
  const { data } = await client
    .from('campaign_banners')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return (data as Banner) ?? null;
}
