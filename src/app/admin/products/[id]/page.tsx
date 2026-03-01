import { notFound } from 'next/navigation';
import { getServiceSupabase } from '@/lib/supabase/service';
import { updateProduct } from '@/app/admin/actions';
import { ProductFormFields } from '@/app/admin/products/new/page';
import { AdminForm } from '@/components/admin/AdminForm';

type Props = { params: Promise<{ id: string }> };

export default async function AdminProductEditPage({ params }: Props) {
  const { id } = await params;
  const supabase = getServiceSupabase();
  const { data: product } = await supabase
    .from('gacha_products')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!product) notFound();

  const action = updateProduct.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-black text-white">商品編集: {product.title as string}</h1>
      <AdminForm action={action}>
        <ProductFormFields defaults={product as Record<string, unknown>} />
        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-gold px-6 py-2 rounded-xl text-sm font-bold">
            保存
          </button>
          <a href="/admin/products" className="btn-outline px-6 py-2 rounded-xl text-sm font-bold">
            キャンセル
          </a>
        </div>
      </AdminForm>
    </div>
  );
}
