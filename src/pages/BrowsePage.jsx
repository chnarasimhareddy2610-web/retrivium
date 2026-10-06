import { useState, useMemo } from "react";
import FilterBar from "../components/search/FilterBar";
import CampusIncidentMap from "../components/map/CampusIncidentMap";
import FeedList from "../components/feed/FeedList";
import { useAppData } from "../context/AppDataContext";

export default function BrowsePage() {
  const { items } = useAppData();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [activeStatus, setActiveStatus] = useState("all");
  const [activeZone, setActiveZone] = useState("All Campus");

  const totalCount = items.length;
  const foundCount = items.filter((i) => i.status === "Found").length;
  const lostCount = items.filter((i) => i.status === "Lost").length;

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Name search
      if (searchQuery.trim() !== "" && !item.name.toLowerCase().includes(searchQuery.toLowerCase()) && !item.tag.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Status filter
      if (activeStatus !== "all" && activeStatus.toLowerCase() !== item.status.toLowerCase()) {
        return false;
      }
      // Zone filter (case-insensitive, since item.location may be free-text cased any way)
      if (activeZone !== "All Campus") {
        const loc = item.location.toLowerCase();
         if (activeZone === "Central Library" && !loc.includes("library")) return false;
         if (activeZone === "CS Block" && !loc.includes("cs block")) return false;
         if (activeZone === "Main Canteen" && !loc.includes("canteen")) return false;
         if (activeZone === "Auditorium" && !loc.includes("auditorium")) return false;
         if (activeZone === "Hostels" && !loc.includes("hostel")) return false;
      }
      return true;
    });
  }, [items, searchQuery, activeStatus, activeZone]);

  const handleFocusItem = (itemId) => {
    // Focus the item in the list/map by id. Returns true if a match was found.
    return filteredItems.some((item) => item.id === itemId);
  };

  return (
    <div className="flex flex-col w-full h-full relative">
      <FilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        viewMode={viewMode}
        setViewMode={setViewMode}
        activeStatus={activeStatus}
        setActiveStatus={setActiveStatus}
        activeZone={activeZone}
        setActiveZone={setActiveZone}
        totalCount={totalCount}
        foundCount={foundCount}
        lostCount={lostCount}
      />

      {viewMode === "map" ? (
        <CampusIncidentMap
          height="100%"
          activeZone={activeZone}
          items={filteredItems}
          onFocusItem={handleFocusItem}
        />
      ) : (
        <div className="w-full max-w-3xl mx-auto py-6">
          <FeedList
            items={filteredItems}
            onFocusItem={handleFocusItem}
            activeMarkerId={null}
          />
        </div>
      )}
    </div>
  );
}
