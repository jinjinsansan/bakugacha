import Link from 'next/link';
import { BRAND } from '@/lib/brand';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: '#0a0613' }}
    >
      {/* ネオングロー */}
      <div
        className="fixed top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full pointer-events-none opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(255,61,166,0.4) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      <div className="relative w-full max-w-md">
        {/* ロゴ */}
        <Link href="/" className="flex flex-col items-center mb-10">
          <span className="text-4xl font-black tracking-wider text-gold">{BRAND.name}</span>
          <span className="text-[10px] font-bold tracking-[0.35em] text-gray-600 mt-1">{BRAND.nameEn}</span>
        </Link>

        {/* カード */}
        <div
          className="rounded-3xl p-8"
          style={{
            background: '#160e26',
            border: '1px solid rgba(255,61,166,0.18)',
            boxShadow: '0 24px 48px rgba(20,0,40,0.6)',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
