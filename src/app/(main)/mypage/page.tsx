export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServiceSupabase } from '@/lib/supabase/service';
import { getUserFromSession } from '@/lib/data/session';
import { fetchAppSettings } from '@/lib/data/app-settings';
import { logoutAction } from '@/app/(auth)/actions';
import { CopyReferralLink } from '@/components/referral/CopyReferralLink';
import { PrizeBox } from '@/components/mypage/PrizeBox';
import { KeibaCardCollection } from '@/components/mypage/KeibaCardCollection';
import { RaiseCardCollection } from '@/components/mypage/RaiseCardCollection';
import { DailyLoginBonus } from '@/components/mypage/DailyLoginBonus';
import { PromoCodeInput } from '@/components/mypage/PromoCodeInput';

export default async function MyPage() {
  const supabase = getServiceSupabase();
  const user = await getUserFromSession(supabase);
  if (!user) redirect('/login');

  // ガチャ履歴（直近20件）
  const { data: history } = await supabase
    .from('gacha_results')
    .select('id, result, prize_name, coins_spent, played_at, product_id')
    .eq('user_id', user.id as string)
    .order('played_at', { ascending: false })
    .limit(20);

  // コイン取引履歴（直近10件）
  const { data: transactions } = await supabase
    .from('coin_transactions')
    .select('id, type, amount, balance_after, description, created_at')
    .eq('user_id', user.id as string)
    .order('created_at', { ascending: false })
    .limit(10);

  const winCount = (history ?? []).filter((h) => h.result === 'win').length;
  const appSettings = await fetchAppSettings(supabase);

  // JST基準で本日のログインボーナス受取状況を判定
  const lastBonusAt = user.last_login_bonus_at as string | null;
  const todayJst = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const lastBonusJst = lastBonusAt
    ? new Date(new Date(lastBonusAt).getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
    : null;
  const alreadyClaimedBonus = lastBonusJst === todayJst;

  return (
    <div className="max-w-[860px] mx-auto px-4 py-10">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[10px] font-bold tracking-[0.4em] text-gold uppercase mb-1">My Page</p>
          <h1 className="text-2xl font-black text-white">マイページ</h1>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="btn-outline text-xs px-4 py-2 rounded-full">
            ログアウト
          </button>
        </form>
      </div>

      {/* ステータスカード */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {/* コイン残高 */}
        <div className="rounded-2xl p-5"
          style={{ background: '#0a0a1c', border: '1px solid rgba(201,168,76,0.25)' }}>
          <p className="text-[10px] tracking-[0.3em] text-gray-500 uppercase mb-2">コイン残高</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🪙</span>
            <span className="text-3xl font-black text-gold">
              {(user.coins as number).toLocaleString()}
            </span>
          </div>
          <Link href="/purchase">
            <button className="btn-gold w-full mt-4 py-2 rounded-xl text-xs font-black tracking-wider">
              コインを購入
            </button>
          </Link>
        </div>

        {/* メールアドレス */}
        <div className="rounded-2xl p-5"
          style={{ background: '#0a0a1c', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-[10px] tracking-[0.3em] text-gray-500 uppercase mb-2">アカウント</p>
          <p className="text-sm font-bold text-white truncate">{user.email as string}</p>
          <p className="text-xs text-gray-600 mt-1">
            登録日: {new Date(user.created_at as string).toLocaleDateString('ja-JP')}
          </p>
          {user.referral_code && (
            <p className="text-xs text-gray-500 mt-2">
              紹介コード: <span className="text-gold font-bold select-all">{user.referral_code as string}</span>
            </p>
          )}
        </div>

        {/* ガチャ統計 */}
        <div className="rounded-2xl p-5"
          style={{ background: '#0a0a1c', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-[10px] tracking-[0.3em] text-gray-500 uppercase mb-2">ガチャ統計</p>
          <p className="text-3xl font-black text-white">{(history ?? []).length}</p>
          <p className="text-xs text-gray-500">総プレイ数</p>
          <p className="text-lg font-black mt-2" style={{ color: '#4ade80' }}>{winCount} 当選</p>
        </div>
      </div>

      {/* デイリーログインボーナス */}
      <DailyLoginBonus
        amount={appSettings.dailyLoginBonusAmount}
        alreadyClaimed={alreadyClaimedBonus}
      />

      {/* プロモコード */}
      <PromoCodeInput />

      {/* 友達紹介 */}
      {user.referral_code && (
        <div className="rounded-2xl p-5 mb-6"
          style={{ background: '#0a0a1c', border: '1px solid rgba(201,168,76,0.25)' }}>
          <CopyReferralLink
            referralCode={user.referral_code as string}
            bonusAmount={appSettings.referralBonusReferrer}
          />
        </div>
      )}

      {/* LINE連携ボーナス */}
      <div className="rounded-2xl p-5 mb-6"
        style={{ background: '#0a0a1c', border: '1px solid rgba(6,199,85,0.25)' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] tracking-[0.3em] text-gray-500 uppercase mb-1">LINE特典</p>
            <p className="text-sm text-white/70">LINE連携でコインをGET</p>
          </div>
          <Link href="/mypage/line">
            <button className="px-4 py-2 rounded-xl text-xs font-black text-white transition hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #06c755, #00a64f)' }}>
              詳細を見る
            </button>
          </Link>
        </div>
      </div>

      {/* 当選品ボックス */}
      <PrizeBox />

      {/* カードコレクション */}
      <KeibaCardCollection />
      <RaiseCardCollection />

      {/* ガチャ履歴 */}
      <div className="rounded-2xl overflow-hidden mb-6"
        style={{ background: '#0a0a1c', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="text-sm font-black text-white tracking-wider">🎰 ガチャ履歴</h2>
        </div>
        {(history ?? []).length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-600 text-sm">
            まだガチャを引いていません
          </div>
        ) : (
          <ul>
            {(history ?? []).map((h, i) => (
              <li key={h.id}
                className={`flex items-center justify-between px-5 py-3 ${i !== 0 ? 'border-t border-white/5' : ''}`}>
                <div>
                  <p className="text-xs font-bold"
                    style={{ color: h.result === 'win' ? '#4ade80' : '#f87171' }}>
                    {h.result === 'win' ? '✓ 当選' : '✗ ハズレ'}
                    {h.prize_name && <span className="text-white ml-2">{h.prize_name}</span>}
                  </p>
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    {new Date(h.played_at as string).toLocaleString('ja-JP')}
                  </p>
                </div>
                <span className="text-xs font-black text-gray-400">
                  🪙 {(h.coins_spent as number).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* コイン取引履歴 */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: '#0a0a1c', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="text-sm font-black text-white tracking-wider">🪙 コイン履歴</h2>
        </div>
        {(transactions ?? []).length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-600 text-sm">履歴がありません</div>
        ) : (
          <ul>
            {(transactions ?? []).map((t, i) => (
              <li key={t.id}
                className={`flex items-center justify-between px-5 py-3 ${i !== 0 ? 'border-t border-white/5' : ''}`}>
                <div>
                  <p className="text-xs font-bold text-gray-300">{t.description as string}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    {new Date(t.created_at as string).toLocaleString('ja-JP')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black"
                    style={{ color: (t.amount as number) > 0 ? '#4ade80' : '#f87171' }}>
                    {(t.amount as number) > 0 ? '+' : ''}{(t.amount as number).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-gray-600">
                    残高 {(t.balance_after as number).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
