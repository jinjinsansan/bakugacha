import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServiceSupabase } from '@/lib/supabase/service';
import { getUserFromSession } from '@/lib/data/session';
import { getPublicEnv } from '@/lib/env';

const LINE_REWARD_COINS = Number(process.env.LINE_REWARD_COINS ?? 300);

type LinePageProps = {
  searchParams?: Promise<{ status?: string; coins?: string }>;
};

const statusMessages: Record<string, (coins?: number) => { tone: 'success' | 'error'; text: string }> = {
  success: (coins) => ({ tone: 'success', text: `LINE連携が完了し、${coins ?? 0} コインを付与しました！` }),
  'already-linked': () => ({ tone: 'success', text: 'すでにLINE連携が完了しています。' }),
  'line-user-already-linked': () => ({ tone: 'error', text: 'このLINEアカウントは他のユーザーと連携済みです。' }),
  'line-login-error': () => ({ tone: 'error', text: 'LINE連携中にエラーが発生しました。時間をおいて再度お試しください。' }),
  'line-login-denied': () => ({ tone: 'error', text: 'LINEでの承認がキャンセルされました。再度連携を行ってください。' }),
  'line-login-disabled': () => ({ tone: 'error', text: '現在LINE連携は準備中です。設定完了までお待ちください。' }),
};

export default async function LinePerkPage({ searchParams }: LinePageProps) {
  const params = await searchParams;
  const supabase = getServiceSupabase();
  const user = await getUserFromSession(supabase);

  if (!user) redirect('/login');

  const userId = user.id as string;

  // LINE連携状態を取得
  const { data: linkState } = await supabase
    .from('line_link_states')
    .select('rewarded_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const lineUrl = getPublicEnv().NEXT_PUBLIC_LINE_OFFICIAL_URL;
  const linkedAt = linkState?.rewarded_at
    ? new Date(linkState.rewarded_at as string).toLocaleString('ja-JP')
    : null;
  const lineLoginEnabled = Boolean(process.env.LINE_LOGIN_CHANNEL_ID);
  const isLinked = Boolean(linkState?.rewarded_at);

  const coinsFromQuery = params?.coins ? Number(params.coins) : undefined;
  const resolvedCoins =
    typeof coinsFromQuery === 'number' && Number.isFinite(coinsFromQuery) ? coinsFromQuery : LINE_REWARD_COINS;

  const status = params?.status;
  const message = status && statusMessages[status] ? statusMessages[status](resolvedCoins) : null;

  return (
    <div className="max-w-[860px] mx-auto px-4 py-10">
      {/* ステータスメッセージ */}
      {message && (
        <div
          className={`rounded-2xl border p-4 text-sm mb-6 ${
            message.tone === 'success'
              ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100'
              : 'border-red-400/40 bg-red-400/10 text-red-100'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* ヘッダー */}
      <div className="rounded-2xl p-6 text-center mb-6"
        style={{ background: '#0a0a1c', border: '1px solid rgba(201,168,76,0.25)' }}>
        <p className="text-[10px] font-bold tracking-[0.5em] text-gold uppercase mb-2">LINE BONUS</p>
        <h1 className="text-3xl font-black text-white mb-2">LINE連携特典</h1>
        <p className="text-sm text-white/70">
          爆ガチャ公式LINEと連携すると、コインが即時に付与されます。
        </p>
      </div>

      {/* ボーナス情報 + アクション */}
      <div className="rounded-2xl p-6 mb-6"
        style={{ background: '#0a0a1c', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] tracking-[0.4em] text-gray-500 uppercase">付与コイン</p>
            <p className="text-sm text-white/70 mt-1">LINE連携すると即時に受け取れます</p>
          </div>
          <div className="rounded-2xl px-6 py-3 text-center"
            style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)' }}>
            <p className="text-[10px] tracking-[0.4em] text-gold uppercase">Bonus</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl">🪙</span>
              <span className="text-4xl font-black text-gold">{LINE_REWARD_COINS.toLocaleString()}</span>
            </div>
            <p className="text-xs text-gold/80">コイン</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {isLinked ? (
            <span className="flex-1 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-center text-sm font-bold text-emerald-100">
              LINE連携済み
            </span>
          ) : lineLoginEnabled ? (
            <a
              href="/api/line/login/start"
              className="flex-1 rounded-2xl px-4 py-3 text-center text-sm font-bold text-white transition hover:scale-[1.01]"
              style={{
                background: 'linear-gradient(135deg, #06c755, #00a64f)',
                boxShadow: '0 4px 20px rgba(6,199,85,0.3)',
              }}
            >
              LINE連携を開始
            </a>
          ) : (
            <span className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-bold text-white/40">
              LINE連携は準備中です
            </span>
          )}
          {lineUrl && (
            <a
              href={lineUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-bold text-white/80 transition hover:bg-white/10"
            >
              公式LINEを開く
            </a>
          )}
          <Link
            href="/mypage"
            className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-bold text-white/80 transition hover:bg-white/10"
          >
            マイページに戻る
          </Link>
        </div>

        {linkedAt && (
          <p className="text-center text-xs text-emerald-200 mt-4">連携日時: {linkedAt}</p>
        )}
      </div>

      {/* ステップ */}
      <div className="rounded-2xl p-6 mb-6"
        style={{ background: '#0a0a1c', border: '1px solid rgba(255,255,255,0.07)' }}>
        <h2 className="text-sm font-black text-white tracking-wider mb-4">獲得ステップ</h2>
        <ol className="space-y-3 text-sm">
          <li className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="font-bold text-white">① 「LINE連携を開始」ボタンを押す</p>
            <p className="text-white/50 text-xs mt-1">LINEアプリ（またはブラウザ）が開き、連携画面が表示されます。</p>
          </li>
          <li className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="font-bold text-white">② LINEで承認する</p>
            <p className="text-white/50 text-xs mt-1">確認内容を承認すると、自動的に友だち追加と連携が完了します。</p>
          </li>
          <li className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="font-bold text-white">③ 即時でコイン付与</p>
            <p className="text-white/50 text-xs mt-1">承認後すぐにコインが残高へ追加されます。</p>
          </li>
        </ol>
      </div>

      {/* FAQ */}
      <div className="rounded-2xl p-6"
        style={{ background: '#0a0a1c', border: '1px solid rgba(255,255,255,0.07)' }}>
        <h2 className="text-sm font-black text-white tracking-wider mb-4">よくある質問</h2>
        <div className="space-y-3 text-sm">
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="font-bold text-white">コインはいつ反映されますか？</p>
            <p className="text-white/50 text-xs mt-1">LINEで承認するとすぐに残高へ反映されます。</p>
          </div>
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="font-bold text-white">再度もらえますか？</p>
            <p className="text-white/50 text-xs mt-1">1アカウントにつき1回のみ付与されます。</p>
          </div>
        </div>
      </div>
    </div>
  );
}
