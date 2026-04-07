export function LotteryGuide() {
  return (
    <section className="px-4 pb-8">
      {/* 外枠：ゴールドグラデーションボーダー */}
      <div
        className="relative rounded-2xl overflow-hidden p-px"
        style={{
          background: 'linear-gradient(135deg, rgba(201,168,76,0.8), rgba(255,220,100,0.3), rgba(201,168,76,0.6))',
          boxShadow: '0 0 40px rgba(201,168,76,0.2), 0 4px 32px rgba(0,0,0,0.6)',
        }}
      >
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #0d0b00, #0a0800, #07070f)' }}
        >
          {/* ヘッダー：キャンペーンタイトル */}
          <div
            className="relative px-5 pt-6 pb-5 text-center overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, rgba(201,168,76,0.12) 0%, transparent 100%)',
              borderBottom: '1px solid rgba(201,168,76,0.2)',
            }}
          >
            {/* 背景グロー */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-24 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse, rgba(201,168,76,0.15) 0%, transparent 70%)',
                filter: 'blur(20px)',
              }}
            />
            <p className="relative text-[10px] tracking-[0.4em] text-yellow-500/80 uppercase font-bold mb-2">
              🏇 Special Campaign
            </p>
            <h2
              className="relative text-2xl sm:text-3xl font-black text-white mb-1 leading-tight"
              style={{
                textShadow: '0 0 30px rgba(201,168,76,0.5), 0 2px 8px rgba(0,0,0,0.8)',
              }}
            >
              <span style={{ color: '#e8c76a' }}>クロワデュノール</span>
              <br className="sm:hidden" />
              <span className="text-white">当選企画！</span>
            </h2>
            <p className="relative text-xs text-white/50 mt-2 leading-relaxed">
              競馬インフルエンサーが競馬予想で当てた賞金を<br />
              <span className="text-yellow-400/80 font-bold">Amazonギフト券</span>でみんなにプレゼント！
            </p>
          </div>

          <div className="px-4 sm:px-6 py-5 flex flex-col gap-5">
            {/* 賞金額：目立つバッジ */}
            <div className="flex justify-center">
              <div
                className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(201,168,76,0.18), rgba(201,168,76,0.06))',
                  border: '1px solid rgba(201,168,76,0.5)',
                  boxShadow: '0 0 20px rgba(201,168,76,0.15)',
                }}
              >
                <span className="text-2xl">🎁</span>
                <div className="text-left">
                  <p className="text-[10px] text-yellow-500/70 font-bold tracking-widest uppercase">Prize</p>
                  <p className="text-xl font-black" style={{ color: '#e8c76a' }}>
                    Amazon<span className="text-white">ギフト券</span>
                    <span className="text-2xl ml-1">1万円</span>
                  </p>
                </div>
              </div>
            </div>

            {/* チャンスの増やし方 */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px" style={{ background: 'rgba(201,168,76,0.2)' }} />
                <p className="text-[10px] font-black tracking-[0.25em] uppercase whitespace-nowrap" style={{ color: '#c9a84c' }}>
                  チャンスの増やし方
                </p>
                <div className="flex-1 h-px" style={{ background: 'rgba(201,168,76,0.2)' }} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: '📝', title: '新規登録', desc: '登録で1口' },
                  { icon: '👥', title: '友達招待', desc: '1人で+1口' },
                  { icon: '🏇', title: 'netkeita登録', desc: '登録で+1口', link: 'https://www.netkeita.com/' },
                ].map(({ icon, title, desc, link }) => (
                  <div
                    key={title}
                    className="rounded-xl p-3 text-center flex flex-col items-center gap-1"
                    style={{
                      background: 'rgba(201,168,76,0.05)',
                      border: '1px solid rgba(201,168,76,0.18)',
                    }}
                  >
                    <span className="text-xl">{icon}</span>
                    <p className="text-[11px] font-black text-white leading-tight">
                      {link ? (
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline underline-offset-2"
                          style={{ color: '#e8c76a' }}
                        >
                          {title}
                        </a>
                      ) : title}
                    </p>
                    <p className="text-[10px] font-bold" style={{ color: '#c9a84c' }}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 抽選フロー */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px" style={{ background: 'rgba(201,168,76,0.2)' }} />
                <p className="text-[10px] font-black tracking-[0.25em] uppercase whitespace-nowrap" style={{ color: '#c9a84c' }}>
                  抽選の流れ
                </p>
                <div className="flex-1 h-px" style={{ background: 'rgba(201,168,76,0.2)' }} />
              </div>
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <div
                  className="flex-1 rounded-xl px-4 py-3"
                  style={{
                    background: 'linear-gradient(135deg, rgba(201,168,76,0.1), rgba(201,168,76,0.03))',
                    border: '1px solid rgba(201,168,76,0.3)',
                  }}
                >
                  <p className="text-[10px] font-black tracking-widest mb-1" style={{ color: '#c9a84c' }}>STEP 1</p>
                  <p className="text-sm font-black text-white">1次抽選</p>
                  <p className="text-[11px] text-white/50 mt-1">
                    集めた口数でガチャを引く。当選すると2次抽選への権利コードをGET。
                  </p>
                </div>
                <div className="flex items-center justify-center font-black text-lg py-1" style={{ color: '#c9a84c' }}>
                  →
                </div>
                <div
                  className="flex-1 rounded-xl px-4 py-3"
                  style={{
                    background: 'linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))',
                    border: '1px solid rgba(201,168,76,0.5)',
                    boxShadow: '0 0 16px rgba(201,168,76,0.1)',
                  }}
                >
                  <p className="text-[10px] font-black tracking-widest mb-1" style={{ color: '#e8c76a' }}>STEP 2</p>
                  <p className="text-sm font-black text-white">2次抽選</p>
                  <p className="text-[11px] text-white/50 mt-1">
                    権利コードで2次専用ガチャへ。当たれば
                    <span className="font-black" style={{ color: '#e8c76a' }}>Amazonギフト券1万円</span>、
                    外れれば0円。
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-white/30 text-center mt-3">
                ※ 登録早い順ではありません。公平な抽選で全員に平等なチャンスがあります
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
