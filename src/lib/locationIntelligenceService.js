import { calculateHaversineDistance } from "./matchService";
import { hasValidCoords } from "./geo";

/**
 * Retrivium — Advanced Location Intelligence Service
 *
 * Deterministic pure functions for:
 * 1. Campus zone telemetry and activity breakdown (getZoneStats)
 * 2. Real report-driven hotspot detection (getLocationHotspots)
 * 3. User proximity / "Near Me" radius matching (findNearbyItems)
 *
 * Design constraints:
 * - Pure functions; does not mutate input items array.
 * - Ignores resolved / inactive items for active spatial calculations.
 * - Respects structured `item.zone` first, falling back to location-derived zone.
 * - Never fabricates GPS coordinates.
 * - Transparent activity thresholds: High (>= 4 active), Moderate (2-3), Low (1).
 */

export const ZONE_CENTROIDS = {
  "Central Library": [12.9345, 77.6102],
  "CS Block": [12.9354, 77.6118],
  "Main Canteen": [12.9338, 77.6110],
  "Auditorium": [12.9348, 77.6096],
  "Hostels": [12.9360, 77.6126],
  Other: [12.9340, 77.6105],
};

/**
 * Standardize or infer the campus zone for an item.
 * Prefers structured item.zone if present; otherwise inspects item.location.
 */
export function resolveItemZone(item) {
  if (!item) return "Other";
  if (item.zone && ZONE_CENTROIDS[item.zone]) {
    return item.zone;
  }
  const loc = (item.location || "").toLowerCase();
  if (loc.includes("library")) return "Central Library";
  if (loc.includes("cs block") || loc.includes("computer science")) return "CS Block";
  if (loc.includes("canteen")) return "Main Canteen";
  if (loc.includes("auditorium")) return "Auditorium";
  if (loc.includes("hostel")) return "Hostels";
  return "Other";
}

/**
 * Exclude resolved and inactive items from active spatial calculations.
 */
export function isActiveItem(item) {
  if (!item) return false;
  const status = (item.status || "").toLowerCase();
  return status === "lost" || status === "found";
}

/**
 * Determine activity rating from total active reports.
 */
export function getActivityLevel(count) {
  if (count >= 4) return "High";
  if (count >= 2) return "Moderate";
  if (count >= 1) return "Low";
  return "None";
}

/**
 * Aggregate active report statistics grouped by campus zone.
 *
 * @param {Array} items - List of items
 * @returns {Array} List of zone statistics sorted by total active reports descending
 */
export function getZoneStats(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  const map = new Map();

  for (const item of items) {
    if (!isActiveItem(item)) continue;

    const zone = resolveItemZone(item);
    if (!map.has(zone)) {
      map.set(zone, {
        zone,
        total: 0,
        lostCount: 0,
        foundCount: 0,
        gpsCount: 0,
        centroid: ZONE_CENTROIDS[zone] || ZONE_CENTROIDS.Other,
      });
    }

    const stat = map.get(zone);
    stat.total += 1;
    const st = (item.status || "").toLowerCase();
    if (st === "lost") stat.lostCount += 1;
    if (st === "found") stat.foundCount += 1;
    if (hasValidCoords(item.latitude, item.longitude)) {
      stat.gpsCount += 1;
    }
  }

  const result = [];
  map.forEach((stat) => {
    result.push({
      ...stat,
      activityLevel: getActivityLevel(stat.total),
    });
  });

  result.sort((a, b) => b.total - a.total);
  return result;
}

/**
 * Detect campus hotspots based on real active report frequency.
 * Returns only zones with at least 1 active report.
 *
 * @param {Array} items - List of items
 * @returns {Array} List of hotspot objects sorted by active count descending
 */
export function getLocationHotspots(items) {
  const stats = getZoneStats(items);
  return stats.map((s) => ({
    zone: s.zone,
    count: s.total,
    lostCount: s.lostCount,
    foundCount: s.foundCount,
    gpsCount: s.gpsCount,
    activityLevel: s.activityLevel,
    coordinates: s.centroid,
    // Visual radius in meters for map overlay circles
    radiusMeters: s.activityLevel === "High" ? 65 : s.activityLevel === "Moderate" ? 45 : 30,
  }));
}

/**
 * Find active items within a given radius of user GPS coordinates.
 *
 * Coordinates are evaluated as follows:
 * 1. For reports with exact GPS coordinates: computes Haversine distance between
 *    user position and the report's exact GPS.
 * 2. For reports without GPS coordinates: computes Haversine distance between
 *    user position and the report's zone centroid as a realistic area approximation.
 *
 * @param {Object} userCoords - { latitude, longitude }
 * @param {Array} items - List of items
 * @param {number} radiusMeters - Search radius in meters (e.g. 100, 250, 500)
 * @returns {Array} List of nearby active items with distanceMeters attached, sorted by distance ascending
 */
export function findNearbyItems(userCoords, items, radiusMeters = 250) {
  if (
    !userCoords ||
    !hasValidCoords(userCoords.latitude, userCoords.longitude) ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return [];
  }

  const userLat = Number(userCoords.latitude);
  const userLng = Number(userCoords.longitude);
  const radiusKm = radiusMeters / 1000;

  const nearby = [];

  for (const item of items) {
    if (!isActiveItem(item)) continue;

    let itemLat;
    let itemLng;
    let isExactGps = false;

    if (hasValidCoords(item.latitude, item.longitude)) {
      itemLat = Number(item.latitude);
      itemLng = Number(item.longitude);
      isExactGps = true;
    } else {
      const zone = resolveItemZone(item);
      const centroid = ZONE_CENTROIDS[zone] || ZONE_CENTROIDS.Other;
      itemLat = centroid[0];
      itemLng = centroid[1];
    }

    const distKm = calculateHaversineDistance(userLat, userLng, itemLat, itemLng);

    if (distKm <= radiusKm) {
      nearby.push({
        ...item,
        distanceMeters: Math.round(distKm * 1000),
        isExactGps,
      });
    }
  }

  nearby.sort((a, b) => a.distanceMeters - b.distanceMeters);
  return nearby;
}
