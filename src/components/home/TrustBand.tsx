const ITEMS = [
  { title: '確率明記', desc: '在庫もリアルタイムで公開', accent: '#ff72bf' },
  { title: '安全決済', desc: 'SSL暗号化 / 特商法に基づく表記', accent: '#8fe8ff' },
  { title: 'サポート', desc: '公式LINEでいつでも相談', accent: '#f0d68a' },
] as const;

export function TrustBand() {
  return (
    <section
      className="px-4 py-6"
      style={{ background: 'linear-gradient(180deg, rgba(255,46,154,0.06), transparent)' }}
      aria-label="安心してご利用いただくために"
    >
      <div className="max-w-[860px] w-full mx-auto grid grid-cols-3 gap-2.5 sm:gap-3">
        {ITEMS.map((it) => (
          <div
            key={it.title}
            className="text-center rounded-xl px-2 py-3.5"
            style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="text-[11px] sm:text-xs font-black" style={{ color: it.accent }}>
              {it.title}
            </div>
            <div className="text-[9px] sm:text-[10px] mt-1.5 leading-snug" style={{ color: '#7c84a3' }}>
              {it.desc}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
