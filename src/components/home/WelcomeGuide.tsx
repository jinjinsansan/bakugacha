import Link from 'next/link';

const LINE_URL = process.env.NEXT_PUBLIC_LINE_OFFICIAL_URL ?? 'https://lin.ee/AYvfoP6';

const ITEMS = [
  {
    step: '01',
    emoji: '💚',
    title: '公式LINEを追加する',
    description: '爆ガチャ公式LINEを友達追加するだけで300コインプレゼント！まずここからスタート。',
    accent: '#06C755',
    accentBg: 'rgba(6,199,85,0.08)',
    accentBorder: 'rgba(6,199,85,0.25)',
    accentGlow: 'rgba(6,199,85,0.12)',
    cta: { label: 'LINEを追加する →', href: LINE_URL, external: true },
  },
  {
    step: '02',
    emoji: '👥',
    title: '友達を紹介する',
    description: 'マイページの紹介リンクをシェアするだけ。紹介するたびに300コイン、紹介された友達にも100コイン。',
    accent: '#a78bfa',
    accentBg: 'rgba(139,92,246,0.08)',
    accentBorder: 'rgba(139,92,246,0.25)',
    accentGlow: 'rgba(139,92,246,0.12)',
    cta: { label: 'マイページへ →', href: '/mypage', external: false },
  },
  {
    step: '03',
    emoji: '🎟️',
    title: 'プロモコードを入力する',
    description: '特別なプロモーションコードをお持ちの方はマイページで入力するとコインが貰えます。',
    accent: '#c9a84c',
    accentBg: 'rgba(201,168,76,0.08)',
    accentBorder: 'rgba(201,168,76,0.25)',
    accentGlow: 'rgba(201,168,76,0.12)',
    cta: { label: 'コードを入力する →', href: '/mypage', external: false },
  },
] as const;

export function WelcomeGuide() {
  return (
    <section className="max-w-[860px] mx-auto px-3 sm:px-4 mt-1 mb-3">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.3))' }} />
        <span
          className="text-[10px] font-black tracking-[0.3em] uppercase px-3 py-1 rounded-full"
          style={{
            background: 'rgba(201,168,76,0.08)',
            border: '1px solid rgba(201,168,76,0.25)',
            color: '#e8c76a',
          }}
        >
          はじめての方へ
        </span>
        <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(201,168,76,0.3), transparent)' }} />
      </div>

      {/* 3カードグリッド */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {ITEMS.map((item) => (
          <div
            key={item.step}
            className="relative rounded-2xl p-4 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background: item.accentBg,
              border: `1px solid ${item.accentBorder}`,
              boxShadow: `0 4px 24px ${item.accentGlow}`,
            }}
          >
            {/* ステップバッジ */}
            <span
              className="absolute top-3 right-3 text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded"
              style={{
                background: `${item.accent}20`,
                color: item.accent,
                border: `1px solid ${item.accent}40`,
              }}
            >
              STEP {item.step}
            </span>

            {/* アイコン */}
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: `${item.accent}15`, border: `1px solid ${item.accent}30` }}
            >
              {item.emoji}
            </div>

            {/* テキスト */}
            <div className="flex-1">
              <h3
                className="text-sm font-black mb-1.5 leading-snug"
                style={{ color: item.accent }}
              >
                {item.title}
              </h3>
              <p className="text-[11px] text-white/55 leading-relaxed">
                {item.description}
              </p>
            </div>

            {/* CTA */}
            {item.cta.external ? (
              <a
                href={item.cta.href}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold transition-opacity hover:opacity-80"
                style={{ color: item.accent }}
              >
                {item.cta.label}
              </a>
            ) : (
              <Link
                href={item.cta.href}
                className="text-[11px] font-bold transition-opacity hover:opacity-80"
                style={{ color: item.accent }}
              >
                {item.cta.label}
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
