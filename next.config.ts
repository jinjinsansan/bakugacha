import type { NextConfig } from "next";

const securityHeaders = [
  // MIMEスニッフィング防止
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // クリックジャッキング防止（LIFF はリダイレクトベースなので iframe 埋め込みは不要）
  { key: 'X-Frame-Options', value: 'DENY' },
  // リファラ漏洩を抑制
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // HTTPS強制 (1年, サブドメイン含む)
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // 不要なブラウザ機能を無効化
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Cloudflare R2 公開バケット
      { protocol: 'https', hostname: '*.r2.dev' },
      { protocol: 'https', hostname: '*.cloudflare.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
