import { HeroSection } from '@/components/home/HeroSection';
import { CampaignBanner } from '@/components/home/CampaignBanner';
import { CategoryTabs } from '@/components/home/CategoryTabs';
import { FilterTags } from '@/components/home/FilterTags';
import { ProductGrid } from '@/components/home/ProductGrid';
import { NewsSection } from '@/components/home/NewsSection';
import { WinnerFeed } from '@/components/home/WinnerFeed';
import { RankingSection } from '@/components/home/RankingSection';

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
        <div className="divider-gold mx-4 my-2" />
        <RankingSection />
        <div className="divider-gold mx-4 my-2" />
        <WinnerFeed />
        <NewsSection />
        <div className="h-20 md:h-0" />
      </div>
    </>
  );
}
