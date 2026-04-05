'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServiceSupabase } from '@/lib/supabase/service';
import { requireAdmin } from '@/lib/auth/admin';
import { upsertCd2Settings } from '@/lib/data/cd2-gacha';
import { upsertEcardSettings } from '@/lib/data/ecard-gacha';
import { upsertElevatorSettings } from '@/lib/data/elevator-gacha';
import { upsertKeibaSettings } from '@/lib/data/keiba-gacha';
import { upsertRaiseSettings } from '@/lib/data/raise-gacha';
import { upsertAppSettings } from '@/lib/data/app-settings';
import { upsertExchangeRates } from '@/lib/data/raise-cards';
import { updateClaimStatus } from '@/lib/data/prize-claims';

// ── 商品作成 ──────────────────────────────────────────────────
export async function createProduct(formData: FormData) {
  await requireAdmin();
  const supabase = getServiceSupabase();

  const id = String(formData.get('id') ?? '').trim();
  if (!id) redirect('/admin/products/new?error=' + encodeURIComponent('ID は必須です'));

  const stockTotalRaw = formData.get('stock_total');
  if (stockTotalRaw == null || String(stockTotalRaw).trim() === '') {
    redirect('/admin/products/new?error=' + encodeURIComponent('在庫総数は必須です (0 で終了ガチャ)'));
  }
  const stockTotal = Number(stockTotalRaw);
  const stockRemainingRaw = formData.get('stock_remaining');
  const stockRemaining = stockRemainingRaw != null && String(stockRemainingRaw).trim() !== ''
    ? Number(stockRemainingRaw)
    : stockTotal;

  // 在庫が 0 以下なら自動的に sold-out (終了ガチャ) 扱いにする
  const requestedStatus = String(formData.get('status') ?? 'active');
  const status = (stockTotal <= 0 || stockRemaining <= 0) ? 'sold-out' : requestedStatus;

  // 商品別当選率・当選上限 (空欄なら null)
  const winRateRaw = formData.get('win_rate_override');
  const winRateOverride = winRateRaw != null && String(winRateRaw).trim() !== ''
    ? Number(winRateRaw)
    : null;
  const maxWinnersRaw = formData.get('max_winners');
  const maxWinners = maxWinnersRaw != null && String(maxWinnersRaw).trim() !== ''
    ? Number(maxWinnersRaw)
    : null;

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
    status,
    sort_order:          Number(formData.get('sort_order') ?? 0),
    gacha_type:          String(formData.get('gacha_type') ?? 'cd2'),
    exchange_coins:      Number(formData.get('exchange_coins') ?? 0),
    win_rate_override:   winRateOverride,
    max_winners:         maxWinners,
    button_1:            formData.get('button_1') === 'on',
    button_10:           formData.get('button_10') === 'on',
    button_100:          formData.get('button_100') === 'on',
  });

  revalidatePath('/admin/products');
  revalidatePath('/');
  revalidatePath('/home');
  redirect('/admin/products');
}

// ── 商品更新 ──────────────────────────────────────────────────
export async function updateProduct(id: string, formData: FormData) {
  await requireAdmin();
  const supabase = getServiceSupabase();

  const stockTotalRaw = formData.get('stock_total');
  if (stockTotalRaw == null || String(stockTotalRaw).trim() === '') {
    redirect(`/admin/products/${id}?error=` + encodeURIComponent('在庫総数は必須です (0 で終了ガチャ)'));
  }
  const stockTotal = Number(stockTotalRaw);
  const stockRemainingRaw = formData.get('stock_remaining');
  const stockRemaining = stockRemainingRaw != null && String(stockRemainingRaw).trim() !== ''
    ? Number(stockRemainingRaw)
    : stockTotal;

  // 在庫が 0 以下なら自動的に sold-out (終了ガチャ) 扱いにする
  const requestedStatus = String(formData.get('status') ?? 'active');
  const status = (stockTotal <= 0 || stockRemaining <= 0) ? 'sold-out' : requestedStatus;

  const imageUrl = formData.get('image_url') ? String(formData.get('image_url')) : null;

  // 商品別当選率・当選上限 (空欄なら null)
  const winRateRaw = formData.get('win_rate_override');
  const winRateOverride = winRateRaw != null && String(winRateRaw).trim() !== ''
    ? Number(winRateRaw)
    : null;
  const maxWinnersRaw = formData.get('max_winners');
  const maxWinners = maxWinnersRaw != null && String(maxWinnersRaw).trim() !== ''
    ? Number(maxWinnersRaw)
    : null;

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
    status,
    sort_order:          Number(formData.get('sort_order') ?? 0),
    gacha_type:          String(formData.get('gacha_type') ?? 'cd2'),
    exchange_coins:      Number(formData.get('exchange_coins') ?? 0),
    win_rate_override:   winRateOverride,
    max_winners:         maxWinners,
    button_1:            formData.get('button_1') === 'on',
    button_10:           formData.get('button_10') === 'on',
    button_100:          formData.get('button_100') === 'on',
  }).eq('id', id);

  if (updateError) console.error('[updateProduct]', updateError);

  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${id}`);
  revalidatePath('/');
  revalidatePath('/home');
  revalidatePath(`/gacha/${id}`);
  redirect('/admin/products');
}

// ── 商品削除 ──────────────────────────────────────────────────
// 依存関係 (FK) は以下の通りで、順番に削除しないと FK 制約エラーになる:
//   deliveries.gacha_result_id     → gacha_results(id)
//   prize_claims.gacha_result_id   → gacha_results(id)
//   prize_claims.product_id        → gacha_products(id)
//   gacha_results.product_id       → gacha_products(id)
//   keiba_cards / raise_cards      → gacha_results(id)  ※ ON DELETE SET NULL (015)
export async function deleteProduct(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const supabase = getServiceSupabase();

  // 1) この商品に紐づく gacha_results の id を取得
  const { data: results, error: fetchError } = await supabase
    .from('gacha_results')
    .select('id')
    .eq('product_id', id);
  if (fetchError) {
    console.error('[deleteProduct] gacha_results 取得失敗:', fetchError);
    return { ok: false, error: `関連データ取得に失敗: ${fetchError.message}` };
  }
  const resultIds = (results ?? []).map((r) => r.id as string);

  if (resultIds.length > 0) {
    // 2) deliveries を先に削除 (gacha_results を参照)
    const { error: delivError } = await supabase
      .from('deliveries')
      .delete()
      .in('gacha_result_id', resultIds);
    if (delivError) {
      console.error('[deleteProduct] deliveries 削除失敗:', delivError);
      return { ok: false, error: `配送データの削除に失敗: ${delivError.message}` };
    }

    // 3) prize_claims を gacha_result_id 経由で削除
    const { error: claimByResultError } = await supabase
      .from('prize_claims')
      .delete()
      .in('gacha_result_id', resultIds);
    if (claimByResultError) {
      console.error('[deleteProduct] prize_claims (by result) 削除失敗:', claimByResultError);
      return { ok: false, error: `当選品データの削除に失敗: ${claimByResultError.message}` };
    }
  }

  // 4) prize_claims を product_id 経由でも念のため削除 (孤立レコード対策)
  const { error: claimByProductError } = await supabase
    .from('prize_claims')
    .delete()
    .eq('product_id', id);
  if (claimByProductError) {
    console.error('[deleteProduct] prize_claims (by product) 削除失敗:', claimByProductError);
    return { ok: false, error: `当選品データの削除に失敗: ${claimByProductError.message}` };
  }

  // 5) gacha_results を削除
  const { error: fkError } = await supabase
    .from('gacha_results')
    .delete()
    .eq('product_id', id);
  if (fkError) {
    console.error('[deleteProduct] gacha_results 削除失敗:', fkError);
    return { ok: false, error: `関連データの削除に失敗: ${fkError.message}` };
  }

  // 6) gacha_products 本体を削除
  const { error } = await supabase.from('gacha_products').delete().eq('id', id);
  if (error) {
    console.error('[deleteProduct]', error);
    return { ok: false, error: `削除に失敗: ${error.message}` };
  }

  revalidatePath('/admin/products');
  return { ok: true };
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
    overlay:     formData.get('overlay') ? String(formData.get('overlay')) : null,
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

// ── ecard設定更新 ────────────────────────────────────────────────
export async function updateEcardSettings(formData: FormData) {
  await requireAdmin();
  const supabase = getServiceSupabase();

  try {
    await upsertEcardSettings(supabase, {
      isActive:   formData.get('is_active') === 'on',
      winRate:    Number(formData.get('win_rate')    ?? 40),
      axisARate:  Number(formData.get('axis_a_rate') ?? 20),
      axisBRate:  Number(formData.get('axis_b_rate') ?? 30),
      axisCRate:  Number(formData.get('axis_c_rate') ?? 15),
      axisDRate:  Number(formData.get('axis_d_rate') ?? 20),
      axisERate:  Number(formData.get('axis_e_rate') ?? 15),
      dontenRate: Number(formData.get('donten_rate') ?? 15),
      star5Rate:  Number(formData.get('star5_rate')  ?? 70),
      star4Rate:  Number(formData.get('star4_rate')  ?? 60),
    });
  } catch (err) {
    console.error('[admin] updateEcardSettings failed:', err);
    redirect('/admin/settings?error=1');
  }

  revalidatePath('/admin/settings');
  redirect('/admin/settings?saved=1');
}

// ── エレベーターガチャ設定更新 ────────────────────────────────────
export async function updateElevatorSettings(formData: FormData) {
  await requireAdmin();
  const supabase = getServiceSupabase();

  try {
    await upsertElevatorSettings(supabase, {
      isActive:           formData.get('is_active') === 'on',
      winRate:            Number(formData.get('win_rate')             ?? 20),
      chainLoseThreshold: Number(formData.get('chain_lose_threshold') ?? 3),
    });
  } catch (err) {
    console.error('[admin] updateElevatorSettings failed:', err);
    redirect('/admin/settings?error=1');
  }

  revalidatePath('/admin/settings');
  redirect('/admin/settings?saved=1');
}

// ── 競馬ガチャ設定更新 ────────────────────────────────────────
export async function updateKeibaSettings(formData: FormData) {
  await requireAdmin();
  const supabase = getServiceSupabase();

  try {
    // コース別当たり率を個別フィールドからJSONに組み立て
    const courseWinRates: Record<string, number> = {};
    for (const cid of ['01', '02', '03', '04', '05', '06', '07']) {
      const v = formData.get(`course_win_${cid}`);
      if (v != null) courseWinRates[cid] = Number(v);
    }

    // キャラ別出現ウェイト
    const charaIds = ['shirogane', 'darkbolt', 'aoikaze', 'honohime', 'fuwarin', 'bakugachahime', 'umaoyaji'];
    const charaRates: Record<string, number> = {};
    for (const cid of charaIds) {
      const v = formData.get(`chara_rate_${cid}`);
      if (v != null && String(v).trim() !== '') charaRates[cid] = Number(v);
    }

    // コース別出現ウェイト
    const courseIds = ['01', '02', '03', '04', '05', '06', '07'];
    const courseAppearanceRates: Record<string, number> = {};
    for (const cid of courseIds) {
      const v = formData.get(`course_appear_${cid}`);
      if (v != null && String(v).trim() !== '') courseAppearanceRates[cid] = Number(v);
    }

    // キャラ×コース補正
    const charaCourseBonuses: Record<string, Record<string, number>> = {};
    for (const charaId of charaIds) {
      const bonuses: Record<string, number> = {};
      for (const courseId of courseIds) {
        const v = formData.get(`bonus_${charaId}_${courseId}`);
        if (v != null && String(v).trim() !== '' && Number(v) !== 0) bonuses[courseId] = Number(v);
      }
      const wv = formData.get(`bonus_${charaId}_wildcard`);
      if (wv != null && String(wv).trim() !== '' && Number(wv) !== 0) bonuses['*'] = Number(wv);
      if (Object.keys(bonuses).length > 0) charaCourseBonuses[charaId] = bonuses;
    }

    // どんでんパターン個別ウェイト
    const dontenPatternWeights: Record<string, number> = {};
    for (const key of formData.keys()) {
      if (key.startsWith('pattern_weight_')) {
        const patternId = key.replace('pattern_weight_', '');
        const v = formData.get(key);
        if (v != null && String(v).trim() !== '') dontenPatternWeights[patternId] = Number(v);
      }
    }

    await upsertKeibaSettings(supabase, {
      isActive:             formData.get('is_active') === 'on',
      courseWinRates,
      courseAppearanceRates,
      charaRates,
      charaCourseBonuses,
      starHonestRate:       Number(formData.get('star_honest_rate') ?? 60),
      umaoyajiWinRate:      Number(formData.get('umaoyaji_win_rate')     ?? 95),
      bakugachahimeWinRate: Number(formData.get('bakugachahime_win_rate') ?? 90),
      fuwarinWinRate:       Number(formData.get('fuwarin_win_rate')       ?? 20),
      chainLoseThreshold:   Number(formData.get('chain_lose_threshold')   ?? 5),
      dontenRate:           Math.round(Number(formData.get('donten_rate')        ?? 20)),
      dontenUpRate:         Math.round(Number(formData.get('donten_up_rate')     ?? 70)),
      dontenDownRate:       Math.round(Number(formData.get('donten_down_rate')   ?? 20)),
      dontenComedyRate:     Math.round(Number(formData.get('donten_comedy_rate') ?? 10)),
      dontenPatternWeights,
    });
  } catch (err) {
    console.error('[admin] updateKeibaSettings failed:', err);
    redirect('/admin/settings?error=1');
  }

  revalidatePath('/admin/settings');
  redirect('/admin/settings?saved=1');
}

// ── 競馬ガチャ カード発行設定更新 ──────────────────────────────
export async function updateKeibaCardSettings(formData: FormData) {
  await requireAdmin();
  const supabase = getServiceSupabase();

  try {
    const charaIds = ['shirogane', 'darkbolt', 'aoikaze', 'honohime', 'fuwarin', 'bakugachahime', 'umaoyaji'];
    const cardMaxIssuance: Record<string, number> = {};
    for (const cid of charaIds) {
      const v = formData.get(`card_max_${cid}`);
      if (v != null) cardMaxIssuance[cid] = Number(v);
    }

    await upsertKeibaSettings(supabase, { cardMaxIssuance });
  } catch (err) {
    console.error('[admin] updateKeibaCardSettings failed:', err);
    redirect('/admin/settings?error=1');
  }

  revalidatePath('/admin/settings');
  redirect('/admin/settings?saved=1');
}

// ── 来世ガチャ（健太編）設定更新 ────────────────────────────────
export async function updateRaiseKentaSettings(formData: FormData) {
  await requireAdmin();
  const supabase = getServiceSupabase();

  try {
    const starDistribution: number[] = [];
    for (let i = 1; i <= 12; i++) {
      starDistribution.push(Number(formData.get(`star_${i}`) ?? 0));
    }

    const cardMaxIssuance: Record<string, number> = {};
    for (const key of formData.keys()) {
      if (key.startsWith('card_max_')) {
        const cardId = key.replace('card_max_', '');
        cardMaxIssuance[cardId] = Number(formData.get(key));
      }
    }

    await upsertRaiseSettings(supabase, 'kenta', {
      isActive:         formData.get('is_active') === 'on',
      lossRate:         Number(formData.get('loss_rate') ?? 60),
      starDistribution,
      dondenRate:       Number(formData.get('donden_rate') ?? 20),
      cardMaxIssuance,
    });
  } catch (err) {
    console.error('[admin] updateRaiseKentaSettings failed:', err);
    redirect('/admin/settings?error=1');
  }

  revalidatePath('/admin/settings');
  redirect('/admin/settings?saved=1');
}

// ── 来世ガチャ（正一編）設定更新 ────────────────────────────────
export async function updateRaiseShoichiSettings(formData: FormData) {
  await requireAdmin();
  const supabase = getServiceSupabase();

  try {
    const starDistribution: number[] = [];
    for (let i = 1; i <= 12; i++) {
      starDistribution.push(Number(formData.get(`star_${i}`) ?? 0));
    }

    const cardMaxIssuance: Record<string, number> = {};
    for (const key of formData.keys()) {
      if (key.startsWith('card_max_')) {
        const cardId = key.replace('card_max_', '');
        cardMaxIssuance[cardId] = Number(formData.get(key));
      }
    }

    await upsertRaiseSettings(supabase, 'shoichi', {
      isActive:         formData.get('is_active') === 'on',
      lossRate:         Number(formData.get('loss_rate') ?? 60),
      starDistribution,
      dondenRate:       Number(formData.get('donden_rate') ?? 20),
      cardMaxIssuance,
    });
  } catch (err) {
    console.error('[admin] updateRaiseShoichiSettings failed:', err);
    redirect('/admin/settings?error=1');
  }

  revalidatePath('/admin/settings');
  redirect('/admin/settings?saved=1');
}

// ── 当選者フィード設定更新 ──────────────────────────────────────
export async function updateWinnerSettings(formData: FormData) {
  await requireAdmin();
  const supabase = getServiceSupabase();

  try {
    await upsertAppSettings(supabase, {
      winnerDummyEnabled: formData.get('winner_dummy_enabled') === 'on',
    });
  } catch (err) {
    console.error('[admin] updateWinnerSettings failed:', err);
    redirect('/admin/settings?error=1');
  }

  revalidatePath('/admin/settings');
  revalidatePath('/');
  redirect('/admin/settings?saved=1');
}

// ── 当選品ステータス更新 ────────────────────────────────────────
export async function updatePrizeClaim(formData: FormData) {
  await requireAdmin();
  const supabase = getServiceSupabase();

  const claimId = String(formData.get('claim_id') ?? '');
  const status = String(formData.get('status') ?? '');
  const trackingNumber = formData.get('tracking_number') ? String(formData.get('tracking_number')) : undefined;
  const giftCode = formData.get('gift_code') ? String(formData.get('gift_code')) : undefined;
  const notes = formData.get('notes') ? String(formData.get('notes')) : undefined;
  const currentFilter = formData.get('current_filter') ? String(formData.get('current_filter')) : '';

  if (!claimId || !status) {
    redirect('/admin/prizes?error=1');
  }

  try {
    await updateClaimStatus(supabase, claimId, status, { trackingNumber, giftCode, notes });
  } catch (err) {
    console.error('[admin] updatePrizeClaim failed:', err);
    redirect('/admin/prizes?error=1');
  }

  revalidatePath('/admin/prizes');
  const filterParam = currentFilter && currentFilter !== 'all' ? `&status=${currentFilter}` : '';
  redirect(`/admin/prizes?saved=1${filterParam}`);
}

// ── ユーザーブロック ─────────────────────────────────────────────
export async function blockUser(userId: string) {
  await requireAdmin();
  const supabase = getServiceSupabase();
  await supabase
    .from('app_users')
    .update({ is_blocked: true, blocked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', userId);
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath('/admin/users');
}

// ── ユーザーブロック解除 ─────────────────────────────────────────
export async function unblockUser(userId: string) {
  await requireAdmin();
  const supabase = getServiceSupabase();
  await supabase
    .from('app_users')
    .update({ is_blocked: false, blocked_at: null, updated_at: new Date().toISOString() })
    .eq('id', userId);
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath('/admin/users');
}

// ── 配達レコード作成 ─────────────────────────────────────────────
export async function createDelivery(gachaResultId: string, userId: string) {
  await requireAdmin();
  const supabase = getServiceSupabase();
  await supabase.from('deliveries').insert({
    user_id: userId,
    gacha_result_id: gachaResultId,
    status: 'pending',
  });
  revalidatePath(`/admin/users/${userId}`);
}

// ── 配達ステータス更新 ───────────────────────────────────────────
export async function updateDeliveryStatus(deliveryId: string, formData: FormData) {
  await requireAdmin();
  const supabase = getServiceSupabase();
  const status = String(formData.get('status') ?? 'pending');
  const trackingNumber = formData.get('tracking_number') ? String(formData.get('tracking_number')) : null;
  const notes = formData.get('notes') ? String(formData.get('notes')) : null;

  const update: Record<string, unknown> = {
    status,
    tracking_number: trackingNumber,
    notes,
    updated_at: new Date().toISOString(),
  };
  if (status === 'shipped') update.shipped_at = new Date().toISOString();
  if (status === 'delivered') update.delivered_at = new Date().toISOString();

  const { data } = await supabase.from('deliveries').select('user_id').eq('id', deliveryId).single();
  await supabase.from('deliveries').update(update).eq('id', deliveryId);
  if (data?.user_id) revalidatePath(`/admin/users/${data.user_id}`);
}

// ── カードポイント交換レート更新 ──────────────────────────────────
export async function updateCardExchangeRates(formData: FormData) {
  await requireAdmin();
  const supabase = getServiceSupabase();

  try {
    const gachaType = String(formData.get('gacha_type') ?? '');
    if (!gachaType) redirect('/admin/settings?error=1');

    const rates: Record<string, number> = {};
    for (const key of formData.keys()) {
      if (key.startsWith('rate_')) {
        const cardId = key.replace('rate_', '');
        const v = formData.get(key);
        if (v != null && String(v).trim() !== '') {
          rates[cardId] = Number(v);
        }
      }
    }

    await upsertExchangeRates(supabase, gachaType, rates);
  } catch (err) {
    console.error('[admin] updateCardExchangeRates failed:', err);
    redirect('/admin/settings?error=1');
  }

  revalidatePath('/admin/settings');
  redirect('/admin/settings?saved=1');
}

// ── 紹介ボーナス / ログインボーナス設定更新 ─────────────────────
export async function updateAppSettings(formData: FormData) {
  await requireAdmin();
  const supabase = getServiceSupabase();

  try {
    await upsertAppSettings(supabase, {
      referralBonusReferrer: Number(formData.get('referral_bonus_referrer') ?? 200),
      referralBonusReferee:  Number(formData.get('referral_bonus_referee')  ?? 100),
      dailyLoginBonusAmount: Number(formData.get('daily_login_bonus_amount') ?? 0),
    });
  } catch (err) {
    console.error('[admin] updateAppSettings failed:', err);
    redirect('/admin/settings?error=1');
  }

  revalidatePath('/admin/settings');
  revalidatePath('/mypage');
  revalidatePath('/', 'layout');
  redirect('/admin/settings?saved=1');
}

// ── メンテナンスモード設定更新 ───────────────────────────────────
export async function updateMaintenanceSettings(formData: FormData) {
  await requireAdmin();
  const supabase = getServiceSupabase();

  try {
    await upsertAppSettings(supabase, {
      maintenanceMode:    formData.get('maintenance_mode') === 'on',
      maintenanceTitle:   String(formData.get('maintenance_title') ?? '').trim() || 'ただいまメンテナンス中です',
      maintenanceMessage: String(formData.get('maintenance_message') ?? '').trim()
        || 'より良いサービスをご提供するため、ただいまメンテナンスを実施しております。ご不便をおかけして申し訳ございません。',
    });
  } catch (err) {
    console.error('[admin] updateMaintenanceSettings failed:', err);
    redirect('/admin/settings?error=1');
  }

  revalidatePath('/admin/settings');
  revalidatePath('/', 'layout');
  redirect('/admin/settings?saved=1');
}

// ── プロモコード作成 ────────────────────────────────────────────
export async function createPromoCode(formData: FormData) {
  await requireAdmin();
  const supabase = getServiceSupabase();

  const code = String(formData.get('code') ?? '').trim().toUpperCase();
  if (!code) {
    redirect('/admin/promo-codes?error=' + encodeURIComponent('コードは必須です'));
  }

  const coinAmount = Number(formData.get('coin_amount') ?? 0);
  if (coinAmount <= 0) {
    redirect('/admin/promo-codes?error=' + encodeURIComponent('コイン数は1以上で入力してください'));
  }

  const maxUsesRaw = formData.get('max_uses');
  const maxUses = maxUsesRaw != null && String(maxUsesRaw).trim() !== ''
    ? Number(maxUsesRaw)
    : null;

  const expiresAtRaw = formData.get('expires_at');
  const expiresAt = expiresAtRaw != null && String(expiresAtRaw).trim() !== ''
    ? new Date(String(expiresAtRaw)).toISOString()
    : null;

  const description = formData.get('description') ? String(formData.get('description')) : null;

  const { error } = await supabase.from('promo_codes').insert({
    code,
    coin_amount: coinAmount,
    max_uses: maxUses,
    expires_at: expiresAt,
    description,
    is_active: true,
  });

  if (error) {
    console.error('[createPromoCode]', error);
    const msg = error.code === '23505' ? '同じコードが既に存在します' : `作成に失敗: ${error.message}`;
    redirect('/admin/promo-codes?error=' + encodeURIComponent(msg));
  }

  revalidatePath('/admin/promo-codes');
  redirect('/admin/promo-codes?saved=1');
}

// ── プロモコード有効/無効切替 ────────────────────────────────────
export async function togglePromoCode(id: string, isActive: boolean) {
  await requireAdmin();
  const supabase = getServiceSupabase();
  await supabase.from('promo_codes').update({ is_active: isActive }).eq('id', id);
  revalidatePath('/admin/promo-codes');
}

// ── プロモコード削除 ────────────────────────────────────────────
export async function deletePromoCode(id: string) {
  await requireAdmin();
  const supabase = getServiceSupabase();
  await supabase.from('promo_codes').delete().eq('id', id);
  revalidatePath('/admin/promo-codes');
}
