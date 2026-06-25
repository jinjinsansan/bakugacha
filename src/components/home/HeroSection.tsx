import Link from 'next/link';

// 事実ベースの信頼インジケーター（架空の実績値は使わない）
const TRUST = [
  { label: '確率・在庫を公開', accent: '#7df0ff' },
  { label: 'SSL安全決済', accent: '#ff6ec0' },
  { label: '20歳以上対象', accent: '#ffcb45' },
] as const;

export function HeroSection() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        background:
          'radial-gradient(100% 70% at 20% 0%, rgba(255,61,166,0.22), transparent 60%), radial-gradient(90% 70% at 100% 30%, rgba(34,211,238,0.18), transparent 55%), #0a0613',
      }}
    >
      <div className="divider-gold absolute top-0 left-0 right-0" />

      <div className="relative max-w-[860px] mx-auto px-5 py-12 md:px-6 md:py-20">
        <div className="max-w-xl">
          {/* プレリリースバッジ */}
          <div className="mb-4">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-[0.16em]"
              style={{ background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.45)', color: '#7df0ff' }}
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: '#22d3ee', boxShadow: '0 0 8px #22d3ee' }} />
              PRE-RELEASE β
            </span>
          </div>

          {/* エイブロウ */}
          <p
            className="text-[10px] font-black tracking-[0.3em] mb-3"
            style={{ fontFamily: "'Outfit', sans-serif", color: '#ff6ec0' }}
          >
            PREMIUM GACHA EXPERIENCE
          </p>

          {/* 見出し */}
          <h1
            className="text-4xl md:text-5xl font-black leading-[1.16] mb-4 text-white"
            style={{ letterSpacing: '-0.01em', textShadow: '0 0 30px rgba(255,61,166,0.3)' }}
          >
            最高の<span className="text-neon">ガチャ</span>体験を、<br />あなたに。
          </h1>

          {/* 本文 */}
          <p className="mb-7 text-sm leading-loose" style={{ color: '#a99fc4' }}>
            ポケモン・ワンピース・遊戯王・任天堂スイッチ・Amazonギフト券。<br className="hidden md:block" />
            引くたびに沸き立つ演出。当たりはそのまま発送、確率も在庫もすべて公開。
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 mb-7">
            <Link href="/#products" className="w-full sm:flex-1">
              <button className="btn-gold w-full px-8 py-4 rounded-2xl text-sm font-black shadow-xl">
                今すぐガチャを引く
              </button>
            </Link>
            <Link href="/#products" className="w-full sm:w-auto">
              <button className="btn-outline w-full px-8 py-4 rounded-2xl text-sm font-bold">
                ガチャ一覧を見る
              </button>
            </Link>
          </div>

          {/* 信頼インジケーター */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 pt-5" style={{ borderTop: '1px solid rgba(255,61,166,0.14)' }}>
            {TRUST.map((t) => (
              <div key={t.label} className="flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: t.accent }} />
                <span className="text-[11px] font-bold" style={{ color: '#b6abd0' }}>{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="divider-gold absolute bottom-0 left-0 right-0" />
    </section>
  );
}
