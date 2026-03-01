import { notFound } from 'next/navigation';
import { getServiceSupabase } from '@/lib/supabase/service';
import { fetchBannerById } from '@/lib/data/banners';
import { updateBanner } from '@/app/admin/actions';
import { BannerFormFields } from '../new/BannerFormFields';

export default async function AdminBannerEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = getServiceSupabase();
  const banner = await fetchBannerById(supabase, id);

  if (!banner) notFound();

  const action = updateBanner.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-black text-white">バナー編集</h1>
      <form action={action} className="card-premium p-6 flex flex-col gap-4">
        <BannerFormFields defaults={banner as unknown as Record<string, unknown>} />
        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-gold px-6 py-2 rounded-xl text-sm font-bold">
            更新
          </button>
          <a href="/admin/banners" className="btn-outline px-6 py-2 rounded-xl text-sm font-bold">
            キャンセル
          </a>
        </div>
      </form>
    </div>
  );
}
