import Link from 'next/link';
import { footerSections } from '@/lib/data/footerSections';

export function Footer() {
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

        <div className="divider-gold mb-6" />

        <p className="text-[10px] text-center tracking-widest text-gray-600 uppercase">
          © 2024 爆ガチャ — All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
