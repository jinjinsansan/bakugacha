import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';
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
    <div style={{ background: '#0a0613', minHeight: '100vh' }}>
      {settings.maintenanceMode && isAdmin && (
        <div
          className="sticky top-0 z-[60] text-center text-xs font-bold py-2 px-4"
          style={{
            background: 'linear-gradient(90deg, #ffcb45, #ffe08a, #ffcb45)',
            color: '#3a2a06',
            borderBottom: '1px solid rgba(0,0,0,0.25)',
          }}
        >
          ⚠️ 現在メンテナンスモードが有効です (管理者のみ閲覧可能)
        </div>
      )}
      <div className="sticky top-0 z-50">
        <Header />
      </div>
      <main>{children}</main>
      <Footer />
      <BottomNav />
    </div>
  );
}
