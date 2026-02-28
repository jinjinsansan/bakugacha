import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '爆ガチャ | 最高のガチャ体験',
  description: 'ポケモン・ワンピース・遊戯王・任天堂スイッチ・Amazonギフト券。厳選されたガチャがここに集結。',
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
      </body>
    </html>
  );
}
