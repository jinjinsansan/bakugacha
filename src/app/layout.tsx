import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { getPublicEnv } from '@/lib/env';
import { BRAND } from '@/lib/brand';
import './globals.css';

const SITE_URL = getPublicEnv().NEXT_PUBLIC_SITE_URL;
const SITE_TITLE = `${BRAND.name} | ${BRAND.tagline}`;
const SITE_DESCRIPTION = 'ポケモン・ワンピース・遊戯王・任天堂スイッチ・Amazonギフト券。厳選されたガチャがここに集結。';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: BRAND.name,
    locale: 'ja_JP',
    type: 'website',
    // OGP画像は src/app/opengraph-image.png（ファイル名規約）で自動配信
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    // Twitter画像は src/app/twitter-image.png（ファイル名規約）で自動配信
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
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;800;900&family=Noto+Serif+JP:wght@400;500;600&family=Outfit:wght@800;900&display=swap"
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
