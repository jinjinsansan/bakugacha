'use client';

import { useState } from 'react';
import { categories } from '@/lib/data/categories';

export function CategoryTabs() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div
      className="sticky z-40 top-[52px] w-full overflow-x-auto scrollbar-hide"
      style={{ background: '#07071a', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div role="tablist" className="flex sm:justify-center max-w-[860px] min-w-max w-full mx-auto px-2 sm:px-0">
        {categories.map((cat, i) => (
          <button
            key={cat.id}
            role="tab"
            type="button"
            className="shrink-0 text-center px-4 sm:px-6 py-3.5 transition-all duration-200 text-xs font-bold tracking-widest uppercase whitespace-nowrap"
            style={{
              color: activeTab === i ? '#c9a84c' : 'rgba(255,255,255,0.3)',
              borderBottom: activeTab === i ? '2px solid #c9a84c' : '2px solid transparent',
            }}
            onClick={() => setActiveTab(i)}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}
