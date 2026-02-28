import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: '#05050f' }}
    >
      {/* ゴールドグロー */}
      <div
        className="fixed top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full pointer-events-none opacity-10"
        style={{
          background: 'radial-gradient(circle, rgba(201,168,76,0.5) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      <div className="relative w-full max-w-md">
        {/* ロゴ */}
        <Link href="/" className="flex flex-col items-center mb-10">
          <span className="text-4xl font-black tracking-wider text-gold">爆ガチャ</span>
          <span className="text-[10px] font-bold tracking-[0.35em] text-gray-600 mt-1">BAKU GACHA</span>
        </Link>

        {/* カード */}
        <div
          className="rounded-3xl p-8"
          style={{
            background: '#0a0a1c',
            border: '1px solid rgba(201,168,76,0.2)',
            boxShadow: '0 24px 48px rgba(0,0,0,0.6)',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
