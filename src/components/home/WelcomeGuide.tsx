import Link from 'next/link';
import { BRAND } from '@/lib/brand';

const LINE_URL = process.env.NEXT_PUBLIC_LINE_OFFICIAL_URL ?? 'https://lin.ee/tk6qrdP';

const ITEMS = [
  {
    step: '01',
    title: '公式LINEを追加する',
    description: `${BRAND.name}公式LINEを友達追加するだけで300コインプレゼント！まずここからスタート。`,
    accent: '#06C755',
    accentBg: 'rgba(6,199,85,0.08)',
    accentBorder: 'rgba(6,199,85,0.25)',
    accentGlow: 'rgba(6,199,85,0.12)',
    cta: { label: 'LINEを追加する →', href: LINE_URL, external: true },
  },
  {
    step: '02',
    title: '友達を紹介する',
    description: 'マイページの紹介リンクをシェアするだけ。紹介するたびに300コイン、紹介された友達にも100コイン。',
    accent: '#38d2ff',
    accentBg: 'rgba(56,210,255,0.08)',
    accentBorder: 'rgba(56,210,255,0.25)',
    accentGlow: 'rgba(56,210,255,0.12)',
    cta: { label: 'マイページへ →', href: '/mypage', external: false },
  },
  {
    step: '03',
    title: 'プロモコードを入力する',
    description: '特別なプロモーションコードをお持ちの方はマイページで入力するとコインが貰えます。',
    accent: '#d8b15a',
    accentBg: 'rgba(216,177,90,0.08)',
    accentBorder: 'rgba(216,177,90,0.25)',
    accentGlow: 'rgba(216,177,90,0.12)',
    cta: { label: 'コードを入力する →', href: '/mypage', external: false },
  },
] as const;

export function WelcomeGuide() {
  return (
    <section className="max-w-[860px] mx-auto px-3 sm:px-4 mt-2 mb-4">
      {/* 見出し（明朝） */}
      <div className="mb-5 px-1">
        <h2 className="headline-serif text-xl">はじめての方へ</h2>
        <div className="rule-diamond mt-2">
          <span className="font-en text-[9px] font-bold tracking-[0.3em]" style={{ color: 'var(--gold)' }}>
            HOW TO START
          </span>
        </div>
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
            {/* 番号バッジ */}
            <div
              className="font-en w-11 h-11 rounded-xl flex items-center justify-center text-xl font-black"
              style={{ background: `${item.accent}15`, border: `1px solid ${item.accent}30`, color: item.accent }}
            >
              {item.step.replace(/^0/, '')}
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
