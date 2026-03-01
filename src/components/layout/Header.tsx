import Link from 'next/link';
import { getServiceSupabase } from '@/lib/supabase/service';
import { getUserFromSession } from '@/lib/data/session';
import { logoutAction } from '@/app/(auth)/actions';

const lineLoginEnabled = Boolean(process.env.LINE_LOGIN_CHANNEL_ID);

export async function Header() {
  let user: Record<string, unknown> | null = null;
  try {
    const supabase = getServiceSupabase();
    user = await getUserFromSession(supabase);
  } catch {
    // 未ログイン時は null のまま
  }

  return (
    <header
      className="sticky z-50 top-0"
      style={{
        background: 'linear-gradient(180deg, #07071a 0%, #050514 100%)',
        borderBottom: '1px solid rgba(201,168,76,0.2)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
      }}
    >
      <div className="flex items-center justify-between max-w-[860px] w-full mx-auto px-6 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-black tracking-wider text-gold">爆ガチャ</span>
          <span className="text-[10px] font-bold tracking-[0.2em] text-gray-500 mt-1">BAKU GACHA</span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-bold tracking-widest text-gray-400 uppercase">
          <Link href="/gacha" className="hover:text-white transition-colors">ガチャ一覧</Link>
          <Link href="/ranking" className="hover:text-white transition-colors">ランキング</Link>
          <Link href="/winners" className="hover:text-white transition-colors">当選情報</Link>
        </nav>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* コイン残高 */}
              <Link href="/purchase" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black"
                style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)' }}>
                <span>🪙</span>
                <span className="text-gold">{(user.coins as number).toLocaleString()}</span>
              </Link>
              <Link href="/mypage">
                <button className="btn-silver text-xs px-4 py-2 rounded-full">マイページ</button>
              </Link>
              <form action={logoutAction}>
                <button type="submit" className="btn-outline text-xs px-4 py-2 rounded-full">ログアウト</button>
              </form>
            </>
          ) : (
            <>
              {lineLoginEnabled && (
                <a
                  href="/api/line/login/start"
                  className="text-xs px-5 py-2 rounded-full font-black text-white transition hover:opacity-90"
                  style={{
                    background: 'linear-gradient(135deg, #06c755, #00a64f)',
                    boxShadow: '0 2px 12px rgba(6,199,85,0.3)',
                  }}
                >
                  LINEでログイン
                </a>
              )}
              <Link href="/login">
                <button className="btn-silver text-xs px-5 py-2 rounded-full">ログイン</button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
