import { filterTags } from '@/lib/data/filterTags';

export function FilterTags() {
  return (
    <div className="flex items-center max-w-[860px] gap-3 w-full overflow-x-auto scrollbar-hide mb-6 mx-auto px-4 pb-1">
      <button
        type="button"
        className="btn-gold text-[11px] sm:text-xs px-5 py-2 sm:py-2.5 rounded-full shrink-0 flex items-center gap-1.5 shadow-md"
      >
        おすすめ順 ▾
      </button>
      {filterTags.map((tag) => (
        <button
          key={tag.id}
          className="text-[11px] sm:text-xs font-bold px-5 py-2 sm:py-2.5 rounded-full shrink-0 text-nowrap transition-colors"
          style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.08)', color: '#a6aecb' }}
        >
          {tag.label}
        </button>
      ))}
    </div>
  );
}
