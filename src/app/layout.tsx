import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { getPublicEnv } from '@/lib/env';
import './globals.css';

const SITE_URL = getPublicEnv().NEXT_PUBLIC_SITE_URL;
const SITE_TITLE = '爆ガチャ | 最高のガチャ体験';
const SITE_DESCRIPTION = 'ポケモン・ワンピース・遊戯王・任天堂スイッチ・Amazonギフト券。厳選されたガチャがここに集結。';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: '爆ガチャ',
    locale: 'ja_JP',
    type: 'website',
    images: [{ url: '/baku_gacha_logo_final.png', width: 1200, height: 630, alt: '爆ガチャ' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/baku_gacha_logo_final.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
