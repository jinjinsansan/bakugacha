import Link from 'next/link';
import { getServiceSupabase } from '@/lib/supabase/service';
import { getUserFromSession } from '@/lib/data/session';
import { logoutAction } from '@/app/(auth)/actions';
import { LineLoginLink } from '@/components/layout/LineLoginLink';
import { BRAND } from '@/lib/brand';

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
      className="relative z-50"
      style={{
        background: 'linear-gradient(180deg, #150a26 0%, #090b16 100%)',
        borderBottom: '1px solid rgba(255,46,154,0.22)',
        boxShadow: '0 4px 24px rgba(20,0,40,0.5)',
      }}
    >
      <div className="flex items-center justify-between max-w-[860px] w-full mx-auto px-4 sm:px-6 py-3">
        {/* Logo: G モノグラムタイル ＋ ネオンワードマーク */}
        <Link href="/" className="flex items-center gap-2 shrink-0" aria-label={BRAND.name}>
          <span
            className="flex items-center justify-center w-[30px] h-[30px] rounded-[9px] font-black text-[15px] shrink-0"
            style={{
              fontFamily: "'Outfit', sans-serif",
              background: 'linear-gradient(135deg, #ff2e9a, #d8b15a)',
              color: '#1a0820',
              boxShadow: '0 0 16px rgba(255,46,154,0.5)',
            }}
          >
            G
          </span>
          <span
            className="text-xl sm:text-2xl font-black tracking-wide text-neon whitespace-nowrap"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            {BRAND.nameEn}
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-bold tracking-widest text-gray-400 uppercase shrink-0">
          <Link href="/#products" className="hover:text-white transition-colors">ガチャ一覧</Link>
          <Link href="/#ranking" className="hover:text-white transition-colors">ランキング</Link>
          <Link href="/#winners" className="hover:text-white transition-colors">当選情報</Link>
        </nav>

        {/* Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 overflow-x-auto scrollbar-hide">
          {user ? (
            <>
              {/* コイン残高 */}
              <Link href="/purchase" className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-black shrink-0 whitespace-nowrap"
                style={{ background: 'rgba(216,177,90,0.12)', border: '1px solid rgba(216,177,90,0.4)', boxShadow: '0 0 12px rgba(216,177,90,0.15)' }}>
                <span
                  className="flex items-center justify-center w-[14px] h-[14px] rounded-full text-[8px] font-black"
                  style={{ background: 'linear-gradient(135deg, #f0d68a, #d8b15a)', color: '#5a3c06' }}
                >
                  C
                </span>
                <span style={{ color: '#d8b15a' }}>{(user.coins as number).toLocaleString()}</span>
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
