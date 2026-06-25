import Link from 'next/link';

// 事実ベースの信頼インジケーター（架空の実績値は使わない）
const TRUST = [
  { label: '確率・在庫を公開', accent: '#8fe8ff' },
  { label: 'SSL安全決済', accent: '#ff72bf' },
  { label: '20歳以上対象', accent: '#f0d68a' },
] as const;

export function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden" style={{ background: '#06070f' }}>

      {/* ===== PC（md+）: タグライン焼き込みのキービジュアルをそのまま使い、CTAを左下に重ねる ===== */}
      <div className="relative hidden md:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hero-bg.webp" alt="" aria-hidden="true" className="block w-full h-auto" />
        <div className="absolute inset-0">
          <div className="mx-auto flex h-full max-w-[1100px] items-end px-10 pb-12">
            <Link href="/#products">
              <button className="btn-gold px-9 py-4 rounded-2xl text-sm font-black shadow-xl">
                今すぐガチャを引く
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* ===== モバイル: 文字なし画像＋下スクリム＋明朝見出し＋CTA ===== */}
      <div className="relative md:hidden">
        <div className="relative w-full" style={{ aspectRatio: '3 / 4', maxHeight: '72vh' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero-bg-mobile.webp"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: 'center top' }}
          />
          <div className="hero-scrim-bottom" />
          <div className="absolute inset-x-0 bottom-0 px-5 pb-7">
            <p
              className="font-en mb-3 text-[10px] font-black tracking-[0.3em]"
              style={{ color: 'var(--magenta-light)' }}
            >
              PREMIUM GACHA EXPERIENCE
            </p>
            <h1 className="headline-serif mb-5 text-2xl">
              最高の<span className="text-gold">ガチャ</span>体験を、あなたに。
            </h1>
            <Link href="/#products">
              <button className="btn-gold w-full px-8 py-4 rounded-2xl text-sm font-black shadow-xl">
                今すぐガチャを引く
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* ===== Hero 下: 信頼インジケーター＋プレリリース注記（共通） ===== */}
      <div className="relative" style={{ background: '#06070f' }}>
        <div
          className="mx-auto flex max-w-[860px] flex-wrap justify-center gap-x-6 gap-y-2 px-5 py-4 md:justify-start"
          style={{ borderTop: '1px solid rgba(255,46,154,0.14)' }}
        >
          {TRUST.map((t) => (
            <div key={t.label} className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: t.accent }} />
              <span className="text-[11px] font-bold" style={{ color: '#a6aecb' }}>{t.label}</span>
            </div>
          ))}
        </div>
        <p className="mx-auto max-w-[860px] px-5 pb-4 text-[11px] leading-relaxed" style={{ color: '#7c84a3' }}>
          ⚠ 現在プレリリース版として公開中です。機能追加・改善のため予告なくメンテナンスを行う場合があります。
        </p>
      </div>

      <div className="divider-gold absolute bottom-0 left-0 right-0" />
    </section>
  );
}
