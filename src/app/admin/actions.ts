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
  if (!id) throw new Error('ID は必須です');

  const stockTotal    = formData.get('stock_total') ? Number(formData.get('stock_total'))    : null;
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

  const stockTotal    = formData.get('stock_total') ? Number(formData.get('stock_total'))    : null;
  const stockRemaining = formData.get('stock_remaining') ? Number(formData.get('stock_remaining')) : null;

  await supabase.from('gacha_products').update({
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
  }).eq('id', id);

  revalidatePath('/admin/products');
  redirect('/admin/products');
}

// ── 商品削除 ──────────────────────────────────────────────────
export async function deleteProduct(id: string) {
  await requireAdmin();
  const supabase = getServiceSupabase();
  await supabase.from('gacha_products').delete().eq('id', id);
  revalidatePath('/admin/products');
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
