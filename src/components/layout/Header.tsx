import Link from 'next/link';

export function Header() {
  return (
    <header
      className="sticky z-50 top-0"
      style={{
        background: 'linear-gradient(180deg, #07071a 0%, #050514 100%)',
        borderBottom: '1px solid rgba(201,168,76,0.2)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
      }}
    >
      <div className="flex items-center justify-between max-w-[860px] w-full mx-auto px-6 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-black tracking-wider text-gold">爆ガチャ</span>
          <span className="text-[10px] font-bold tracking-[0.2em] text-gray-500 mt-1">BAKU GACHA</span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-bold tracking-widest text-gray-400 uppercase">
          <Link href="/gacha" className="hover:text-white transition-colors">ガチャ一覧</Link>
          <Link href="/ranking" className="hover:text-white transition-colors">ランキング</Link>
          <Link href="/winners" className="hover:text-white transition-colors">当選情報</Link>
        </nav>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <Link href="/register">
            <button className="btn-gold text-xs px-5 py-2 rounded-full">
              新規登録
            </button>
          </Link>
          <Link href="/login">
            <button className="btn-silver text-xs px-5 py-2 rounded-full">
              ログイン
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}
