import { useState } from "react";

export default function FilterBar({ searchQuery, setSearchQuery, viewMode, setViewMode, activeStatus, setActiveStatus, activeZone, setActiveZone }) {
  const [zones] = useState([
    "All Campus", "Central Library", "CS Block", "Main Canteen", "Auditorium", "Hostels"
  ]);

  return (
    <div className="sticky top-0 z-30 bg-surface-container-lowest shadow-sm flex flex-col w-full">
      {/* Main Search Field */}
      <div className="px-margin-mobile pt-space-sm pb-space-xs flex items-center gap-space-xs">
        <div className="relative flex-1 flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[20px] pointer-events-none">search</span>
          <input
            className="w-full h-10 pl-9 pr-9 bg-surface-container-low text-on-surface font-body-md text-body-md rounded-xl placeholder:text-outline focus:bg-surface-container-lowest focus:outline-none transition-all shadow-inner"
            placeholder="Search items, buildings, custody tags..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery.length > 0 && (
            <button
              className="absolute right-2.5 text-outline hover:text-on-surface p-1 rounded-full flex items-center justify-center"
              onClick={() => setSearchQuery("")}
            >
              <span className="material-symbols-outlined text-[18px]">cancel</span>
            </button>
          )}
        </div>
        {/* Segmented View Mode Switcher */}
        <div className="flex items-center bg-surface-container p-0.5 rounded-xl flex-shrink-0">
          <button
            onClick={() => setViewMode("list")}
            className={`px-space-sm py-1.5 rounded-lg flex items-center gap-1 font-label-md text-label-md transition-colors ${
              viewMode === "list" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">format_list_bulleted</span>
            <span className="hidden sm:inline">List</span>
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={`px-space-sm py-1.5 rounded-lg flex items-center gap-1 font-label-md text-label-md transition-colors ${
              viewMode === "map" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">map</span>
            <span className="hidden sm:inline">Map</span>
          </button>
        </div>
      </div>
      
      {/* Status Category Selector */}
      <div className="px-margin-mobile py-space-xs flex items-center gap-space-xs overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveStatus("all")}
          className={`flex-shrink-0 px-2.5 py-1 rounded-full font-label-sm text-label-sm flex items-center gap-1.5 transition-colors ${
            activeStatus === "all" ? "bg-primary-container text-on-primary" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
          }`}
        >
          <span>All Items</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-code-sm ${activeStatus === 'all' ? 'bg-on-primary/20' : 'bg-surface-container-high'}`}>42</span>
        </button>
        <button
          onClick={() => setActiveStatus("found")}
           className={`flex-shrink-0 px-2.5 py-1 rounded-full font-label-sm text-label-sm flex items-center gap-1.5 transition-colors ${
            activeStatus === "found" ? "bg-primary-container text-on-primary" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
          <span>Found Only</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-code-sm ${activeStatus === 'found' ? 'bg-on-primary/20' : 'bg-surface-container-high'}`}>26</span>
        </button>
        <button
          onClick={() => setActiveStatus("lost")}
           className={`flex-shrink-0 px-2.5 py-1 rounded-full font-label-sm text-label-sm flex items-center gap-1.5 transition-colors ${
            activeStatus === "lost" ? "bg-primary-container text-on-primary" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
          <span>Lost Only</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-code-sm ${activeStatus === 'lost' ? 'bg-on-primary/20' : 'bg-surface-container-high'}`}>16</span>
        </button>
        <div className="h-4 w-px bg-surface-container-high flex-shrink-0 mx-1"></div>
        <span className="font-code-sm text-[11px] text-outline flex items-center gap-1 flex-shrink-0 pr-1">
          <span className="material-symbols-outlined text-[14px]">verified_user</span>
          Security Desk Sync
        </span>
      </div>

      {/* Campus Zone Horizontal Pills */}
      <div className="px-margin-mobile pb-space-sm pt-0.5 flex items-center gap-space-xs overflow-x-auto no-scrollbar">
        <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider flex-shrink-0 mr-1">Sector:</span>
        {zones.map(zone => (
          <button
            key={zone}
            onClick={() => setActiveZone(zone)}
            className={`flex-shrink-0 px-2.5 py-0.5 rounded-md font-label-sm text-label-sm ${
              activeZone === zone ? "bg-secondary-container text-on-secondary-fixed" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            {zone}
          </button>
        ))}
      </div>

      {/* Operational Telemetry Bar */}
      <div className="w-full bg-surface-container-low px-margin-mobile py-1 flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-tertiary"></span>
          <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">42 active reports across campus</span>
        </div>
        <div className="flex items-center gap-1 text-outline font-body-sm text-body-sm">
          <span className="material-symbols-outlined text-[14px] text-primary">near_me</span>
          <span>Near Computer Science Block</span>
        </div>
      </div>
    </div>
  );
}
