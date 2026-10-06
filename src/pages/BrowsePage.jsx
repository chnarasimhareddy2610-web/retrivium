import { useState, useMemo } from "react";
import FilterBar from "../components/search/FilterBar";
import CampusSVGMap from "../components/map/CampusSVGMap";
import FeedList from "../components/feed/FeedList";
import { useAppData } from "../context/AppDataContext";

export default function BrowsePage() {
  const { items } = useAppData();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [activeStatus, setActiveStatus] = useState("all");
  const [activeZone, setActiveZone] = useState("All Campus");
  const [activeMarkerId, setActiveMarkerId] = useState(null);

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
      // Zone filter
      if (activeZone !== "All Campus") {
         if (activeZone === "Central Library" && !item.location.includes("Library")) return false;
         if (activeZone === "CS Block" && !item.location.includes("CS Block")) return false;
         if (activeZone === "Main Canteen" && !item.location.includes("Canteen")) return false;
         if (activeZone === "Auditorium" && !item.location.includes("Auditorium")) return false;
         if (activeZone === "Hostels" && !item.location.includes("Hostels")) return false;
      }
      return true;
    });
  }, [items, searchQuery, activeStatus, activeZone]);

  const handleFocusItem = (markerId) => {
    setActiveMarkerId(markerId);
    if (viewMode === "list") {
      setViewMode("map");
    }
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
        <CampusSVGMap 
          activeMarkerId={activeMarkerId} 
          setActiveMarkerId={setActiveMarkerId} 
        />
      ) : (
        <div className="w-full max-w-3xl mx-auto py-6">
          <FeedList 
            items={filteredItems} 
            onFocusItem={handleFocusItem} 
            activeMarkerId={activeMarkerId} 
          />
        </div>
      )}
    </div>
  );
}
