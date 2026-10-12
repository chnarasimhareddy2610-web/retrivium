import { hasValidCoords } from "./geo";

/**
 * Retrivium Smart Match Service
 *
 * Compares LOST reports against FOUND reports using a deterministic weighted scoring system.
 * Scoring breakdown:
 * - Category exact match: 25 pts
 * - Name similarity (Dice Coefficient / token overlap): up to 30 pts
 * - Location / Zone match & overlap: up to 20 pts
 * - Date proximity (within 30 days): up to 15 pts
 * - GPS proximity (Haversine formula, when BOTH items have coordinates): up to 10 pts
 * - Description keyword overlap: up to 10 pts
 *
 * Missing fields (e.g. absent GPS coordinates, missing descriptions or zones) dynamically
 * reweight the available fields so unavailable attributes do not unfairly penalize a candidate.
 */

// Calculate 2-gram (bigram) dice coefficient for string similarity
export function bigramSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  const s1 = str1.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
  const s2 = str2.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1.0;
  if (s1.length < 2 || s2.length < 2) return s1.includes(s2) || s2.includes(s1) ? 0.8 : 0;

  const getBigrams = (s) => {
    const bg = new Map();
    for (let i = 0; i < s.length - 1; i++) {
      const b = s.slice(i, i + 2);
      bg.set(b, (bg.get(b) || 0) + 1);
    }
    return bg;
  };

  const bg1 = getBigrams(s1);
  const bg2 = getBigrams(s2);
  let intersection = 0;

  for (const [b, count1] of bg1.entries()) {
    const count2 = bg2.get(b);
    if (count2) {
      intersection += Math.min(count1, count2);
    }
  }

  const totalBigrams = (s1.length - 1) + (s2.length - 1);
  return (2.0 * intersection) / totalBigrams;
}

// Calculate distance in kilometers using Haversine formula
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Score a pair of items (itemA and itemB).
 * Assumes itemA and itemB are of OPPOSITE status (one Lost, one Found).
 */
export function scoreItemPair(itemA, itemB) {
  if (!itemA || !itemB) return null;
  if (itemA.id === itemB.id) return null;
  
  // Opposites rule: one must be Lost and the other Found
  const statusA = (itemA.status || "").toLowerCase();
  const statusB = (itemB.status || "").toLowerCase();
  if (
    (statusA === "lost" && statusB === "lost") ||
    (statusA === "found" && statusB === "found") ||
    statusA === "resolved" ||
    statusB === "resolved"
  ) {
    return null;
  }

  const reasons = [];
  let rawScore = 0;
  let maxPossibleScore = 0;

  // 1. Category (Weight: 25)
  maxPossibleScore += 25;
  const catA = (itemA.category || "Other").toLowerCase();
  const catB = (itemB.category || "Other").toLowerCase();
  if (catA === catB && catA !== "other") {
    rawScore += 25;
    reasons.push(`Matching category: ${itemA.category}`);
  } else if (catA === catB) {
    rawScore += 15;
    reasons.push(`Both listed under general category (${itemA.category})`);
  }

  // 2. Name Similarity (Weight: 30)
  maxPossibleScore += 30;
  const nameSim = bigramSimilarity(itemA.name, itemB.name);
  if (nameSim > 0) {
    const namePts = Math.round(nameSim * 30);
    rawScore += namePts;
    if (nameSim >= 0.8) {
      reasons.push(`Strong title match: "${itemA.name}" & "${itemB.name}"`);
    } else if (nameSim >= 0.4) {
      reasons.push(`Similar item titles`);
    }
  }

  // 3. Location / Zone Overlap (Weight: 20)
  maxPossibleScore += 20;
  const locA = (itemA.location || "").toLowerCase();
  const locB = (itemB.location || "").toLowerCase();
  const zoneA = (itemA.zone || "").toLowerCase();
  const zoneB = (itemB.zone || "").toLowerCase();

  let locPoints = 0;
  if (zoneA && zoneB && zoneA === zoneB) {
    locPoints += 15;
    reasons.push(`Same campus zone: ${itemA.zone}`);
  }

  if (locA && locB) {
    const locSim = bigramSimilarity(locA, locB);
    if (locSim >= 0.6) {
      locPoints = Math.max(locPoints, 20);
      reasons.push(`Matching report location: "${itemA.location}"`);
    } else if (locSim >= 0.3) {
      locPoints = Math.max(locPoints, 12);
      reasons.push(`Nearby location overlap`);
    }
  }
  rawScore += locPoints;

  // 4. Date Proximity (Weight: 15)
  const dateA = itemA.created_at ? new Date(itemA.created_at) : null;
  const dateB = itemB.created_at ? new Date(itemB.created_at) : null;
  if (dateA && dateB && !isNaN(dateA) && !isNaN(dateB)) {
    maxPossibleScore += 15;
    const diffDays = Math.abs(dateA - dateB) / (1000 * 60 * 60 * 24);
    if (diffDays <= 1) {
      rawScore += 15;
      reasons.push(`Reported on the same day`);
    } else if (diffDays <= 3) {
      rawScore += 12;
      reasons.push(`Reported within 3 days`);
    } else if (diffDays <= 7) {
      rawScore += 8;
      reasons.push(`Reported within 1 week`);
    } else if (diffDays <= 30) {
      rawScore += 4;
      reasons.push(`Reported within 1 month`);
    }
  }

  // 5. GPS Proximity (Weight: 10, only evaluated if BOTH have valid coordinates)
  const hasGpsA = hasValidCoords(itemA.latitude, itemA.longitude);
  const hasGpsB = hasValidCoords(itemB.latitude, itemB.longitude);
  if (hasGpsA && hasGpsB) {
    maxPossibleScore += 10;
    const distKm = calculateHaversineDistance(
      itemA.latitude,
      itemA.longitude,
      itemB.latitude,
      itemB.longitude
    );
    if (distKm <= 0.1) { // 100 meters
      rawScore += 10;
      reasons.push(`Exact GPS overlap (<100m away)`);
    } else if (distKm <= 0.5) { // 500 meters
      rawScore += 7;
      reasons.push(`GPS proximity (<500m away)`);
    } else if (distKm <= 1.0) { // 1 km
      rawScore += 4;
      reasons.push(`Within 1km GPS range`);
    }
  }

  // 6. Description similarity (Weight: 10)
  const descA = (itemA.description || "").trim();
  const descB = (itemB.description || "").trim();
  if (descA.length > 5 && descB.length > 5) {
    maxPossibleScore += 10;
    const descSim = bigramSimilarity(descA, descB);
    if (descSim >= 0.3) {
      const descPts = Math.round(descSim * 10);
      rawScore += descPts;
      reasons.push(`Similar detail description`);
    }
  }

  if (maxPossibleScore === 0) return null;

  // Normalize final match score to 0 - 100% based on available attributes
  const matchScore = Math.min(100, Math.round((rawScore / maxPossibleScore) * 100));

  // Determine strength label
  let strength = "Low";
  if (matchScore >= 70) strength = "Strong";
  else if (matchScore >= 45) strength = "Possible";

  return {
    itemA,
    itemB,
    matchScore,
    strength,
    reasons,
  };
}

/**
 * Generate all candidate smart matches from a list of items.
 * If targetUserId is provided, prioritizes items where reportedBy === targetUserId.
 * Minimum threshold score: 40.
 */
export function findSmartMatches(items, targetUserId = null, minScore = 40) {
  if (!Array.isArray(items) || items.length < 2) return [];

  const eligibleItems = items.filter(
    (item) => item && (item.status === "Lost" || item.status === "Found") && item.status !== "Resolved"
  );

  const lostItems = eligibleItems.filter((item) => item.status === "Lost");
  const foundItems = eligibleItems.filter((item) => item.status === "Found");

  const matches = [];

  for (const lost of lostItems) {
    for (const found of foundItems) {
      // Exclude pairing items reported by the exact same user (optional heuristic)
      const res = scoreItemPair(lost, found);
      if (res && res.matchScore >= minScore) {
        matches.push(res);
      }
    }
  }

  // Sort: User's own items first, then by matchScore descending
  matches.sort((a, b) => {
    if (targetUserId) {
      const aIsUser = a.itemA.reportedBy === targetUserId || a.itemB.reportedBy === targetUserId;
      const bIsUser = b.itemA.reportedBy === targetUserId || b.itemB.reportedBy === targetUserId;
      if (aIsUser && !bIsUser) return -1;
      if (!aIsUser && bIsUser) return 1;
    }
    return b.matchScore - a.matchScore;
  });

  return matches;
}
