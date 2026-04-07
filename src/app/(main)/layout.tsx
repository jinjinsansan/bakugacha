import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MaintenancePage } from '@/components/MaintenancePage';
import { fetchCachedAppSettings } from '@/lib/data/app-settings';
import { isCurrentUserAdmin } from '@/lib/auth/admin';

export const dynamic = 'force-dynamic';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, isAdmin] = await Promise.all([
    fetchCachedAppSettings(),
    isCurrentUserAdmin(),
  ]);

  // メンテナンスモード中は管理者以外はメンテナンスページを表示
  if (settings.maintenanceMode && !isAdmin) {
    return (
      <MaintenancePage
        title={settings.maintenanceTitle}
        message={settings.maintenanceMessage}
      />
    );
  }

  return (
    <div style={{ background: '#05050f', minHeight: '100vh' }}>
      {settings.maintenanceMode && isAdmin && (
        <div
          className="sticky top-0 z-[60] text-center text-xs font-bold py-2 px-4"
          style={{
            background: 'linear-gradient(90deg, #c9a84c, #e8cc7a, #c9a84c)',
            color: '#1a1408',
            borderBottom: '1px solid rgba(0,0,0,0.25)',
          }}
        >
          ⚠️ 現在メンテナンスモードが有効です (管理者のみ閲覧可能)
        </div>
      )}
      {/* 告知バー + ヘッダーを一つの sticky コンテナに統合して重なりを防ぐ */}
      <div className="sticky top-0 z-50">
        <div
          className="text-center text-xs font-bold py-2 px-4 overflow-hidden"
          style={{
            background: 'linear-gradient(90deg, #1a0533, #2d0a5e, #1a0533)',
            borderBottom: '1px solid rgba(139,92,246,0.4)',
          }}
        >
          <span className="text-white/90">🎯 1次抽選開催中</span>
          <span className="mx-2 text-white/30">|</span>
          <span className="text-violet-300">当選者のみ 2次抽選（賞金1万円）へ進めます</span>
          <span className="mx-2 text-white/30">|</span>
          <span className="text-white/70">友達紹介・</span>
          <a
            href="https://www.netkeita.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-yellow-400 underline underline-offset-2 hover:text-yellow-300"
          >
            netkeita
          </a>
          <span className="text-white/70">登録でチャンス増加</span>
        </div>
        <Header />
      </div>
      <main>{children}</main>
      <Footer />
    </div>
  );
}
