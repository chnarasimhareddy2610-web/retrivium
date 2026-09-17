export default function ItemOverlaySheet({ activeMarkerId, onClose }) {
  // A real app would fetch the full item based on the activeMarkerId. 
  // For now, we statically render the exact design from code.html.
  if (activeMarkerId !== 'item-ipad') return null; // Only the iPad overlay is fully detailed in stitch export

  return (
    <div className="absolute top-[390px] left-0 right-0 px-margin-mobile z-30 transition-all duration-300">
      <div className="bg-surface-container-lowest rounded-xl shadow-xl overflow-hidden p-space-md flex flex-col gap-space-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <div className="h-6 px-2 rounded bg-tertiary-container/10 text-tertiary flex items-center gap-1.5 font-label-sm text-label-sm font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
              <span>FOUND • HELD AT SECURITY DESK</span>
            </div>
            <span className="font-code-sm text-code-sm text-outline">REC-8802</span>
          </div>
          <button 
            className="w-7 h-7 flex items-center justify-center text-outline hover:text-on-surface rounded-full hover:bg-surface-container transition-colors"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        <div className="flex gap-space-md items-start">
          <div className="w-24 h-20 rounded-lg overflow-hidden bg-surface-container-low flex-shrink-0 relative">
            <img 
              className="w-full h-full object-cover" 
              alt="Silver Apple iPad Air with keyboard folio" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1cqkZ3LzCgyYZPCjZsWbqgzdwtg4BhuJGg0v-SY6Kurw-9aFvgP6w9xW04M0rxJxRgwit1Wr8ccARmD3YpUk4EyhjGFaQ13Ubt3yC67PvLyZhSlyD6XmpmG0h_vwbZNJnoh_DBx7rnV7Nvadt9zhVvtut-wc06U6jStkRrkhzZ8bty6O0hfmFl_TD36sNTzQJzc-xQ-WejUWWOJgB4bgQuOi0u97gfMwQBmJO5XoxVa0N8dJR0VN8Sw" 
            />
            <div className="absolute bottom-1 right-1 bg-on-background/70 backdrop-blur-xs text-on-primary text-[9px] font-code-sm px-1 rounded">PHOTO</div>
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <h2 className="font-headline-sm text-headline-sm text-on-surface truncate leading-snug">Silver iPad Air with Smart Keyboard</h2>
            <div className="flex items-center gap-1 text-on-surface-variant font-body-sm text-body-sm mt-0.5">
              <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
              <span className="truncate">Auditorium Main Hall · 180m from Central Library</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5 font-code-sm text-[11px] text-outline">
              <span className="flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[13px]">schedule</span>
                Found 2 hours ago
              </span>
              <span>•</span>
              <span className="text-tertiary font-medium">Secured in Safe A-4</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-space-xs pt-1">
          <button className="h-9 px-space-sm bg-primary text-on-primary hover:bg-primary-container font-label-lg text-label-lg rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-colors active:scale-[0.99]">
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>Claim Item</span>
          </button>
          <button className="h-9 px-space-sm bg-surface-container-lowest text-on-surface hover:bg-surface-container font-label-lg text-label-lg rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors">
            <span className="material-symbols-outlined text-[18px]">visibility</span>
            <span>View Details</span>
          </button>
        </div>
      </div>
    </div>
  );
}
