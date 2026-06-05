import { getServiceSupabase } from '@/lib/supabase/service';
import { fetchAllPrizeClaims } from '@/lib/data/prize-claims';
import { updatePrizeClaimInline } from '@/app/admin/actions';
import { PrizeClaimsTable } from './PrizeClaimsTable';

export default async function AdminPrizesPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const supabase = getServiceSupabase();
  const claims = await fetchAllPrizeClaims(supabase);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-black text-white">当選品管理</h1>
      <p className="text-xs text-white/40 -mt-3 leading-relaxed">
        ユーザーの個別の当選一覧です。配送申請・発送・ギフトコード送付・コイン交換をここで処理します。
        景品の雛形は <strong className="text-white/60">景品マスタ</strong>、抽選の全履歴は <strong className="text-white/60">結果・分析</strong> をご覧ください。
      </p>
      <PrizeClaimsTable claims={claims} updateAction={updatePrizeClaimInline} initialStatus={sp.status ?? 'all'} />
    </div>
  );
}
