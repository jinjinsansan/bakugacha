import { createProduct } from '@/app/admin/actions';

const CATEGORIES = ['ポケモン', 'ワンピース', '遊戯王', 'ギフト券', 'ゲーム機', 'その他'];

export default function AdminProductNewPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-black text-white">商品追加</h1>
      <form action={createProduct} className="card-premium p-6 flex flex-col gap-4">
        <ProductFormFields />
        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-gold px-6 py-2 rounded-xl text-sm font-bold">
            作成
          </button>
          <a href="/admin/products" className="btn-outline px-6 py-2 rounded-xl text-sm font-bold">
            キャンセル
          </a>
        </div>
      </form>
    </div>
  );
}

export function ProductFormFields({
  defaults,
}: {
  defaults?: Record<string, unknown>;
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
        <Field name="price" label="価格（コイン）" type="number" defaultValue={(defaults?.price as string) ?? '0'} />
      </div>

      <Field name="description" label="説明文" multiline defaultValue={defaults?.description as string} />
      <Field name="image_url" label="画像URL" type="url" defaultValue={defaults?.image_url as string} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field name="thumbnail_emoji" label="サムネイル絵文字" placeholder="🎰" defaultValue={defaults?.thumbnail_emoji as string} />
        <Field name="thumbnail_gradient" label="グラデーション" placeholder="linear-gradient(135deg,#1a1a2e,#16213e)" defaultValue={defaults?.thumbnail_gradient as string} />
        <Field name="thumbnail_label" label="ラベル" defaultValue={defaults?.thumbnail_label as string} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field name="stock_total" label="在庫総数" type="number" placeholder="空欄=無制限" defaultValue={defaults?.stock_total as string} />
        <Field name="stock_remaining" label="残り在庫" type="number" placeholder="空欄=在庫総数と同じ" defaultValue={defaults?.stock_remaining as string} />
        <Field name="sort_order" label="表示順" type="number" defaultValue={(defaults?.sort_order as string) ?? '0'} />
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
  name, label, type = 'text', placeholder, required, defaultValue, readOnly, multiline,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  readOnly?: boolean;
  multiline?: boolean;
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
          className={cls} />
      )}
    </div>
  );
}
