import { getServiceSupabase } from '@/lib/supabase/service';
import { getUserFromSession } from '@/lib/data/session';

const LINE_REWARD_COINS = Number(process.env.LINE_REWARD_COINS ?? 300);
const LINE_OFFICIAL_URL = process.env.NEXT_PUBLIC_LINE_OFFICIAL_URL;

export async function LineFriendBanner() {
  if (!LINE_OFFICIAL_URL) return null;

  const supabase = getServiceSupabase();
  const user = await getUserFromSession(supabase);

  // 未ログイン or ボーナス済みなら非表示
  if (!user || user.line_friend_bonus_at) return null;

  return (
    <section className="px-4 pt-4">
      <a
        href={LINE_OFFICIAL_URL}
        target="_blank"
        rel="noreferrer"
        className="block rounded-2xl p-5 transition hover:scale-[1.01]"
        style={{
          background: 'linear-gradient(135deg, rgba(6,199,85,0.15) 0%, rgba(0,166,79,0.08) 100%)',
          border: '1px solid rgba(6,199,85,0.3)',
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-[10px] font-bold tracking-[0.4em] uppercase mb-1" style={{ color: '#06c755' }}>
              LINE BONUS
            </p>
            <p className="text-sm font-black text-white mb-1">
              公式LINE追加で <span className="text-gold">{LINE_REWARD_COINS}コイン</span> GET！
            </p>
            <p className="text-xs text-white/50">
              友だち追加するだけでコインが即時もらえます
            </p>
          </div>
          <div className="flex-shrink-0 text-center">
            <div className="rounded-xl px-4 py-2" style={{ background: 'rgba(6,199,85,0.2)' }}>
              <p className="text-xs font-bold" style={{ color: '#06c755' }}>🪙 +{LINE_REWARD_COINS}</p>
            </div>
            <p className="text-[10px] text-white/40 mt-1">タップして追加 →</p>
          </div>
        </div>
      </a>
    </section>
  );
}
