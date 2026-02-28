import Link from 'next/link';

const heroImages = [
  'https://picsum.photos/seed/hero-cards1/900/600',
  'https://picsum.photos/seed/hero-game1/900/600',
  'https://picsum.photos/seed/hero-gift1/900/600',
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden" style={{ minHeight: '480px' }}>
      {/* 背景フルスクリーン写真 */}
      <img
        src="https://picsum.photos/seed/hero-bg-dark/1400/600"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: 'brightness(0.25) saturate(0.6)' }}
      />
      {/* 暗いオーバーレイ */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, rgba(5,5,15,0.92) 0%, rgba(5,5,20,0.75) 50%, rgba(5,5,15,0.6) 100%)' }}
      />

      {/* ゴールドグロー */}
      <div
        className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full pointer-events-none opacity-20"
        style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.4) 0%, transparent 70%)', filter: 'blur(60px)' }}
      />

      <div className="divider-gold absolute top-0 left-0 right-0" />

      <div className="relative max-w-[860px] mx-auto px-6 py-16 md:py-24">
        <div className="flex flex-col md:flex-row items-center gap-10">

          {/* テキスト */}
          <div className="flex-1 text-center md:text-left">
            <p className="text-[10px] font-bold tracking-[0.4em] text-gold uppercase mb-5">
              Premium Gacha Experience
            </p>
            <h1
              className="text-4xl md:text-6xl font-black leading-[1.15] mb-6 text-white"
              style={{ letterSpacing: '-0.01em', textShadow: '0 4px 24px rgba(0,0,0,0.8)' }}
            >
              最高の<br />
              <span className="text-gold">ガチャ</span>体験を<br />
              あなたに。
            </h1>
            <p className="text-gray-400 mb-10 text-sm leading-loose tracking-wide">
              ポケモン・ワンピース・遊戯王・任天堂スイッチ・Amazonギフト券<br className="hidden md:block" />
              厳選されたガチャがここに集結。今すぐレアをGETしよう。
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Link href="/gacha">
                <button className="btn-gold px-8 py-3 rounded-full text-sm">
                  🎰 今すぐガチャを引く
                </button>
              </Link>
              <Link href="/gacha">
                <button className="btn-silver px-8 py-3 rounded-full text-sm">
                  ガチャ一覧を見る →
                </button>
              </Link>
            </div>
          </div>

          {/* 右側：フローティング画像カード */}
          <div className="flex-shrink-0 flex flex-col gap-3">
            {/* メイン画像 */}
            <div
              className="relative rounded-2xl overflow-hidden shadow-2xl"
              style={{ width: '220px', height: '150px', border: '1px solid rgba(201,168,76,0.3)' }}
            >
              <img src={heroImages[0]} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.15), transparent)' }} />
              <span className="absolute bottom-2 left-3 text-xs font-bold text-gold tracking-wider">🎴 カードガチャ</span>
            </div>
            {/* サブ画像 2枚横並び */}
            <div className="flex gap-3">
              <div
                className="relative rounded-xl overflow-hidden shadow-xl"
                style={{ width: '105px', height: '80px', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <img src={heroImages[1]} alt="" className="w-full h-full object-cover" />
                <span className="absolute bottom-1 left-2 text-[9px] font-bold text-white/80">🕹️ ゲーム機</span>
              </div>
              <div
                className="relative rounded-xl overflow-hidden shadow-xl"
                style={{ width: '105px', height: '80px', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <img src={heroImages[2]} alt="" className="w-full h-full object-cover" />
                <span className="absolute bottom-1 left-2 text-[9px] font-bold text-white/80">🎁 ギフト券</span>
              </div>
            </div>
            {/* スタッツ */}
            <div className="flex gap-2">
              {[
                { value: '1,200+', label: 'ガチャ数' },
                { value: '50万人+', label: '会員数' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex-1 text-center px-3 py-2 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.15)' }}
                >
                  <p className="text-sm font-black text-white">{s.value}</p>
                  <p className="text-[9px] tracking-widest text-gray-500 uppercase">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      <div className="divider-gold absolute bottom-0 left-0 right-0" />
    </section>
  );
}
