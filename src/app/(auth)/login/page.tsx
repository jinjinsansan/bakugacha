import Link from 'next/link';
import { loginAction } from '@/app/(auth)/actions';

type Props = {
  searchParams?: Promise<{ error?: string }>;
};

const inputClass =
  'mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-yellow-600/60 focus:outline-none transition-colors';

const labelClass = 'text-[11px] font-bold tracking-[0.3em] uppercase text-gray-500';

const lineLoginEnabled = Boolean(process.env.LINE_LOGIN_CHANNEL_ID);

export default async function LoginPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const error = params.error;

  return (
    <>
      <div className="mb-8 text-center">
        <p className="text-[10px] font-bold tracking-[0.4em] text-gold uppercase mb-2">
          Welcome Back
        </p>
        <h1 className="text-2xl font-black text-white">ログイン</h1>
      </div>

      {error && (
        <div className="mb-6 rounded-xl px-4 py-3 text-sm text-red-300"
          style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)' }}>
          {decodeURIComponent(error)}
        </div>
      )}

      {lineLoginEnabled && (
        <>
          <a
            href="/api/line/login/start"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-black tracking-wider text-sm text-white transition hover:opacity-90"
            style={{
              background: 'linear-gradient(135deg, #06c755, #00a64f)',
              boxShadow: '0 4px 20px rgba(6,199,85,0.3)',
            }}
          >
            LINEでログイン
          </a>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] font-bold tracking-[0.3em] text-gray-600 uppercase">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
        </>
      )}

      <form action={loginAction} className="space-y-5">
        <div>
          <label className={labelClass}>メールアドレス</label>
          <input
            type="email"
            name="email"
            required
            className={inputClass}
            placeholder="your@email.com"
          />
        </div>
        <div>
          <label className={labelClass}>パスワード</label>
          <input
            type="password"
            name="password"
            required
            className={inputClass}
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          className="btn-gold w-full py-3.5 rounded-xl font-black tracking-wider text-sm mt-2"
        >
          ログイン
        </button>
      </form>

      <div className="divider-gold my-6" />

      <p className="text-center text-xs text-gray-500">
        アカウントをお持ちでない方は{' '}
        <Link href="/register" className="text-gold hover:text-yellow-300 font-bold transition-colors">
          メールで新規登録
        </Link>
      </p>
    </>
  );
}
