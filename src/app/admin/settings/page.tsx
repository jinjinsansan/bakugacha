import { getServiceSupabase } from '@/lib/supabase/service';
import { fetchCd2Settings } from '@/lib/data/cd2-gacha';
import { fetchEcardSettings } from '@/lib/data/ecard-gacha';
import { fetchAppSettings } from '@/lib/data/app-settings';
import { updateCd2Settings, updateEcardSettings, updateAppSettings, updateWinnerSettings } from '@/app/admin/actions';

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ saved?: string; error?: string }>;
}) {
  const params = await searchParams;
  const supabase = getServiceSupabase();
  const [settings, ecardSettings, appSettings] = await Promise.all([
    fetchCd2Settings(supabase),
    fetchEcardSettings(supabase),
    fetchAppSettings(supabase),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-black text-white">CD2ガチャ設定</h1>

      {params?.saved && (
        <div className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3">
          <p className="text-sm font-semibold text-emerald-300">✅ 保存しました</p>
        </div>
      )}
      {params?.error && (
        <div className="rounded-xl border border-red-400/40 bg-red-400/10 px-4 py-3">
          <p className="text-sm font-semibold text-red-300">❌ 保存に失敗しました。再度お試しください。</p>
        </div>
      )}

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

      {/* ROYALカードガチャ設定 */}
      <h2 className="text-lg font-black text-white mt-4">ROYALカードガチャ設定</h2>
      <form action={updateEcardSettings} className="card-premium p-6 flex flex-col gap-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" name="is_active" defaultChecked={ecardSettings.isActive}
            className="w-5 h-5 accent-yellow-400" />
          <div>
            <p className="text-sm font-bold text-white">ROYALカードガチャを有効化</p>
            <p className="text-xs text-white/40">無効にすると「準備中」を返します</p>
          </div>
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RateField name="win_rate" label="当たり率" description="この確率で当たりになります（%）" value={ecardSettings.winRate} max={100} />
          <RateField name="donten_rate" label="どんでん返し率" description="当たり時にどんでん返し演出（軸C）が出る確率（%）" value={ecardSettings.dontenRate} max={100} />
        </div>

        <h3 className="text-sm font-bold text-white/70 mt-2">軸別出現率</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <RateField name="axis_a_rate" label="軸A（奴隷側先行）" description="出現ウェイト" value={ecardSettings.axisARate} max={100} />
          <RateField name="axis_b_rate" label="軸B（皇帝側後攻）" description="出現ウェイト" value={ecardSettings.axisBRate} max={100} />
          <RateField name="axis_c_rate" label="軸C（どんでん返し）" description="どんでん返し時のみ使用" value={ecardSettings.axisCRate} max={100} />
          <RateField name="axis_d_rate" label="軸D（皇帝側先行）" description="出現ウェイト" value={ecardSettings.axisDRate} max={100} />
          <RateField name="axis_e_rate" label="軸E（奴隷側後攻）" description="出現ウェイト" value={ecardSettings.axisERate} max={100} />
        </div>

        <h3 className="text-sm font-bold text-white/70 mt-2">期待度★表示確率</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RateField name="star5_rate" label="★5表示確率" description="★5が表示される確率（%）" value={ecardSettings.star5Rate} max={100} />
          <RateField name="star4_rate" label="★4表示確率" description="★4が表示される確率（%）" value={ecardSettings.star4Rate} max={100} />
        </div>

        <div className="bg-white/5 rounded-xl p-4 text-xs text-white/50 space-y-1">
          <p>当たり率: <strong className="text-white/70">{ecardSettings.winRate}%</strong></p>
          <p>当たり時どんでん返し（軸C）: <strong className="text-white/70">{ecardSettings.dontenRate}%</strong></p>
        </div>

        <button type="submit" className="btn-gold px-6 py-2 rounded-xl text-sm font-bold self-start">
          保存
        </button>
      </form>

      {/* 紹介ボーナス設定 */}
      <h2 className="text-lg font-black text-white mt-4">紹介ボーナス設定</h2>
      <form action={updateAppSettings} className="card-premium p-6 flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-white/60">紹介者への報酬</label>
            <p className="text-xs text-white/40 mb-1">友達を紹介したユーザーに付与するコイン数</p>
            <div className="flex items-center gap-2">
              <input
                type="number" name="referral_bonus_referrer" defaultValue={appSettings.referralBonusReferrer} min={0}
                className="w-24 rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400/50"
              />
              <span className="text-sm text-white/50">コイン</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-white/60">被紹介者への報酬</label>
            <p className="text-xs text-white/40 mb-1">紹介されて登録した新規ユーザーに付与するコイン数</p>
            <div className="flex items-center gap-2">
              <input
                type="number" name="referral_bonus_referee" defaultValue={appSettings.referralBonusReferee} min={0}
                className="w-24 rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400/50"
              />
              <span className="text-sm text-white/50">コイン</span>
            </div>
          </div>
        </div>

        <button type="submit" className="btn-gold px-6 py-2 rounded-xl text-sm font-bold self-start">
          保存
        </button>
      </form>

      {/* 当選者フィード設定 */}
      <h2 className="text-lg font-black text-white mt-4">当選者フィード設定</h2>
      <form action={updateWinnerSettings} className="card-premium p-6 flex flex-col gap-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" name="winner_dummy_enabled" defaultChecked={appSettings.winnerDummyEnabled}
            className="w-5 h-5 accent-yellow-400" />
          <div>
            <p className="text-sm font-bold text-white">ダミー当選者を表示</p>
            <p className="text-xs text-white/40">実際の当選者が10件未満の場合、ダミーの当選者名を自動生成してフィードを埋めます</p>
          </div>
        </label>

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
