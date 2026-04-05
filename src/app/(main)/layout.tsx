import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MaintenancePage } from '@/components/MaintenancePage';
import { getServiceSupabase } from '@/lib/supabase/service';
import { fetchAppSettings } from '@/lib/data/app-settings';
import { isCurrentUserAdmin } from '@/lib/auth/admin';

export const dynamic = 'force-dynamic';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = getServiceSupabase();
  const [settings, isAdmin] = await Promise.all([
    fetchAppSettings(supabase),
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
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
