import { filterTags } from '@/lib/data/filterTags';

export function FilterTags() {
  return (
    <div className="flex items-center max-w-[860px] gap-2 w-full overflow-auto mb-6 mx-auto px-4">
      <button
        type="button"
        className="btn-gold text-xs px-4 py-2 rounded-full shrink-0 flex items-center gap-1"
      >
        おすすめ順 ▾
      </button>
      {filterTags.map((tag) => (
        <button
          key={tag.id}
          className="btn-silver text-xs px-4 py-2 rounded-full shrink-0 text-nowrap"
        >
          {tag.label}
        </button>
      ))}
    </div>
  );
}
