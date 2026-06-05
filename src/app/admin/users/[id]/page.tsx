import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServiceSupabase } from '@/lib/supabase/service';
import { adjustUserCoins } from '@/app/admin/actions';
import { fetchUserPrizeClaims } from '@/lib/data/prize-claims';
import { BlockButton } from './BlockButton';
import { UserDetailTabs } from './UserDetailTabs';

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export default async function AdminUserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ coin_ok?: string; coin_error?: string }>;
}) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};
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

  // タブ用データを取得（当選・配達は prize_claims を正本として表示）
  const [loginHistoryRes, coinTxRes, gachaResultsRes, claims] = await Promise.all([
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
    fetchUserPrizeClaims(supabase, id),
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

      {/* コイン手動調整 */}
      <div className="card-premium p-6 flex flex-col gap-3">
        <h2 className="text-sm font-bold text-white/70">🪙 コイン手動調整</h2>
        {sp.coin_ok && (
          <div className="rounded-lg px-3 py-2 text-xs text-green-300"
            style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)' }}>
            {decodeURIComponent(sp.coin_ok)}
          </div>
        )}
        {sp.coin_error && (
          <div className="rounded-lg px-3 py-2 text-xs text-red-300"
            style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)' }}>
            {decodeURIComponent(sp.coin_error)}
          </div>
        )}
        <form action={adjustUserCoins.bind(null, id)} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-white/50">操作</label>
            <select name="direction"
              className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400/50">
              <option value="grant" className="bg-zinc-900">付与 (+)</option>
              <option value="deduct" className="bg-zinc-900">減算 (−)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-white/50">枚数</label>
            <input name="amount" type="number" min={1} step={1} required
              className="w-28 rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400/50" />
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <label className="text-xs text-white/50">理由（履歴に記録）</label>
            <input name="reason" type="text" required maxLength={100} placeholder="例: 不具合のお詫び補填"
              className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-yellow-400/50" />
          </div>
          <button type="submit" className="btn-gold px-5 py-2 rounded-xl text-sm font-bold">実行</button>
        </form>
        <p className="text-[10px] text-white/30">
          調整は coin_transactions に「管理者調整」として記録されます（migration 042 の適用が必要）。
        </p>
      </div>

      {/* タブセクション */}
      <UserDetailTabs
        loginHistory={loginHistoryRes.data ?? []}
        coinTransactions={coinTxRes.data ?? []}
        gachaResults={gachaResultsRes.data ?? []}
        claims={claims ?? []}
      />
    </div>
  );
}
