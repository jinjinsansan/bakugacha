import Link from 'next/link';
import { newsItems } from '@/lib/data/newsItems';

export function NewsSection() {
  return (
    <section
      className="max-w-[800px] w-full mt-8 mx-auto pt-4 pb-2 px-4 rounded-xl border"
      style={{ background: '#0a0a1c', borderColor: 'rgba(201,168,76,0.15)' }}
    >
      <h2 className="text-base font-bold text-white leading-7 mb-4">📢 お知らせ一覧</h2>
      <ul className="list-none pl-0">
        {newsItems.map((item, index) => (
          <li key={item.id} className={`py-2 ${index !== 0 ? 'border-t border-white/5' : ''}`}>
            <time className="text-xs text-gray-500 block">{item.date}</time>
            <Link
              href={item.href}
              className="text-gold text-sm font-medium hover:text-yellow-300 transition-colors"
            >
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
      <div className="flex justify-center pt-4">
        <Link
          href="/news"
          className="text-sm font-medium text-gray-400 hover:text-gold transition-colors px-4 py-2"
        >
          もっと見る →
        </Link>
      </div>
    </section>
  );
}
