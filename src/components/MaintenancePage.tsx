import Image from 'next/image';

interface MaintenancePageProps {
  title: string;
  message: string;
}

export function MaintenancePage({ title, message }: MaintenancePageProps) {
  const lineUrl = process.env.NEXT_PUBLIC_LINE_OFFICIAL_URL ?? 'https://lin.ee/AYvfoP6';

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between px-5 py-10"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* ── 上部余白 ── */}
      <div className="w-full max-w-md flex-1 flex flex-col items-center justify-center">

        {/* ── ロゴ ── */}
        <div className="mb-8 select-none">
          <Image
            src="/baku_gacha_logo_final.png"
            alt="爆ガチャ"
            width={220}
            height={110}
            priority
            className="drop-shadow-[0_0_24px_rgba(201,168,76,0.35)]"
          />
        </div>

        {/* ── メンテナンスカード ── */}
        <div className="card-premium w-full rounded-2xl p-8 flex flex-col items-center text-center gap-5">
          {/* アイコン (歯車) */}
          <div
            className="relative w-20 h-20 flex items-center justify-center rounded-full"
            style={{
              background: 'linear-gradient(135deg, rgba(201,168,76,0.25), rgba(201,168,76,0.05))',
              border: '1px solid rgba(201,168,76,0.4)',
              boxShadow: '0 0 24px rgba(201,168,76,0.2), inset 0 0 12px rgba(201,168,76,0.15)',
            }}
          >
            <svg
              className="w-10 h-10 animate-spin-slow"
              style={{ color: 'var(--gold-light)', animationDuration: '6s' }}
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94 0 .31.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
            </svg>
          </div>

          {/* バッジ */}
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase"
            style={{
              background: 'rgba(201,168,76,0.12)',
              color: 'var(--gold-light)',
              border: '1px solid rgba(201,168,76,0.35)',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--gold-light)', boxShadow: '0 0 6px var(--gold-light)' }}
            />
            Maintenance
          </span>

          {/* タイトル */}
          <h1 className="text-xl md:text-2xl font-black text-white leading-tight">
            {title}
          </h1>

          {/* 区切り */}
          <div
            className="w-24 h-[1px]"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.6), transparent)',
            }}
          />

          {/* 本文 */}
          <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line">
            {message}
          </p>

          {/* 補足 */}
          <p className="text-xs text-white/40 mt-2">
            最新情報は公式LINEにてお知らせいたします
          </p>
        </div>
      </div>

      {/* ── 下部: 公式 LINE ── */}
      <div className="w-full max-w-md mt-10 flex flex-col items-center gap-3">
        <p className="text-xs text-white/50 tracking-wider">OFFICIAL LINE</p>
        <a
          href={lineUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center justify-center gap-3 w-full px-6 py-4 rounded-2xl font-bold text-white transition-all"
          style={{
            background: 'linear-gradient(135deg, #06C755 0%, #04a548 100%)',
            boxShadow: '0 8px 24px rgba(6, 199, 85, 0.3), inset 0 1px 0 rgba(255,255,255,0.25)',
          }}
        >
          {/* LINE ロゴ (ブランドマーク風) */}
          <svg
            className="w-7 h-7 shrink-0"
            viewBox="0 0 320 320"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M160 0C71.6 0 0 58 0 129.6c0 64.2 56.8 118 133.5 128.2 5.2 1.1 12.3 3.4 14.1 7.9 1.6 4 1 10.3.5 14.4 0 0-1.9 11.3-2.3 13.7-0.7 4-3.2 15.8 13.9 8.6 17-7.2 92-54.2 125.6-92.8 23.2-25.4 34.3-51.2 34.3-80C319.6 58 248 0 160 0zM99.6 172.7h-31.8c-2.9 0-5.3-2.4-5.3-5.3v-63.7c0-2.9 2.4-5.3 5.3-5.3s5.3 2.4 5.3 5.3v58.4h26.5c2.9 0 5.3 2.4 5.3 5.3s-2.4 5.3-5.3 5.3zm16.8-5.3c0 2.9-2.4 5.3-5.3 5.3s-5.3-2.4-5.3-5.3v-63.7c0-2.9 2.4-5.3 5.3-5.3s5.3 2.4 5.3 5.3v63.7zm75.7 0c0 2.3-1.5 4.3-3.6 5-0.6 0.2-1.1 0.3-1.7 0.3-1.7 0-3.2-0.7-4.2-2l-32.6-44.4v41c0 2.9-2.4 5.3-5.3 5.3s-5.3-2.4-5.3-5.3v-63.7c0-2.3 1.5-4.3 3.6-5 0.5-0.2 1.1-0.3 1.7-0.3 1.7 0 3.3 0.9 4.2 2.1l32.6 44.4v-41c0-2.9 2.4-5.3 5.3-5.3s5.3 2.4 5.3 5.3v63.6zm50.9-37.2c2.9 0 5.3 2.4 5.3 5.3s-2.4 5.3-5.3 5.3h-26.5v17h26.5c2.9 0 5.3 2.4 5.3 5.3s-2.4 5.3-5.3 5.3h-31.8c-2.9 0-5.3-2.4-5.3-5.3v-31.8c0-2.9 2.4-5.3 5.3-5.3h31.8c2.9 0 5.3 2.4 5.3 5.3s-2.4 5.3-5.3 5.3h-26.5v11.6h26.5z" />
          </svg>
          <span className="text-base tracking-wide">友だち追加はこちら</span>
        </a>

        <p className="text-[11px] text-white/30 mt-2">
          © 爆ガチャ
        </p>
      </div>
    </div>
  );
}
