import { useState, useMemo, useCallback } from "react";
import FilterBar from "../components/search/FilterBar";
import CampusIncidentMap from "../components/map/CampusIncidentMap";
import FeedList from "../components/feed/FeedList";
import SmartMatchPanel from "../components/match/SmartMatchPanel";
import LocationInsights from "../components/location/LocationInsights";
import { useAppData } from "../context/AppDataContext";
import {
  getLocationHotspots,
  findNearbyItems,
  resolveItemZone,
} from "../lib/locationIntelligenceService";
import { hasValidCoords } from "../lib/geo";

export default function BrowsePage() {
  const { items } = useAppData();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [activeStatus, setActiveStatus] = useState("all");
  const [activeZone, setActiveZone] = useState("All Campus");

  // Near Me state
  const [userCoords, setUserCoords] = useState(null);
  const [isNearMeActive, setIsNearMeActive] = useState(false);
  const [nearMeRadius, setNearMeRadius] = useState(250);
  const [geoStatus, setGeoStatus] = useState("idle"); // idle | loading | success | error
  const [geoError, setGeoError] = useState("");

  const totalCount = items.length;
  const foundCount = items.filter((i) => i.status === "Found").length;
  const lostCount = items.filter((i) => i.status === "Lost").length;

  // Real data hotspots computed across active loaded items
  const hotspots = useMemo(() => {
    return getLocationHotspots(items);
  }, [items]);

  // Handle explicit Near Me activation
  const handleActivateNearMe = useCallback(() => {
    setGeoError("");
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setGeoStatus("error");
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }

    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos?.coords?.latitude;
        const lng = pos?.coords?.longitude;
        const accuracy = pos?.coords?.accuracy;

        if (!hasValidCoords(lat, lng)) {
          setGeoStatus("error");
          setGeoError("Received invalid coordinates from device.");
          return;
        }

        setUserCoords({ latitude: lat, longitude: lng, accuracy });
        setIsNearMeActive(true);
        setGeoStatus("success");
      },
      (err) => {
        setGeoStatus("error");
        if (err?.code === 1) {
          setGeoError("Location permission denied. Please allow location access in your browser to use Near Me.");
        } else if (err?.code === 2) {
          setGeoError("Position unavailable. Ensure your GPS or location services are active.");
        } else if (err?.code === 3) {
          setGeoError("Location request timed out. Please try again.");
        } else {
          setGeoError("Could not retrieve your location.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const handleClearNearMe = useCallback(() => {
    setIsNearMeActive(false);
    setUserCoords(null);
    setGeoStatus("idle");
    setGeoError("");
  }, []);

  // Compute nearby items if Near Me is active
  const nearbyItems = useMemo(() => {
    if (!isNearMeActive || !userCoords) return [];
    return findNearbyItems(userCoords, items, nearMeRadius);
  }, [isNearMeActive, userCoords, items, nearMeRadius]);

  const nearbyCount = nearbyItems.length;

  const filteredItems = useMemo(() => {
    // If Near Me is active, start from the nearby items set
    let sourceItems = items;
    if (isNearMeActive && userCoords) {
      sourceItems = nearbyItems;
    }

    return sourceItems.filter((item) => {
      // Name & Tag search
      if (
        searchQuery.trim() !== "" &&
        !item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !item.tag.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Status filter
      if (activeStatus !== "all" && activeStatus.toLowerCase() !== item.status.toLowerCase()) {
        return false;
      }

      // Zone filter: prioritize structured item.zone, with backward-compatible text fallback
      if (activeZone !== "All Campus") {
        const resolved = resolveItemZone(item);
        if (resolved !== activeZone) {
          return false;
        }
      }

      return true;
    });
  }, [items, searchQuery, activeStatus, activeZone, isNearMeActive, userCoords, nearbyItems]);

  const handleFocusItem = (itemId) => {
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

      {/* Location Intelligence Telemetry & Near Me Bar */}
      <LocationInsights
        hotspots={hotspots}
        totalActiveCount={lostCount + foundCount}
        lostCount={lostCount}
        foundCount={foundCount}
        userCoords={userCoords}
        isNearMeActive={isNearMeActive}
        nearMeRadius={nearMeRadius}
        nearbyCount={nearbyCount}
        onActivateNearMe={handleActivateNearMe}
        onClearNearMe={handleClearNearMe}
        onChangeRadius={(rad) => setNearMeRadius(rad)}
        geoStatus={geoStatus}
        geoError={geoError}
      />

      {viewMode === "map" ? (
        <CampusIncidentMap
          height="100%"
          activeZone={activeZone}
          items={filteredItems}
          onFocusItem={handleFocusItem}
          userCoords={isNearMeActive ? userCoords : null}
          nearMeRadius={nearMeRadius}
        />
      ) : (
        <div className="w-full max-w-3xl mx-auto py-6 px-4 space-y-6">
          <SmartMatchPanel limit={3} />
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
