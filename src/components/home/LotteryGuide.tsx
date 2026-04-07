export function LotteryGuide() {
  return (
    <section className="px-4 pb-6">
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(109,40,217,0.15), rgba(30,10,60,0.8))',
          border: '1px solid rgba(139,92,246,0.35)',
        }}
      >
        {/* ヘッダー */}
        <div
          className="px-5 py-4"
          style={{
            background: 'linear-gradient(90deg, rgba(109,40,217,0.5), rgba(76,29,149,0.3))',
            borderBottom: '1px solid rgba(139,92,246,0.25)',
          }}
        >
          <p className="text-[10px] tracking-[0.3em] text-violet-400 uppercase mb-1">Campaign</p>
          <h2 className="text-base font-black text-white">🏆 抽選キャンペーン開催中！</h2>
          <p className="text-xs text-white/60 mt-1">
            登録早い順ではありません。1次・2次の公平な抽選で賞金1万円をかけたガチャに挑戦できます。
          </p>
        </div>

        <div className="px-5 py-5 flex flex-col gap-5">
          {/* チャンスの増やし方 */}
          <div>
            <p className="text-[11px] font-black text-violet-400 tracking-widest uppercase mb-3">
              チャンスの増やし方
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                className="rounded-xl px-4 py-3 flex items-start gap-3"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <span className="text-2xl mt-0.5">📝</span>
                <div>
                  <p className="text-xs font-black text-white">新規登録</p>
                  <p className="text-[11px] text-white/50 mt-0.5">登録するだけで1口もらえます</p>
                </div>
              </div>
              <div
                className="rounded-xl px-4 py-3 flex items-start gap-3"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <span className="text-2xl mt-0.5">👥</span>
                <div>
                  <p className="text-xs font-black text-white">友達を招待</p>
                  <p className="text-[11px] text-white/50 mt-0.5">1人招待するごとに+1口</p>
                </div>
              </div>
              <div
                className="rounded-xl px-4 py-3 flex items-start gap-3"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <span className="text-2xl mt-0.5">🏇</span>
                <div>
                  <p className="text-xs font-black text-white">
                    <a
                      href="https://www.netkeita.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-yellow-400 underline underline-offset-2 hover:text-yellow-300"
                    >
                      netkeita
                    </a>
                    {' '}に登録
                  </p>
                  <p className="text-[11px] text-white/50 mt-0.5">登録するだけで+1口</p>
                </div>
              </div>
            </div>
          </div>

          {/* 抽選の流れ */}
          <div>
            <p className="text-[11px] font-black text-violet-400 tracking-widest uppercase mb-3">
              抽選の流れ
            </p>
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              {/* STEP 1 */}
              <div
                className="flex-1 rounded-xl px-4 py-3"
                style={{
                  background: 'linear-gradient(135deg, rgba(109,40,217,0.3), rgba(76,29,149,0.2))',
                  border: '1px solid rgba(139,92,246,0.4)',
                }}
              >
                <p className="text-[10px] font-black text-violet-400 tracking-widest mb-1">STEP 1</p>
                <p className="text-sm font-black text-white">1次抽選</p>
                <p className="text-[11px] text-white/50 mt-1">
                  集めた口数でガチャを引く。当選すると2次抽選への権利コードをGET。
                </p>
              </div>

              {/* 矢印 */}
              <div className="flex items-center justify-center text-violet-400 font-black text-lg sm:rotate-0 rotate-90 py-1">
                →
              </div>

              {/* STEP 2 */}
              <div
                className="flex-1 rounded-xl px-4 py-3"
                style={{
                  background: 'linear-gradient(135deg, rgba(202,138,4,0.2), rgba(161,98,7,0.1))',
                  border: '1px solid rgba(234,179,8,0.4)',
                }}
              >
                <p className="text-[10px] font-black text-yellow-500 tracking-widest mb-1">STEP 2</p>
                <p className="text-sm font-black text-white">2次抽選</p>
                <p className="text-[11px] text-white/50 mt-1">
                  権利コードで2次専用ガチャへ。当たれば賞金<span className="text-yellow-400 font-black">1万円</span>、外れれば0円。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
