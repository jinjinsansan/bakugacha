import type { SupabaseClient } from '@supabase/supabase-js';

export interface AuditLogEntry {
  /** 操作名 (例: 'adjust_coins', 'block_user', 'delete_product') */
  action: string;
  /** 対象の種別 (例: 'user', 'product', 'prize_claim') */
  targetType?: string;
  targetId?: string;
  /** 金額・理由・変更後ステータスなどの補足情報 */
  details?: Record<string, unknown>;
}

/**
 * 管理者操作の監査ログを記録する (migration 044)。
 * 記録失敗で元の操作を失敗させないため、エラーはログ出力のみに留める。
 */
export async function logAdminAction(
  client: SupabaseClient,
  admin: Record<string, unknown>,
  entry: AuditLogEntry,
): Promise<void> {
  try {
    const { error } = await client.from('admin_audit_logs').insert({
      admin_id:    (admin.id as string) ?? null,
      admin_email: (admin.email as string) ?? null,
      action:      entry.action,
      target_type: entry.targetType ?? null,
      target_id:   entry.targetId ?? null,
      details:     entry.details ?? null,
    });
    if (error) {
      console.error('[audit] insert failed (migration 044 未適用の可能性):', error.message);
    }
  } catch (err) {
    console.error('[audit] insert failed:', err);
  }
}
