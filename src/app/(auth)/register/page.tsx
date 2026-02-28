import Link from 'next/link';
import { registerAction } from '@/app/(auth)/actions';

type Props = {
  searchParams?: Promise<{ error?: string }>;
};

const inputClass =
  'mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-yellow-600/60 focus:outline-none transition-colors';

const labelClass = 'text-[11px] font-bold tracking-[0.3em] uppercase text-gray-500';

export default async function RegisterPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const error = params.error;

  return (
    <>
      <div className="mb-8 text-center">
        <p className="text-[10px] font-bold tracking-[0.4em] text-gold uppercase mb-2">
          New Account
        </p>
        <h1 className="text-2xl font-black text-white">新規登録</h1>
        <p className="text-xs text-gray-500 mt-2">
          登録完了で <span className="text-gold font-bold">300コイン</span> プレゼント！
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl px-4 py-3 text-sm text-red-300"
          style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)' }}>
          {decodeURIComponent(error)}
        </div>
      )}

      <form action={registerAction} className="space-y-5">
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
          <label className={labelClass}>パスワード（8文字以上）</label>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            className={inputClass}
            placeholder="••••••••"
          />
        </div>
        <div>
          <label className={labelClass}>パスワード（確認）</label>
          <input
            type="password"
            name="confirmPassword"
            required
            minLength={8}
            className={inputClass}
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          className="btn-gold w-full py-3.5 rounded-xl font-black tracking-wider text-sm mt-2"
        >
          🎰 登録して300コインGET
        </button>
      </form>

      <div className="divider-gold my-6" />

      <p className="text-center text-xs text-gray-500">
        すでにアカウントをお持ちの方は{' '}
        <Link href="/login" className="text-gold hover:text-yellow-300 font-bold transition-colors">
          ログイン
        </Link>
      </p>
    </>
  );
}
