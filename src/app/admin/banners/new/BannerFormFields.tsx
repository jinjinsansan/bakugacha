import { ImageUploadField } from '@/components/admin/ImageUploadField';

interface BannerFormFieldsProps {
  defaults?: Record<string, unknown>;
}

export function BannerFormFields({ defaults }: BannerFormFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field name="title" label="タイトル" required defaultValue={defaults?.title as string} />
        <Field name="subtitle" label="サブタイトル" defaultValue={defaults?.subtitle as string} />
        <Field name="tag" label="タグ" placeholder="🎉 新規登録キャンペーン" defaultValue={defaults?.tag as string} />
        <Field name="badge" label="バッジテキスト" placeholder="NEW" defaultValue={defaults?.badge as string} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field name="badge_color" label="バッジ色" placeholder="#c9a84c" defaultValue={(defaults?.badge_color as string) ?? '#c9a84c'} />
        <Field name="sort_order" label="表示順" type="number" defaultValue={(defaults?.sort_order as string) ?? '0'} />
      </div>

      <ImageUploadField
        name="image_url"
        label="バナー画像"
        prefix="banners"
        aspectHint="4:1 推奨 (800×200px)"
        defaultValue={defaults?.image_url as string}
      />

      <Field
        name="overlay"
        label="オーバーレイ"
        placeholder="linear-gradient(90deg, rgba(5,5,20,0.92) 0%, ...)"
        defaultValue={(defaults?.overlay as string) ?? 'linear-gradient(90deg, rgba(5,5,20,0.92) 0%, rgba(5,5,20,0.7) 50%, rgba(5,5,20,0.3) 100%)'}
      />

      <Field name="link_url" label="リンクURL" type="url" placeholder="https://..." defaultValue={defaults?.link_url as string} />

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={defaults?.is_active !== undefined ? (defaults.is_active as boolean) : true}
          className="w-4 h-4 accent-yellow-400"
        />
        <span className="text-sm text-white">表示する（有効）</span>
      </label>
    </>
  );
}

function Field({
  name, label, type = 'text', placeholder, required, defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  const cls = 'rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-yellow-400/50 w-full';
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-white/60">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <input name={name} type={type} placeholder={placeholder} required={required}
        defaultValue={defaultValue} className={cls} />
    </div>
  );
}
