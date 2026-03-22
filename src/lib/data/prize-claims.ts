import type { SupabaseClient } from '@supabase/supabase-js';
import { grantCoins } from './coins';

export interface PrizeClaim {
  id: string;
  userId: string;
  gachaResultId: string;
  productId: string;
  prizeName: string;
  status: 'pending' | 'delivery_requested' | 'shipped' | 'delivered' | 'code_sent' | 'converted';
  recipientName: string | null;
  postalCode: string | null;
  address: string | null;
  phone: string | null;
  trackingNumber: string | null;
  giftCode: string | null;
  notes: string | null;
  exchangeCoins: number;
  createdAt: string;
  /** 管理者一覧用 */
  userEmail?: string;
  userDisplayName?: string;
}

const COLUMNS = 'id, user_id, gacha_result_id, product_id, prize_name, status, recipient_name, postal_code, address, phone, tracking_number, gift_code, notes, created_at';

/** ユーザーの当選品一覧（converted除外） */
export async function fetchUserPrizeClaims(
  client: SupabaseClient,
  userId: string,
): Promise<PrizeClaim[]> {
  const { data, error } = await client
    .from('prize_claims')
    .select(`${COLUMNS}, gacha_products(exchange_coins)`)
    .eq('user_id', userId)
    .neq('status', 'converted')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[prize-claims] fetch failed:', error);
    return [];
  }

  return (data ?? []).map(mapRow);
}

/** 管理者用: 全当選品一覧（ステータスフィルター可） */
export async function fetchAllPrizeClaims(
  client: SupabaseClient,
  statusFilter?: string,
): Promise<PrizeClaim[]> {
  let query = client
    .from('prize_claims')
    .select(`${COLUMNS}, gacha_products(exchange_coins), app_users(email, display_name)`)
    .order('created_at', { ascending: false })
    .limit(200);

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[prize-claims] fetchAll failed:', error);
    return [];
  }

  return (data ?? []).map((row) => {
    const claim = mapRow(row);
    const userRaw = row.app_users as unknown;
    const user = (Array.isArray(userRaw) ? userRaw[0] : userRaw) as Record<string, unknown> | null;
    claim.userEmail = (user?.email as string) ?? '';
    claim.userDisplayName = (user?.display_name as string) ?? '';
    return claim;
  });
}

/** 配送希望（住所入力） */
export async function requestDelivery(
  client: SupabaseClient,
  claimId: string,
  userId: string,
  delivery: { recipientName: string; postalCode: string; address: string; phone: string },
): Promise<boolean> {
  const { error } = await client
    .from('prize_claims')
    .update({
      status: 'delivery_requested',
      recipient_name: delivery.recipientName,
      postal_code: delivery.postalCode,
      address: delivery.address,
      phone: delivery.phone,
      requested_at: new Date().toISOString(),
    })
    .eq('id', claimId)
    .eq('user_id', userId)
    .eq('status', 'pending');

  if (error) {
    console.error('[prize-claims] requestDelivery failed:', error);
    return false;
  }
  return true;
}

/** コイン交換 */
export async function convertPrizeToCoins(
  client: SupabaseClient,
  claimId: string,
  userId: string,
): Promise<{ ok: boolean; coins?: number }> {
  const { data: claim } = await client
    .from('prize_claims')
    .select('id, status, product_id, prize_name')
    .eq('id', claimId)
    .eq('user_id', userId)
    .single();

  if (!claim || claim.status !== 'pending') return { ok: false };

  const { data: product } = await client
    .from('gacha_products')
    .select('exchange_coins')
    .eq('id', claim.product_id)
    .single();

  const coins = (product?.exchange_coins as number) ?? 0;
  if (coins <= 0) return { ok: false };

  const { error } = await client
    .from('prize_claims')
    .update({ status: 'converted', converted_at: new Date().toISOString() })
    .eq('id', claimId);

  if (error) {
    console.error('[prize-claims] convert failed:', error);
    return { ok: false };
  }

  await grantCoins(client, userId, coins, `賞品交換: ${claim.prize_name}`);
  return { ok: true, coins };
}

/** 管理者用: ステータス更新（ギフトコード対応） */
export async function updateClaimStatus(
  client: SupabaseClient,
  claimId: string,
  status: string,
  opts?: { trackingNumber?: string; giftCode?: string; notes?: string },
): Promise<boolean> {
  const update: Record<string, unknown> = {
    status,
    tracking_number: opts?.trackingNumber ?? null,
    gift_code: opts?.giftCode ?? null,
    notes: opts?.notes ?? null,
  };
  if (status === 'shipped') update.shipped_at = new Date().toISOString();
  if (status === 'delivered') update.delivered_at = new Date().toISOString();
  if (status === 'code_sent') update.delivered_at = new Date().toISOString();

  const { error } = await client
    .from('prize_claims')
    .update(update)
    .eq('id', claimId);

  if (error) {
    console.error('[prize-claims] updateStatus failed:', error);
    return false;
  }
  return true;
}

// ── ヘルパー ──────────────────────────────────────────────────

function mapRow(row: Record<string, unknown>): PrizeClaim {
  const product = row.gacha_products as Record<string, unknown> | null;
  return {
    id: row.id as string,
    userId: row.user_id as string,
    gachaResultId: row.gacha_result_id as string,
    productId: row.product_id as string,
    prizeName: row.prize_name as string,
    status: row.status as PrizeClaim['status'],
    recipientName: row.recipient_name as string | null,
    postalCode: row.postal_code as string | null,
    address: row.address as string | null,
    phone: row.phone as string | null,
    trackingNumber: row.tracking_number as string | null,
    giftCode: row.gift_code as string | null,
    notes: row.notes as string | null,
    exchangeCoins: (product?.exchange_coins as number) ?? 0,
    createdAt: row.created_at as string,
  };
}
