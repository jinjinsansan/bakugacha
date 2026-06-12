'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error('[global error]', error);

  return (
    <html lang="ja">
      <body style={{ margin: 0, background: '#050514', fontFamily: 'sans-serif' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 20px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 56, margin: '0 0 16px' }}>⚠️</p>
          <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 900, margin: '0 0 8px' }}>
            エラーが発生しました
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: '0 0 32px' }}>
            申し訳ございません。しばらくしてからもう一度お試しください。
          </p>
          <button
            onClick={reset}
            style={{
              borderRadius: 9999,
              background: '#eab308',
              color: '#000',
              fontWeight: 700,
              fontSize: 14,
              padding: '12px 32px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            再試行
          </button>
        </div>
      </body>
    </html>
  );
}
