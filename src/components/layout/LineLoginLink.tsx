'use client';

export function LineLoginLink({
  liffId,
  fallbackHref,
}: {
  liffId: string;
  fallbackHref: string;
}) {
  const handleClick = () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (liffId && isMobile) {
      // line:// URL Scheme → ブラウザ種別に関係なくLINEアプリを起動
      let appOpened = false;
      const onVisibility = () => { if (document.hidden) appOpened = true; };
      document.addEventListener('visibilitychange', onVisibility, { once: true });

      window.location.href = `line://app/${liffId}`;

      // LINEが未インストールの場合は2秒後にフォールバック
      setTimeout(() => {
        document.removeEventListener('visibilitychange', onVisibility);
        if (!appOpened) {
          window.location.href = `https://liff.line.me/${liffId}`;
        }
      }, 2000);
    } else {
      window.location.href = fallbackHref;
    }
  };

  return (
    <button
      onClick={handleClick}
      className="text-xs px-5 py-2 rounded-full font-black text-white transition hover:opacity-90"
      style={{
        background: 'linear-gradient(135deg, #06c755, #00a64f)',
        boxShadow: '0 2px 12px rgba(6,199,85,0.3)',
      }}
    >
      ログイン / 登録
    </button>
  );
}
