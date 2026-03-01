'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServiceSupabase } from '@/lib/supabase/service';
import { requireAdmin } from '@/lib/auth/admin';
import { upsertCd2Settings } from '@/lib/data/cd2-gacha';

// ── 商品作成 ──────────────────────────────────────────────────
export async function createProduct(formData: FormData) {
  await requireAdmin();
  const supabase = getServiceSupabase();

  const id = String(formData.get('id') ?? '').trim();
  if (!id) redirect('/admin/products/new?error=' + encodeURIComponent('ID は必須です'));

  const stockTotalRaw = formData.get('stock_total');
  if (!stockTotalRaw || String(stockTotalRaw).trim() === '') redirect('/admin/products/new?error=' + encodeURIComponent('在庫総数は必須です'));
  const stockTotal = Number(stockTotalRaw);
  const stockRemaining = formData.get('stock_remaining') ? Number(formData.get('stock_remaining')) : stockTotal;

  await supabase.from('gacha_products').insert({
    id,
    title:               String(formData.get('title') ?? ''),
    category:            String(formData.get('category') ?? 'その他'),
    price:               Number(formData.get('price') ?? 0),
    description:         formData.get('description') ? String(formData.get('description')) : null,
    image_url:           formData.get('image_url') ? String(formData.get('image_url')) : null,
    thumbnail_emoji:     formData.get('thumbnail_emoji') ? String(formData.get('thumbnail_emoji')) : null,
    thumbnail_gradient:  formData.get('thumbnail_gradient') ? String(formData.get('thumbnail_gradient')) : null,
    thumbnail_label:     formData.get('thumbnail_label') ? String(formData.get('thumbnail_label')) : null,
    is_featured:         formData.get('is_featured') === 'on',
    stock_total:         stockTotal,
    stock_remaining:     stockRemaining,
    status:              String(formData.get('status') ?? 'active'),
    sort_order:          Number(formData.get('sort_order') ?? 0),
  });

  revalidatePath('/admin/products');
  redirect('/admin/products');
}

// ── 商品更新 ──────────────────────────────────────────────────
export async function updateProduct(id: string, formData: FormData) {
  await requireAdmin();
  const supabase = getServiceSupabase();

  const stockTotalRaw = formData.get('stock_total');
  if (!stockTotalRaw || String(stockTotalRaw).trim() === '') redirect(`/admin/products/${id}?error=` + encodeURIComponent('在庫総数は必須です'));
  const stockTotal = Number(stockTotalRaw);
  const stockRemaining = formData.get('stock_remaining') ? Number(formData.get('stock_remaining')) : null;

  const imageUrl = formData.get('image_url') ? String(formData.get('image_url')) : null;

  const { error: updateError } = await supabase.from('gacha_products').update({
    title:               String(formData.get('title') ?? ''),
    category:            String(formData.get('category') ?? 'その他'),
    price:               Number(formData.get('price') ?? 0),
    description:         formData.get('description') ? String(formData.get('description')) : null,
    image_url:           imageUrl,
    thumbnail_emoji:     formData.get('thumbnail_emoji') ? String(formData.get('thumbnail_emoji')) : null,
    thumbnail_gradient:  formData.get('thumbnail_gradient') ? String(formData.get('thumbnail_gradient')) : null,
    thumbnail_label:     formData.get('thumbnail_label') ? String(formData.get('thumbnail_label')) : null,
    is_featured:         formData.get('is_featured') === 'on',
    stock_total:         stockTotal,
    stock_remaining:     stockRemaining,
    status:              String(formData.get('status') ?? 'active'),
    sort_order:          Number(formData.get('sort_order') ?? 0),
  }).eq('id', id);

  if (updateError) console.error('[updateProduct]', updateError);

  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${id}`);
  redirect('/admin/products');
}

// ── 商品削除 ──────────────────────────────────────────────────
export async function deleteProduct(id: string) {
  await requireAdmin();
  const supabase = getServiceSupabase();
  await supabase.from('gacha_products').delete().eq('id', id);
  revalidatePath('/admin/products');
}

// ── バナー作成 ──────────────────────────────────────────────────
export async function createBanner(formData: FormData) {
  await requireAdmin();
  const supabase = getServiceSupabase();

  await supabase.from('campaign_banners').insert({
    title:       String(formData.get('title') ?? ''),
    subtitle:    formData.get('subtitle') ? String(formData.get('subtitle')) : null,
    tag:         formData.get('tag') ? String(formData.get('tag')) : null,
    badge:       formData.get('badge') ? String(formData.get('badge')) : null,
    badge_color: String(formData.get('badge_color') ?? '#c9a84c'),
    image_url:   formData.get('image_url') ? String(formData.get('image_url')) : null,
    overlay:     formData.get('overlay') ? String(formData.get('overlay'))
      : 'linear-gradient(90deg, rgba(5,5,20,0.92) 0%, rgba(5,5,20,0.7) 50%, rgba(5,5,20,0.3) 100%)',
    link_url:    formData.get('link_url') ? String(formData.get('link_url')) : null,
    sort_order:  Number(formData.get('sort_order') ?? 0),
    is_active:   formData.get('is_active') === 'on',
  });

  revalidatePath('/admin/banners');
  redirect('/admin/banners');
}

// ── バナー更新 ──────────────────────────────────────────────────
export async function updateBanner(id: string, formData: FormData) {
  await requireAdmin();
  const supabase = getServiceSupabase();

  await supabase.from('campaign_banners').update({
    title:       String(formData.get('title') ?? ''),
    subtitle:    formData.get('subtitle') ? String(formData.get('subtitle')) : null,
    tag:         formData.get('tag') ? String(formData.get('tag')) : null,
    badge:       formData.get('badge') ? String(formData.get('badge')) : null,
    badge_color: String(formData.get('badge_color') ?? '#c9a84c'),
    image_url:   formData.get('image_url') ? String(formData.get('image_url')) : null,
    overlay:     formData.get('overlay') ? String(formData.get('overlay'))
      : 'linear-gradient(90deg, rgba(5,5,20,0.92) 0%, rgba(5,5,20,0.7) 50%, rgba(5,5,20,0.3) 100%)',
    link_url:    formData.get('link_url') ? String(formData.get('link_url')) : null,
    sort_order:  Number(formData.get('sort_order') ?? 0),
    is_active:   formData.get('is_active') === 'on',
    updated_at:  new Date().toISOString(),
  }).eq('id', id);

  revalidatePath('/admin/banners');
  redirect('/admin/banners');
}

// ── バナー削除 ──────────────────────────────────────────────────
export async function deleteBanner(id: string) {
  await requireAdmin();
  const supabase = getServiceSupabase();
  await supabase.from('campaign_banners').delete().eq('id', id);
  revalidatePath('/admin/banners');
}

// ── CD2設定更新 ────────────────────────────────────────────────
export async function updateCd2Settings(formData: FormData) {
  await requireAdmin();
  const supabase = getServiceSupabase();

  try {
    await upsertCd2Settings(supabase, {
      isEnabled:   formData.get('is_enabled') === 'on',
      lossRate:    Number(formData.get('loss_rate')    ?? 60),
      dondenRate:  Number(formData.get('donden_rate')  ?? 10),
      patliteRate: Number(formData.get('patlite_rate') ?? 5),
      freezeRate:  Number(formData.get('freeze_rate')  ?? 2),
    });
  } catch (err) {
    console.error('[admin] updateCd2Settings failed:', err);
    redirect('/admin/settings?error=1');
  }

  revalidatePath('/admin/settings');
  redirect('/admin/settings?saved=1');
}
