import { useState, useMemo } from "react";
import Header from "./components/layout/Header";
import FilterBar from "./components/search/FilterBar";
import CampusSVGMap from "./components/map/CampusSVGMap";
import FeedList from "./components/feed/FeedList";
import { initialItems } from "./data/dummyData";

function App() {
  const [items] = useState(initialItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [activeStatus, setActiveStatus] = useState("all");
  const [activeZone, setActiveZone] = useState("All Campus");
  const [activeMarkerId, setActiveMarkerId] = useState(null);

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
      // Zone filter (simple logic for mockup)
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
    // Simulating scrolling to map if in feed
    if (viewMode === "list") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex flex-col relative w-full pt-16 pb-safe bg-surface min-h-screen">
        <div className="flex flex-col w-full relative">
          
          <FilterBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            viewMode={viewMode}
            setViewMode={setViewMode}
            activeStatus={activeStatus}
            setActiveStatus={setActiveStatus}
            activeZone={activeZone}
            setActiveZone={setActiveZone}
          />
          
          <CampusSVGMap 
            activeMarkerId={activeMarkerId} 
            setActiveMarkerId={setActiveMarkerId} 
          />
          
          <FeedList 
            items={filteredItems} 
            onFocusItem={handleFocusItem} 
            activeMarkerId={activeMarkerId} 
          />
          
        </div>
      </main>
    </div>
  );
}

export default App;

