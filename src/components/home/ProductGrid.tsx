import { ProductBrowser } from './ProductBrowser';
import { fetchFeaturedProducts, fetchRegularProducts } from '@/lib/data/gacha';
import { getServiceSupabase } from '@/lib/supabase/service';

export async function ProductGrid() {
  const supabase = getServiceSupabase();
  const [featuredProducts, regularProducts] = await Promise.all([
    fetchFeaturedProducts(supabase),
    fetchRegularProducts(supabase),
  ]);

  return <ProductBrowser featured={featuredProducts} regular={regularProducts} />;
}
