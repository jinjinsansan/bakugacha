import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden" style={{ minHeight: '420px' }}>
      {/* 背景 */}
      <div className="absolute inset-0 bg-[#050510]" />

      {/* ゴールドグロー */}
      <div
        className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full pointer-events-none opacity-20"
        style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.4) 0%, transparent 70%)', filter: 'blur(60px)' }}
      />

      <div className="divider-gold absolute top-0 left-0 right-0" />

      <div className="relative max-w-[860px] mx-auto px-4 py-10 md:px-6 md:py-24">
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">

          {/* モバイル: ロゴを先に表示 */}
          <div className="flex-shrink-0 md:order-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/baku_gacha_logo.gif"
              alt="爆ガチャ"
              className="w-[240px] h-[240px] md:w-[280px] md:h-[280px] object-contain drop-shadow-[0_0_40px_rgba(201,168,76,0.4)]"
            />
          </div>

          {/* テキスト */}
          <div className="flex-1 text-center md:text-left md:order-1">
            <p className="text-[10px] font-bold tracking-[0.4em] text-gold uppercase mb-4">
              Premium Gacha Experience
            </p>
            <h1
              className="text-5xl md:text-6xl font-black leading-[1.1] mb-5 text-white"
              style={{ letterSpacing: '-0.01em', textShadow: '0 4px 24px rgba(0,0,0,0.8)' }}
            >
              最高の<br />
              <span className="text-gold">ガチャ</span>体験を<br />
              あなたに。
            </h1>
            <p className="text-gray-400 mb-8 text-sm leading-loose tracking-wide">
              ポケモン・ワンピース・遊戯王・任天堂スイッチ・Amazonギフト券<br className="hidden md:block" />
              厳選されたガチャがここに集結。今すぐレアをGETしよう。
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Link href="/gacha">
                <button className="btn-gold px-8 py-3.5 rounded-full text-sm font-bold w-full sm:w-auto">
                  🎰 今すぐガチャを引く
                </button>
              </Link>
              <Link href="/gacha">
                <button className="btn-silver px-8 py-3.5 rounded-full text-sm font-bold w-full sm:w-auto">
                  ガチャ一覧を見る →
                </button>
              </Link>
            </div>
          </div>

        </div>
      </div>

      <div className="divider-gold absolute bottom-0 left-0 right-0" />
    </section>
  );
}
