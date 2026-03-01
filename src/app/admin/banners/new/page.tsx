import { createBanner } from '@/app/admin/actions';
import { BannerFormFields } from './BannerFormFields';

export default function AdminBannerNewPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-black text-white">バナー作成</h1>
      <form action={createBanner} className="card-premium p-6 flex flex-col gap-4">
        <BannerFormFields />
        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-gold px-6 py-2 rounded-xl text-sm font-bold">
            作成
          </button>
          <a href="/admin/banners" className="btn-outline px-6 py-2 rounded-xl text-sm font-bold">
            キャンセル
          </a>
        </div>
      </form>
    </div>
  );
}
