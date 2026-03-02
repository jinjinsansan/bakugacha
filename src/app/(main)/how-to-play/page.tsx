export default function HowToPlayPage() {
  const steps = [
    { num: '01', title: 'アカウント登録', desc: 'LINEアカウントでログインするだけ。面倒な入力は不要です。' },
    { num: '02', title: 'コインを入手', desc: '新規登録ボーナスや友達紹介でコインをGET。コイン購入も可能です。' },
    { num: '03', title: 'ガチャを選ぶ', desc: 'ポケモン・ワンピース・遊戯王など、お好みのガチャを選択。' },
    { num: '04', title: 'ガチャを引く！', desc: '「ガチャを引く」ボタンを押すとカウントダウン演出がスタート！' },
    { num: '05', title: '結果発表', desc: '演出が終わると当選・落選が確定。当選した場合は事務局よりご連絡いたします。' },
  ];

  return (
    <main className="max-w-[860px] mx-auto px-4 py-10">
      <h1 className="text-2xl font-black text-white mb-8">遊び方</h1>
      <div className="flex flex-col gap-4">
        {steps.map((step) => (
          <div key={step.num} className="card-premium p-5 flex gap-4 items-start">
            <span className="text-2xl font-black text-gold shrink-0">{step.num}</span>
            <div>
              <h2 className="text-base font-bold text-white mb-1">{step.title}</h2>
              <p className="text-sm text-white/60">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
