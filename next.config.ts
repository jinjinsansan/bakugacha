import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Cloudflare R2 公開バケット
      { protocol: 'https', hostname: '*.r2.dev' },
      { protocol: 'https', hostname: '*.cloudflare.com' },
      // 開発中のプレースホルダー画像
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },
};

export default nextConfig;
