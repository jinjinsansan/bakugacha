import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * play_gacha RPC のパラメータ (migration 019)
 */
export interface PlayGachaParams {
  userId: string;
  productId: string;
  price: number;
  isAdmin: boolean;
  result: 'win' | 'loss';
  prizeName: string;
  cardInfo?: KeibaCardInfo | RaiseCardInfo | null;
  createPrizeClaim?: boolean;
}

export interface KeibaCardInfo {
  type: 'keiba';
  chara_id: string;
  card_number: string;
  max_issuance?: number;
}

export interface RaiseCardInfo {
  type: 'raise';
  character_id: 'kenta' | 'shoichi';
  card_id: string;
  card_number: string;
  rarity: string;
  star_level: number;
  max_issuance?: number;
}

/**
 * play_gacha RPC の戻り値
 */
export interface PlayGachaResult {
  success: boolean;
  error_code: string | null;
  gacha_result_id: string | null;
  new_coins: number;
  card_serial: string | null;
  card_row_id: string | null;
  card_seq: number | null;
}

/**
 * エラーコード → 日本語メッセージ
 */
export const PLAY_GACHA_ERROR_MESSAGES: Record<string, string> = {
  OUT_OF_STOCK:       'この商品は売り切れです。',
  INSUFFICIENT_COINS: 'コインが不足しています。',
  USER_NOT_FOUND:     'ユーザー情報が取得できません。',
  PRODUCT_NOT_FOUND:  '商品が見つかりません。',
};

/**
 * 統合ガチャ実行 RPC 呼び出し。
 *
 * migration 019 で定義した PostgreSQL 関数 play_gacha を呼び出し、
 * コイン減算・在庫減算・結果記録・カード発行を1トランザクションで原子的に実行する。
 *
 * 返り値の success が false の場合、error_code をメッセージに変換してクライアントに返す。
 */
export async function callPlayGacha(
  client: SupabaseClient,
  params: PlayGachaParams,
): Promise<PlayGachaResult> {
  const { data, error } = await client.rpc('play_gacha', {
    p_user_id:            params.userId,
    p_product_id:         params.productId,
    p_price:              params.price,
    p_is_admin:           params.isAdmin,
    p_result:             params.result,
    p_prize_name:         params.prizeName,
    p_card_info:          params.cardInfo ?? null,
    p_create_prize_claim: params.createPrizeClaim ?? false,
  });

  if (error) {
    console.error('[play_gacha RPC]', error);
    throw new Error(`ガチャ実行に失敗しました: ${error.message}`);
  }

  // RPC は TABLE を返すため data は配列
  const row = Array.isArray(data) ? data[0] : data;

  if (!row) {
    throw new Error('ガチャ実行結果が空です。');
  }

  return row as PlayGachaResult;
}

/**
 * error_code を HTTP レスポンス用のメッセージに変換
 */
export function mapPlayGachaError(errorCode: string | null): string {
  if (!errorCode) return '処理に失敗しました。';
  return PLAY_GACHA_ERROR_MESSAGES[errorCode] ?? '処理に失敗しました。';
}
