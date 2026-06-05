import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServiceSupabase } from '@/lib/supabase/service';
import { updateProduct } from '@/app/admin/actions';
import { ProductFormFields } from '@/app/admin/products/new/page';
import { AdminForm } from '@/components/admin/AdminForm';

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string }>;
};

export default async function AdminProductEditPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const supabase = getServiceSupabase();
  const { data: product } = await supabase
    .from('gacha_products')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!product) notFound();

  const [{ data: allProducts }, { data: prizes }] = await Promise.all([
    supabase.from('gacha_products').select('id, title').order('sort_order', { ascending: true }),
    supabase.from('prizes').select('id, name, type').order('created_at', { ascending: false }),
  ]);

  const action = updateProduct.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-black text-white">商品編集: {product.title as string}</h1>
      {sp.error && (
        <div className="rounded-xl px-4 py-3 text-sm text-red-300"
          style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)' }}>
          {decodeURIComponent(sp.error)}
        </div>
      )}
      <AdminForm action={action}>
        <ProductFormFields defaults={product as Record<string, unknown>} allProducts={allProducts ?? []} prizes={prizes ?? []} />
        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-gold px-6 py-2 rounded-xl text-sm font-bold">
            保存
          </button>
          <Link href="/admin/products" className="btn-outline px-6 py-2 rounded-xl text-sm font-bold">
            キャンセル
          </Link>
        </div>
      </AdminForm>
    </div>
  );
}
