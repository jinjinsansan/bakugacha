import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServiceSupabase } from '@/lib/supabase/service';
import { BlockButton } from './BlockButton';
import { UserDetailTabs } from './UserDetailTabs';

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getServiceSupabase();

  const { data: user } = await supabase
    .from('app_users')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!user) notFound();

  // 紹介者の名前を取得
  let referrerName: string | null = null;
  if (user.referred_by) {
    const { data: referrer } = await supabase
      .from('app_users')
      .select('line_display_name, display_name, email')
      .eq('id', user.referred_by)
      .maybeSingle();
    referrerName = referrer?.line_display_name ?? referrer?.display_name ?? referrer?.email ?? null;
  }

  // タブ用データを取得
  const [loginHistoryRes, coinTxRes, gachaResultsRes, winsRes] = await Promise.all([
    supabase
      .from('login_history')
      .select('id, logged_in_at')
      .eq('user_id', id)
      .order('logged_in_at', { ascending: false })
      .limit(100),
    supabase
      .from('coin_transactions')
      .select('id, type, amount, balance_after, description, created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('gacha_results')
      .select('id, result, prize_name, coins_spent, played_at, gacha_products(title)')
      .eq('user_id', id)
      .order('played_at', { ascending: false })
      .limit(100),
    supabase
      .from('gacha_results')
      .select('id, prize_name, played_at, gacha_products(title), deliveries(id, status, tracking_number, notes, shipped_at, delivered_at)')
      .eq('user_id', id)
      .eq('result', 'win')
      .order('played_at', { ascending: false })
      .limit(100),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/users" className="text-white/40 hover:text-white text-sm transition-colors">
          ← ユーザー一覧
        </Link>
      </div>

      {/* 基本情報カード */}
      <div className="card-premium p-6">
        <div className="flex items-start gap-4 flex-wrap">
          {user.line_picture_url ? (
            <img src={user.line_picture_url as string} alt="" className="w-16 h-16 rounded-full" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-white/30 text-2xl">?</div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-lg font-black text-white">
                {(user.line_display_name ?? user.display_name ?? '名前未設定') as string}
              </h1>
              {user.is_blocked && (
                <span className="px-2 py-0.5 rounded text-xs bg-red-900/50 text-red-400">ブロック中</span>
              )}
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-white/60">
              <div>
                <span className="text-white/30">LINE名:</span>{' '}
                {(user.line_display_name as string) ?? '—'}
              </div>
              <div>
                <span className="text-white/30">表示名:</span>{' '}
                {(user.display_name as string) ?? '—'}
              </div>
              <div>
                <span className="text-white/30">メール:</span>{' '}
                {(user.email as string) ?? '—'}
              </div>
              <div>
                <span className="text-white/30">コイン残高:</span>{' '}
                <span className="text-yellow-300 font-bold">🪙 {((user.coins as number) ?? 0).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-white/30">紹介コード:</span>{' '}
                <span className="font-mono">{(user.referral_code as string) ?? '—'}</span>
              </div>
              <div>
                <span className="text-white/30">紹介者:</span>{' '}
                {referrerName ? (
                  <Link href={`/admin/users/${user.referred_by}`} className="text-yellow-300/80 hover:text-yellow-300 underline">
                    {referrerName}
                  </Link>
                ) : '—'}
              </div>
              <div>
                <span className="text-white/30">登録日:</span>{' '}
                {formatDate(user.created_at as string)}
              </div>
              <div>
                <span className="text-white/30">最終ログイン:</span>{' '}
                {formatDate(user.last_login_at as string)}
              </div>
            </div>
          </div>

          <div className="shrink-0">
            <BlockButton userId={id} isBlocked={user.is_blocked as boolean} />
          </div>
        </div>
      </div>

      {/* タブセクション */}
      <UserDetailTabs
        userId={id}
        loginHistory={loginHistoryRes.data ?? []}
        coinTransactions={coinTxRes.data ?? []}
        gachaResults={gachaResultsRes.data ?? []}
        wins={winsRes.data ?? []}
      />
    </div>
  );
}
