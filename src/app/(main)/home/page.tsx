import { HeroSection } from '@/components/home/HeroSection';
import { LineFriendBanner } from '@/components/home/LineFriendBanner';
import { CampaignBanner } from '@/components/home/CampaignBanner';
import { CategoryTabs } from '@/components/home/CategoryTabs';
import { FilterTags } from '@/components/home/FilterTags';
import { ProductGrid } from '@/components/home/ProductGrid';
import { NewsSection } from '@/components/home/NewsSection';
import { WinnerFeed } from '@/components/home/WinnerFeed';
import { RankingSection } from '@/components/home/RankingSection';
import { getServiceSupabase } from '@/lib/supabase/service';
import { fetchActiveBanners } from '@/lib/data/banners';
import type { BannerData } from '@/components/home/CampaignBanner';

export default async function HomePage() {
  const supabase = getServiceSupabase();
  const dbBanners = await fetchActiveBanners(supabase);

  const banners: BannerData[] = dbBanners.map((b) => ({
    id: b.id,
    title: b.title,
    subtitle: b.subtitle,
    tag: b.tag,
    badge: b.badge,
    badge_color: b.badge_color,
    image_url: b.image_url,
    overlay: b.overlay,
  }));

  return (
    <>
      <HeroSection />
      <LineFriendBanner />
      <CampaignBanner banners={banners.length > 0 ? banners : undefined} />
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
