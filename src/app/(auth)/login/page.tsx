import crypto from 'crypto';
import { headers } from 'next/headers';
import { getServiceSupabase } from '@/lib/supabase/service';
import { getServerEnv } from '@/lib/env';

type Props = {
  searchParams?: Promise<{ error?: string }>;
};

/**
 * LINE認証URLをサーバー側で事前生成し、<a href> に直接埋め込む。
 * iOS ではサーバー302リダイレクト経由だと Universal Links が機能せず
 * LINEアプリが起動しないため、直接リンクにする必要がある。
 */
async function buildLineAuthorizeUrl(): Promise<string | null> {
  try {
    const { LINE_LOGIN_CHANNEL_ID } = getServerEnv();
    if (!LINE_LOGIN_CHANNEL_ID) return null;

    const headersList = await headers();
    const host = headersList.get('host');
    const proto = headersList.get('x-forwarded-proto') ?? 'https';
    const origin = `${proto}://${host}`;

    const state = crypto.randomBytes(16).toString('hex');
    const nonce = crypto.randomBytes(16).toString('hex');

    const supabase = getServiceSupabase();
    const { error } = await supabase
      .from('line_link_states')
      .insert({ user_id: null, state, nonce });

    if (error) {
      console.error('Failed to create LINE link state', error);
      return null;
    }

    const url = new URL('https://access.line.me/oauth2/v2.1/authorize');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', LINE_LOGIN_CHANNEL_ID);
    url.searchParams.set('redirect_uri', `${origin}/api/line/login/callback`);
    url.searchParams.set('state', state);
    url.searchParams.set('scope', 'profile openid');
    url.searchParams.set('nonce', nonce);
    // prompt=consent を除去: この設定があるとiOSモバイルで
    // LINEアプリが起動せずブラウザの同意画面が強制表示される
    url.searchParams.set('bot_prompt', 'normal');

    return url.toString();
  } catch (e) {
    console.error('buildLineAuthorizeUrl failed', e);
    return null;
  }
}

export default async function LoginPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const error = params.error;

  const lineUrl = await buildLineAuthorizeUrl();

  return (
    <>
      <div className="mb-8 text-center">
        <p className="text-[10px] font-bold tracking-[0.4em] text-gold uppercase mb-2">
          Welcome
        </p>
        <h1 className="text-2xl font-black text-white">ログイン / 新規登録</h1>
        <p className="text-xs text-gray-500 mt-2">
          LINEアカウントで <span className="text-gold font-bold">300コイン</span> プレゼント！
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl px-4 py-3 text-sm text-red-300"
          style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)' }}>
          {decodeURIComponent(error)}
        </div>
      )}

      <a
        href={lineUrl ?? '/api/line/login/start'}
        className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-black tracking-wider text-sm text-white transition hover:opacity-90"
        style={{
          background: 'linear-gradient(135deg, #06c755, #00a64f)',
          boxShadow: '0 4px 20px rgba(6,199,85,0.3)',
        }}
      >
        LINEでログイン / 登録
      </a>

      <p className="text-center text-xs text-gray-600 mt-6">
        初回ログイン時にアカウントが自動作成されます
      </p>
    </>
  );
}
