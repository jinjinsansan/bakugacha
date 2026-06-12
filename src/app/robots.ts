import type { MetadataRoute } from 'next';
import { getPublicEnv } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  const base = getPublicEnv().NEXT_PUBLIC_SITE_URL;
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/mypage', '/login'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
