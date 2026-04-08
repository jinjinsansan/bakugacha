import { getServiceSupabase } from '@/lib/supabase/service';
import { fetchAllPrizeClaims } from '@/lib/data/prize-claims';
import { updatePrizeClaimInline } from '@/app/admin/actions';
import { PrizeClaimsTable } from './PrizeClaimsTable';

export default async function AdminPrizesPage() {
  const supabase = getServiceSupabase();
  const claims = await fetchAllPrizeClaims(supabase);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-black text-white">当選品管理</h1>
      <PrizeClaimsTable claims={claims} updateAction={updatePrizeClaimInline} />
    </div>
  );
}
