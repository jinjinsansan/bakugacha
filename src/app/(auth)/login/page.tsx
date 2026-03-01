type Props = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const error = params.error;

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
        href="/api/line/login/start"
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
