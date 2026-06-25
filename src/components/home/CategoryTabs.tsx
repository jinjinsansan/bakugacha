'use client';

import { useState } from 'react';
import { categories } from '@/lib/data/categories';

export function CategoryTabs() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div
      className="sticky z-40 top-[52px] w-full overflow-x-auto scrollbar-hide"
      style={{ background: '#090b16', borderBottom: '1px solid rgba(255,46,154,0.12)' }}
    >
      <div role="tablist" className="flex sm:justify-center max-w-[860px] min-w-max w-full mx-auto gap-2 px-3 sm:px-0 py-2.5">
        {categories.map((cat, i) => {
          const active = activeTab === i;
          return (
            <button
              key={cat.id}
              role="tab"
              type="button"
              className="shrink-0 text-center px-4 sm:px-5 py-2 rounded-full transition-all duration-200 text-xs font-bold tracking-wide whitespace-nowrap"
              style={
                active
                  ? {
                      color: '#fff',
                      background: 'linear-gradient(135deg, #ff2e9a, #c01e6e)',
                      boxShadow: '0 0 14px rgba(255,46,154,0.4)',
                    }
                  : {
                      color: '#a6aecb',
                      background: 'var(--bg-card)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }
              }
              onClick={() => setActiveTab(i)}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
