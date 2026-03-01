import Link from 'next/link';
import { getServiceSupabase } from '@/lib/supabase/service';
import { getUserFromSession } from '@/lib/data/session';
import { logoutAction } from '@/app/(auth)/actions';
import { LineLoginLink } from '@/components/layout/LineLoginLink';

const lineLoginEnabled = Boolean(process.env.LINE_LOGIN_CHANNEL_ID);
const liffId = process.env.NEXT_PUBLIC_LIFF_ID ?? '';

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
      <div className="flex items-center justify-between max-w-[860px] w-full mx-auto px-4 sm:px-6 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <span className="text-xl sm:text-2xl font-black tracking-wider text-gold whitespace-nowrap">爆ガチャ</span>
          <span className="hidden sm:inline text-[10px] font-bold tracking-[0.2em] text-gray-500 mt-1 whitespace-nowrap">BAKU GACHA</span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-bold tracking-widest text-gray-400 uppercase shrink-0">
          <Link href="/gacha" className="hover:text-white transition-colors">ガチャ一覧</Link>
          <Link href="/ranking" className="hover:text-white transition-colors">ランキング</Link>
          <Link href="/winners" className="hover:text-white transition-colors">当選情報</Link>
        </nav>

        {/* Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 overflow-x-auto scrollbar-hide">
          {user ? (
            <>
              {/* コイン残高 */}
              <Link href="/purchase" className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-black shrink-0 whitespace-nowrap"
                style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)' }}>
                <span>🪙</span>
                <span className="text-gold">{(user.coins as number).toLocaleString()}</span>
              </Link>
              <Link href="/mypage" className="shrink-0">
                <button className="btn-silver text-[11px] sm:text-xs px-3 py-1.5 sm:px-4 sm:py-2 rounded-full whitespace-nowrap shrink-0">マイページ</button>
              </Link>
              <form action={logoutAction} className="shrink-0">
                <button type="submit" className="btn-outline text-[11px] sm:text-xs px-3 py-1.5 sm:px-4 sm:py-2 rounded-full whitespace-nowrap shrink-0">ログアウト</button>
              </form>
            </>
          ) : (
            <LineLoginLink
              liffId={liffId}
              fallbackHref={lineLoginEnabled ? '/api/line/login/start' : '/login'}
            />
          )}
        </div>
      </div>
    </header>
  );
}
