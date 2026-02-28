import { HeroSection } from '@/components/home/HeroSection';
import { CampaignBanner } from '@/components/home/CampaignBanner';
import { CategoryTabs } from '@/components/home/CategoryTabs';
import { FilterTags } from '@/components/home/FilterTags';
import { ProductGrid } from '@/components/home/ProductGrid';
import { NewsSection } from '@/components/home/NewsSection';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CampaignBanner />
      <CategoryTabs />
      <div className="py-4 px-0">
        <section aria-label="ガチャ商品一覧">
          <FilterTags />
          <ProductGrid />
        </section>
        <NewsSection />
        <div className="h-20 md:h-0" />
      </div>
    </>
  );
}
