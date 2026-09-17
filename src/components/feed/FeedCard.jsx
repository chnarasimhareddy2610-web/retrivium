export default function FeedCard({ item, onClickFocus }) {
  const isFound = item.status === "Found";

  return (
    <div className={`p-space-sm bg-surface-container-lowest rounded-xl shadow-xs hover:shadow-md transition-shadow flex items-center justify-between gap-space-sm ${item.highlighted ? "ring-2 ring-primary" : ""}`}>
      <div className="flex items-center gap-space-sm min-w-0">
        <div className="w-12 h-12 rounded-lg bg-surface-container-low overflow-hidden flex-shrink-0">
          <img 
            className="w-full h-full object-cover" 
            alt={item.name} 
            src={item.image || "https://placehold.co/100x100/F1F5F9/94A3B8?text=Photo"} 
          />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`px-1.5 py-0.5 rounded font-label-sm text-[10px] font-semibold ${isFound ? "bg-tertiary-container/10 text-tertiary" : "bg-error-container text-error"}`}>
              {item.status.toUpperCase()}
            </span>
            <span className="font-code-sm text-[11px] text-outline">{item.tag || "UNK-0000"}</span>
          </div>
          <h4 className="font-label-lg text-label-lg text-on-surface truncate font-semibold mt-0.5">{item.name}</h4>
          <span className="font-body-sm text-body-sm text-on-surface-variant truncate">{item.location}</span>
        </div>
      </div>
      <button 
        onClick={() => onClickFocus(item.id)}
        className={`flex-shrink-0 px-2.5 py-1.5 rounded-lg font-label-sm text-label-sm flex items-center gap-1 transition-colors ${
          item.highlighted 
            ? "bg-primary text-on-primary"
            : "bg-surface-container text-on-surface-variant hover:bg-primary hover:text-on-primary"
        }`}
      >
        <span className="material-symbols-outlined text-[14px]">my_location</span>
        <span className="hidden sm:inline">{item.highlighted ? "Focused" : "Focus"}</span>
      </button>
    </div>
  );
}
