import Link from 'next/link';
import { getServiceSupabase } from '@/lib/supabase/service';
import { fetchAllBanners } from '@/lib/data/banners';
import { deleteBanner } from '@/app/admin/actions';

export default async function AdminBannersPage() {
  const supabase = getServiceSupabase();
  const banners = await fetchAllBanners(supabase);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-white">バナー管理</h1>
        <Link
          href="/admin/banners/new"
          className="btn-gold px-4 py-2 rounded-xl text-sm font-bold"
        >
          ＋ 新規作成
        </Link>
      </div>

      {banners.length === 0 ? (
        <p className="text-white/50 text-sm">バナーがありません。新規作成してください。</p>
      ) : (
        <div className="flex flex-col gap-3">
          {banners.map((b) => (
            <div
              key={b.id}
              className="card-premium p-4 flex items-center gap-4"
            >
              {/* サムネイル */}
              <div className="w-32 h-16 rounded-lg overflow-hidden shrink-0 bg-white/5 border border-white/10">
                {b.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">
                    No Image
                  </div>
                )}
              </div>

              {/* 情報 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white truncate">{b.title}</h3>
                  {b.badge && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                      style={{ background: b.badge_color }}
                    >
                      {b.badge}
                    </span>
                  )}
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      b.is_active
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-white/10 text-white/40'
                    }`}
                  >
                    {b.is_active ? '表示中' : '非表示'}
                  </span>
                </div>
                {b.subtitle && (
                  <p className="text-xs text-white/40 truncate mt-0.5">{b.subtitle}</p>
                )}
                <p className="text-[10px] text-white/30 mt-1">
                  順序: {b.sort_order}
                  {b.tag && ` ・ タグ: ${b.tag}`}
                </p>
              </div>

              {/* アクション */}
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/admin/banners/${b.id}`}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  編集
                </Link>
                <form
                  action={async () => {
                    'use server';
                    await deleteBanner(b.id);
                  }}
                >
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                  >
                    削除
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
