import { getServiceSupabase } from '@/lib/supabase/service';
import { fetchCd2Settings } from '@/lib/data/cd2-gacha';
import { updateCd2Settings } from '@/app/admin/actions';

export default async function AdminSettingsPage() {
  const supabase = getServiceSupabase();
  const settings = await fetchCd2Settings(supabase);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-black text-white">CD2ガチャ設定</h1>

      <form action={updateCd2Settings} className="card-premium p-6 flex flex-col gap-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" name="is_enabled" defaultChecked={settings.isEnabled}
            className="w-5 h-5 accent-yellow-400" />
          <div>
            <p className="text-sm font-bold text-white">CD2ガチャを有効化</p>
            <p className="text-xs text-white/40">無効にすると「準備中」を返します</p>
          </div>
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RateField name="loss_rate" label="ハズレ率" description="この確率でハズレになります（%）" value={settings.lossRate} max={100} />
          <RateField name="donden_rate" label="どんでん返し率" description="ハズレ→当たりに逆転する確率（%）" value={settings.dondenRate} max={100} />
          <RateField name="patlite_rate" label="パトライト率" description="当選時にパトライト演出が出る確率（%）" value={settings.patliteRate} max={100} />
          <RateField name="freeze_rate" label="フリーズ率" description="当選時にフリーズ演出が出る確率（%）" value={settings.freezeRate} max={100} />
        </div>

        <div className="bg-white/5 rounded-xl p-4 text-xs text-white/50 space-y-1">
          <p>実効勝率 ≈ <strong className="text-white/70">{(100 - settings.lossRate + settings.lossRate * settings.dondenRate / 100).toFixed(1)}%</strong></p>
          <p>（ハズレ率 {settings.lossRate}% のうち {settings.dondenRate}% がどんでん返しで逆転）</p>
        </div>

        <button type="submit" className="btn-gold px-6 py-2 rounded-xl text-sm font-bold self-start">
          保存
        </button>
      </form>
    </div>
  );
}

function RateField({ name, label, description, value, max }: {
  name: string; label: string; description: string; value: number; max: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-white/60">{label}</label>
      <p className="text-xs text-white/40 mb-1">{description}</p>
      <div className="flex items-center gap-2">
        <input
          type="number" name={name} defaultValue={value} min={0} max={max} step={0.1}
          className="w-24 rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400/50"
        />
        <span className="text-sm text-white/50">%</span>
      </div>
    </div>
  );
}
