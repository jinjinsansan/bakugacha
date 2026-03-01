import Link from 'next/link';
import { getServiceSupabase } from '@/lib/supabase/service';
import { deleteProduct } from '@/app/admin/actions';
import { DeleteButton } from './DeleteButton';

export default async function AdminProductsPage() {
  const supabase = getServiceSupabase();
  const { data: products } = await supabase
    .from('gacha_products')
    .select('id, title, category, price, status, is_featured, stock_remaining, stock_total, sort_order')
    .order('sort_order', { ascending: true });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-white">商品管理</h1>
        <Link href="/admin/products/new"
          className="btn-gold px-4 py-2 rounded-xl text-sm font-bold">
          + 新規追加
        </Link>
      </div>

      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-white/70">
            <thead>
              <tr className="border-b border-white/10 text-left text-white/50">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">タイトル</th>
                <th className="px-4 py-3">カテゴリ</th>
                <th className="px-4 py-3">価格</th>
                <th className="px-4 py-3">ステータス</th>
                <th className="px-4 py-3">提供回数</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {(products ?? []).map((product) => (
                <tr key={product.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 font-mono text-white/40">{product.id}</td>
                  <td className="px-4 py-3 text-white font-medium">
                    {product.is_featured && <span className="text-yellow-300 mr-1">★</span>}
                    {product.title}
                  </td>
                  <td className="px-4 py-3">{product.category}</td>
                  <td className="px-4 py-3">
                    {product.price === 0 ? <span className="text-green-400">無料</span> : `🪙 ${(product.price as number).toLocaleString()}`}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${product.status === 'active' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                      {product.status === 'active' ? '販売中' : 'SOLD OUT'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {product.stock_total != null ? `${((product.stock_remaining as number) ?? 0).toLocaleString()}回 / ${(product.stock_total as number).toLocaleString()}回` : '∞'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link href={`/admin/products/${product.id}`}
                        className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-xs transition-colors">
                        編集
                      </Link>
                      <DeleteButton
                        title={product.title as string}
                        deleteAction={deleteProduct.bind(null, product.id as string)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
