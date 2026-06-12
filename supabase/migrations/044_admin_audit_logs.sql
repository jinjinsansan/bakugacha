-- ================================================================
-- 044: 管理者操作の監査ログ
--
-- コイン調整・ユーザーブロック・削除系・当選品ステータス変更など、
-- 「誰がいつ何をしたか」を追跡するためのテーブル。
-- 書き込みは server actions から service_role で行う。
-- ================================================================

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     UUID REFERENCES app_users(id) ON DELETE SET NULL,
  admin_email  TEXT,
  action       TEXT NOT NULL,          -- 例: 'adjust_coins', 'block_user', 'delete_product'
  target_type  TEXT,                   -- 例: 'user', 'product', 'prize_claim'
  target_id    TEXT,
  details      JSONB,                  -- 操作内容の補足 (金額・理由・変更後ステータスなど)
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at
  ON admin_audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin
  ON admin_audit_logs (admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target
  ON admin_audit_logs (target_type, target_id);

-- service_role のみアクセスするため RLS は他テーブルと同様に無効
ALTER TABLE admin_audit_logs DISABLE ROW LEVEL SECURITY;
