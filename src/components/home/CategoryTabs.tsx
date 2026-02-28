'use client';

import { useState } from 'react';
import { categories } from '@/lib/data/categories';

export function CategoryTabs() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div
      className="sticky z-40 top-[52px]"
      style={{ background: '#07071a', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div role="tablist" className="flex justify-center max-w-[860px] w-full mx-auto">
        {categories.map((cat, i) => (
          <button
            key={cat.id}
            role="tab"
            type="button"
            className="basis-0 grow min-w-fit text-center px-4 py-3 transition-all duration-200 text-xs font-bold tracking-widest uppercase"
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
