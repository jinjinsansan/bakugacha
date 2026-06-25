export const dynamic = 'force-dynamic';

import { HeroSection } from '@/components/home/HeroSection';
import { CampaignBanner } from '@/components/home/CampaignBanner';
import { WelcomeGuide } from '@/components/home/WelcomeGuide';
import { ProductGrid } from '@/components/home/ProductGrid';
import { NewsSection } from '@/components/home/NewsSection';
import { WinnerFeed } from '@/components/home/WinnerFeed';
import { RankingSection } from '@/components/home/RankingSection';
import { TrustBand } from '@/components/home/TrustBand';
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
    link_url: b.link_url,
  }));

  return (
    <>
      <HeroSection />
      <CampaignBanner banners={banners} />
      <WelcomeGuide />
      <div className="py-4 px-0">
        <section id="products" aria-label="ガチャ商品一覧">
          <ProductGrid />
        </section>
        <div className="divider-gold mx-4 my-2" />
        <section id="ranking">
          <RankingSection />
        </section>
        <div className="divider-gold mx-4 my-2" />
        <section id="winners">
          <WinnerFeed />
        </section>
        <TrustBand />
        <NewsSection />
        <div className="h-20 md:h-0" />
      </div>
    </>
  );
}
