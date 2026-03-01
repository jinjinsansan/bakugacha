'use client';

import { isLineInAppBrowser, isMobileBrowser, openLineAppWithFallback } from '@/lib/auth/line-client';

export function LineLoginLink({
  liffId,
  fallbackHref,
}: {
  liffId: string;
  fallbackHref: string;
}) {
  const handleClick = () => {
    // LINE内ブラウザ: line://app/ はループするため /login へ誘導
    if (isLineInAppBrowser()) {
      window.location.replace('/login');
      return;
    }

    const isMobile = isMobileBrowser();

    if (liffId && isMobile) {
      // 外部モバイルブラウザ: line:// URL Scheme でLINEアプリを直接起動
      openLineAppWithFallback(liffId, () => {
        window.location.replace(`https://liff.line.me/${liffId}`);
      });
    } else {
      window.location.replace(fallbackHref);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="text-[11px] sm:text-xs px-4 sm:px-5 py-2 rounded-full font-black text-white transition hover:opacity-90 shrink-0 whitespace-nowrap"
      style={{
        background: 'linear-gradient(135deg, #06c755, #00a64f)',
        boxShadow: '0 2px 12px rgba(6,199,85,0.3)',
      }}
    >
      ログイン / 登録
    </button>
  );
}
