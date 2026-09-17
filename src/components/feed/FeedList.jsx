import FeedCard from "./FeedCard";

export default function FeedList({ items, onFocusItem, activeMarkerId }) {
  return (
    <section className="px-margin-mobile flex flex-col w-full pb-space-xl">
      <div className="flex items-center justify-between mb-space-sm mt-4">
        <div className="flex items-center gap-space-xs">
          <span className="material-symbols-outlined text-primary text-[20px]">dataset</span>
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Live Campus feed</h3>
          <span className="font-code-sm text-[11px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
            {items.length} Nearby
          </span>
        </div>
        <button className="font-label-md text-label-md text-primary hover:underline flex items-center gap-0.5">
          <span>Sort: Most Recent</span>
          <span className="material-symbols-outlined text-[16px]">tune</span>
        </button>
      </div>
      
      <div className="flex flex-col gap-space-xs">
        {items.length > 0 ? (
          items.map(item => (
            <FeedCard 
              key={item.id} 
              item={{...item, highlighted: activeMarkerId === item.markerId}} 
              onClickFocus={() => onFocusItem(item.markerId)}
            />
          ))
        ) : (
          <div className="p-8 text-center text-on-surface-variant text-body-md bg-surface-container-lowest rounded-xl">
            No matching reports found in this sector.
          </div>
        )}
      </div>

      <div className="mt-space-md bg-surface-container p-space-md rounded-xl flex items-center justify-between gap-space-sm">
        <div className="flex items-center gap-space-sm">
          <span className="material-symbols-outlined text-primary text-[24px]">support_agent</span>
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm text-on-surface">Need help locating an item?</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">Campus Security Desk (Main Building, Rm 104) is open 24/7.</span>
          </div>
        </div>
        <button className="px-space-sm py-1.5 bg-primary text-on-primary rounded-lg font-label-sm text-label-sm whitespace-nowrap hover:bg-primary-container transition-colors">
          Call Desk
        </button>
      </div>
    </section>
  );
}
