import { getServiceSupabase } from '@/lib/supabase/service';
import { UserListTable } from './UserListTable';

export default async function AdminUsersPage() {
  const supabase = getServiceSupabase();
  const { data: users } = await supabase
    .from('app_users')
    .select('id, email, display_name, line_display_name, line_picture_url, coins, referral_code, is_blocked, created_at, last_login_at')
    .order('created_at', { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-black text-white">ユーザー管理</h1>
      <UserListTable users={users ?? []} />
    </div>
  );
}
