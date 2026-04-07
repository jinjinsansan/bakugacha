import { createProduct } from '@/app/admin/actions';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { AdminForm } from '@/components/admin/AdminForm';
import { StockZeroWarning } from '@/components/admin/StockZeroWarning';
import { getServiceSupabase } from '@/lib/supabase/service';

// UTC の ISO 文字列を datetime-local 用の "YYYY-MM-DDTHH:mm" (JST) に変換
function toLocalDatetimeValue(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 16);
}

const CATEGORIES = ['ポケモン', 'ワンピース', '遊戯王', 'ギフト券', 'ゲーム機', 'その他'];

export const GACHA_TYPES = [
  { value: 'cd2', label: 'カウントダウンチャレンジ2' },
  { value: 'ecard', label: 'ROYALカードガチャ' },
  { value: 'elevator', label: 'エレベーターガチャ' },
  { value: 'keiba', label: '競馬ガチャ' },
  { value: 'raise_kenta', label: '来世ガチャ（健太編）' },
  { value: 'raise_shoichi', label: '来世ガチャ（正一編）' },
] as const;

export default async function AdminProductNewPage() {
  const supabase = getServiceSupabase();
  const { data: products } = await supabase
    .from('gacha_products')
    .select('id, title')
    .order('sort_order', { ascending: true });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-black text-white">商品追加</h1>
      <AdminForm action={createProduct}>
        <ProductFormFields allProducts={products ?? []} />
        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-gold px-6 py-2 rounded-xl text-sm font-bold">
            作成
          </button>
          <a href="/admin/products" className="btn-outline px-6 py-2 rounded-xl text-sm font-bold">
            キャンセル
          </a>
        </div>
      </AdminForm>
    </div>
  );
}

export function ProductFormFields({
  defaults,
  allProducts,
}: {
  defaults?: Record<string, unknown>;
  allProducts?: { id: string; title: string }[];
}) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field name="id" label="ID（スラグ）" placeholder="pokemon-151" required defaultValue={defaults?.id as string} readOnly={!!defaults?.id} />
        <Field name="title" label="タイトル" required defaultValue={defaults?.title as string} />
        <div className="flex flex-col gap-1">
          <label className="text-xs text-white/60">カテゴリ</label>
          <select name="category" defaultValue={(defaults?.category as string) ?? 'その他'}
            className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400/50">
            {CATEGORIES.map((c) => <option key={c} value={c} className="bg-zinc-900">{c}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-white/60">ガチャタイプ</label>
          <select name="gacha_type" defaultValue={(defaults?.gacha_type as string) ?? 'cd2'}
            className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400/50">
            {GACHA_TYPES.map((t) => <option key={t.value} value={t.value} className="bg-zinc-900">{t.label}</option>)}
          </select>
        </div>
        <Field name="price" label="価格（コイン）" type="number" defaultValue={(defaults?.price as string) ?? '0'} />
      </div>

      <Field name="description" label="説明文" multiline defaultValue={defaults?.description as string} />
      <ImageUploadField
        name="image_url"
        label="商品画像"
        prefix="thumbnails"
        aspectHint="16:9 推奨 (640×360px)"
        defaultValue={defaults?.image_url as string}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field name="thumbnail_emoji" label="サムネイル絵文字" placeholder="🎰" defaultValue={defaults?.thumbnail_emoji as string} />
        <Field name="thumbnail_gradient" label="グラデーション" placeholder="linear-gradient(135deg,#1a1a2e,#16213e)" defaultValue={defaults?.thumbnail_gradient as string} />
        <Field name="thumbnail_label" label="ラベル" defaultValue={defaults?.thumbnail_label as string} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field name="stock_total" label="提供回数（総数）" type="number" required defaultValue={defaults?.stock_total as string} />
        <Field name="stock_remaining" label="残り回数" type="number" placeholder="空欄=提供回数と同じ" defaultValue={defaults?.stock_remaining as string} />
        <Field name="sort_order" label="表示順" type="number" defaultValue={(defaults?.sort_order as string) ?? '0'} />
      </div>
      <StockZeroWarning />

      <div className="rounded-xl border border-yellow-500/30 bg-yellow-950/20 p-4">
        <h3 className="text-sm font-black text-yellow-200 mb-1">🎯 商品別 当選制御（任意）</h3>
        <p className="text-xs text-yellow-100/70 mb-3">
          この商品だけ当選率や当選上限を個別に設定できます。空欄ならガチャタイプ共通設定が使われます。
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            name="win_rate_override"
            label="当選率 (%)"
            type="number"
            step="any"
            min={0}
            max={100}
            placeholder="空欄=共通設定を使用 / 例: 0.1"
            defaultValue={defaults?.win_rate_override != null ? String(defaults.win_rate_override) : ''}
          />
          <Field
            name="max_winners"
            label="当選上限（台数）"
            type="number"
            step={1}
            min={0}
            placeholder="空欄=無制限 / 例: 100"
            defaultValue={defaults?.max_winners != null ? String(defaults.max_winners) : ''}
          />
        </div>
        <p className="text-xs text-yellow-100/60 mt-2">
          💡 例: Switch 100台限定なら「当選率 1.0 / 当選上限 100」で設定。上限に達した時点で以降は自動的にハズレになります。
        </p>
      </div>

      <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-4">
        <h3 className="text-sm font-black text-blue-200 mb-1">🎮 TOPページに表示するボタン</h3>
        <p className="text-xs text-blue-100/70 mb-3">
          商品サムネイルに表示するガチャボタンを個別に選択できます。チェックを外したボタンは非表示になります。
        </p>
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="button_1"
              defaultChecked={defaults?.button_1 !== false}
              className="w-4 h-4 accent-blue-400"
            />
            <span className="text-sm text-white">1回ガチャ</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="button_10"
              defaultChecked={defaults?.button_10 !== false}
              className="w-4 h-4 accent-blue-400"
            />
            <span className="text-sm text-white">10連ガチャ</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="button_100"
              defaultChecked={defaults?.button_100 !== false}
              className="w-4 h-4 accent-blue-400"
            />
            <span className="text-sm text-white">100連ガチャ</span>
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-4">
        <h3 className="text-sm font-black text-purple-200 mb-1">🎟️ 権利コード設定</h3>
        <p className="text-xs text-purple-100/70 mb-3">
          当選時に別商品を引ける権利コードを発行したり、権利コードでしか引けない商品を設定できます。
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-white/60">当選時に権利コードを発行する対象商品</label>
            <select
              name="access_code_target_id"
              defaultValue={(defaults?.access_code_target_id as string) ?? ''}
              className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400/50"
            >
              <option value="" className="bg-zinc-900">なし（通常の当選処理）</option>
              {(allProducts ?? []).map((p) => (
                <option key={p.id} value={p.id} className="bg-zinc-900">{p.title}</option>
              ))}
            </select>
            <p className="text-[10px] text-white/40">当選すると選択した商品を引ける権利コードが発行されます</p>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-white/60">この商品は権利コードが必要</label>
            <label className="flex items-center gap-2 mt-1 cursor-pointer">
              <input
                type="checkbox"
                name="requires_access_code"
                defaultChecked={defaults?.requires_access_code === true}
                className="w-4 h-4 accent-purple-400"
              />
              <span className="text-sm text-white">はい（コイン不要、権利コードでのみプレイ可能）</span>
            </label>
            <p className="text-[10px] text-white/40">ONにすると詳細ページに権利コード入力欄が表示されます</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field name="exchange_coins" label="コイン交換レート" type="number" placeholder="0=交換不可" defaultValue={(defaults?.exchange_coins as string) ?? '0'} />
      </div>
      <p className="text-xs text-white/40 -mt-2">当選品をコインに交換する際のコイン数（CD2/ROYALガチャ用。0=交換不可）</p>

      <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4">
        <h3 className="text-sm font-black text-red-200 mb-1">🎬 当選時・シーケンス末尾追加映像（CD2専用・任意）</h3>
        <p className="text-xs text-red-100/70 mb-3">
          当選時のみ、カウントダウン演出の最後のコマとして追加再生される映像のURLを設定できます。ハズレ・未設定の場合はスキップされます。
        </p>
        <Field
          name="bonus_win_video_url"
          label="追加映像URL"
          placeholder="https://example.com/extra.mp4"
          defaultValue={(defaults?.bonus_win_video_url as string) ?? ''}
        />
        <p className="text-[10px] text-red-100/50 mt-2">
          💡 R2 や外部 CDN の公開 URL を入力してください。jackpot などの演出の直後・結果画面の前に再生されます。
        </p>
      </div>

      {/* 受付時間帯 */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h3 className="text-sm font-black text-white mb-1">⏰ 受付時間帯（任意）</h3>
        <p className="text-xs text-white/50 mb-3">設定するとその時間帯のみガチャを引けます。空欄なら常時受付。管理者は時間外でもプレイ可能。</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            name="available_from"
            label="受付開始日時（日本時間）"
            type="datetime-local"
            defaultValue={defaults?.available_from ? toLocalDatetimeValue(defaults.available_from as string) : ''}
          />
          <Field
            name="available_until"
            label="受付終了日時（日本時間）"
            type="datetime-local"
            defaultValue={defaults?.available_until ? toLocalDatetimeValue(defaults.available_until as string) : ''}
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-white/60">ステータス</label>
          <select name="status" defaultValue={(defaults?.status as string) ?? 'active'}
            className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400/50">
            <option value="active" className="bg-zinc-900">販売中 (active)</option>
            <option value="sold-out" className="bg-zinc-900">SOLD OUT</option>
          </select>
        </div>
        <label className="flex items-center gap-2 cursor-pointer mt-4">
          <input type="checkbox" name="is_featured" defaultChecked={defaults?.is_featured as boolean}
            className="w-4 h-4 accent-yellow-400" />
          <span className="text-sm text-white">注目商品（トップ表示）</span>
        </label>
      </div>
    </>
  );
}

function Field({
  name, label, type = 'text', placeholder, required, defaultValue, readOnly, multiline, step, min, max,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  readOnly?: boolean;
  multiline?: boolean;
  step?: string | number;
  min?: string | number;
  max?: string | number;
}) {
  const cls = 'rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-yellow-400/50 w-full disabled:opacity-50';
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-white/60">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {multiline ? (
        <textarea name={name} placeholder={placeholder} defaultValue={defaultValue} rows={3}
          className={cls} />
      ) : (
        <input name={name} type={type} placeholder={placeholder} required={required}
          defaultValue={defaultValue} readOnly={readOnly} disabled={readOnly}
          step={step} min={min} max={max}
          className={cls} />
      )}
    </div>
  );
}
