import Link from 'next/link';
import { footerSections } from '@/lib/data/footerSections';
import { getServiceSupabase } from '@/lib/supabase/service';
import { getUserFromSession } from '@/lib/data/session';

function isAdmin(user: Record<string, unknown> | null): boolean {
  if (!user) return false;
  const email = user.email as string | undefined;
  const lineId = user.line_user_id as string | undefined;
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim()).filter(Boolean);
  const adminLineIds = (process.env.ADMIN_LINE_IDS ?? '').split(',').map((e) => e.trim()).filter(Boolean);
  return (!!email && adminEmails.includes(email)) || (!!lineId && adminLineIds.includes(lineId));
}

export async function Footer() {
  const supabase = getServiceSupabase();
  const user = await getUserFromSession(supabase);
  const showAdminLink = isAdmin(user);

  return (
    <footer
      style={{ background: '#03030c', borderTop: '1px solid rgba(201,168,76,0.15)' }}
      className="text-white pt-14 pb-8"
    >
      <div className="max-w-[860px] w-full mx-auto px-6">
        {/* Logo */}
        <div className="flex items-end gap-3 mb-10">
          <span className="text-3xl font-black tracking-wider text-gold">爆ガチャ</span>
          <span className="text-xs font-bold tracking-[0.3em] text-gray-600 mb-1">BAKU GACHA</span>
        </div>

        <div className="divider-gold mb-10" />

        {/* Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {footerSections.map((section) => (
            <div key={section.id}>
              <h3
                className="text-[10px] font-bold tracking-[0.25em] uppercase mb-4"
                style={{ color: '#c9a84c' }}
              >
                {section.title}
              </h3>
              <ul className="flex flex-col gap-2.5">
                {section.links.map((link) => (
                  <li key={link.id}>
                    <Link
                      href={link.href}
                      className="text-xs text-gray-500 hover:text-gray-200 transition-colors tracking-wide"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Admin Link */}
        {showAdminLink && (
          <>
            <div className="divider-gold mb-6" />
            <div className="flex justify-center mb-6">
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold tracking-widest uppercase rounded-md transition-all hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #1a1a3e 0%, #0f0f28 100%)',
                  border: '1px solid rgba(201,168,76,0.3)',
                  color: '#c9a84c',
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                管理者パネル
              </Link>
            </div>
          </>
        )}

        <div className="divider-gold mb-6" />

        <p className="text-[10px] text-center tracking-widest text-gray-600 uppercase">
          © 2024 爆ガチャ — All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
