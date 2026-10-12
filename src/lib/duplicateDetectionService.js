import { bigramSimilarity, calculateHaversineDistance } from "./matchService";
import { hasValidCoords } from "./geo";

/**
 * Retrivium Duplicate Report Detection Service
 *
 * Distinct from Smart Match (which pairs Lost <-> Found items):
 * Duplicate Detection identifies if a NEW report (e.g. Lost) appears to already
 * be represented by an existing ACTIVE report with the SAME status (Lost <-> Lost or Found <-> Found).
 *
 * Scoring signals:
 * - Status match (mandatory): Same status (Lost vs Lost, or Found vs Found).
 * - Excludes resolved items: Resolved items are never duplicate candidates.
 * - Category match: up to 25 pts (exact match = 25, general 'Other' = 15)
 * - Title / Name similarity: up to 35 pts (bigram Dice coefficient)
 * - Location / Zone similarity: up to 20 pts (same zone = 15, matching text = up to 20)
 * - Description keyword/text overlap: up to 10 pts
 * - Date proximity (within recent window): up to 10 pts
 * - GPS proximity (when both have coordinates): up to 10 pts bonus/reweight
 *
 * Missing fields are handled gracefully without penalizing candidates.
 * Threshold:
 * - Duplicate warning triggers when score >= 55%.
 * - If score >= 75%, marked as "High" duplicate likelihood.
 */

export function scoreDuplicateCandidate(newReport, existingItem) {
  if (!newReport || !existingItem) return null;

  // Cannot be a duplicate of itself
  if (existingItem.id && newReport.id && existingItem.id === newReport.id) {
    return null;
  }

  // Active status check: Ignore resolved items
  const existStatus = (existingItem.status || "").toLowerCase();
  const newStatus = (newReport.status || "").toLowerCase();
  if (existStatus === "resolved" || newStatus === "resolved") {
    return null;
  }

  // Must match the SAME status: Lost duplicates Lost, Found duplicates Found
  if (existStatus !== newStatus) {
    return null;
  }

  const reasons = [];
  let rawScore = 0;
  let maxPossibleScore = 0;

  // 1. Category similarity (Weight: 25)
  maxPossibleScore += 25;
  const catA = (newReport.category || "Other").toLowerCase();
  const catB = (existingItem.category || "Other").toLowerCase();
  if (catA === catB && catA !== "other") {
    rawScore += 25;
    reasons.push(`Same category: ${existingItem.category}`);
  } else if (catA === catB) {
    rawScore += 12;
    reasons.push(`Same general category (${existingItem.category})`);
  }

  // 2. Name / Title similarity (Weight: 35)
  maxPossibleScore += 35;
  const nameSim = bigramSimilarity(newReport.name, existingItem.name);
  if (nameSim > 0) {
    const namePts = Math.round(nameSim * 35);
    rawScore += namePts;
    if (nameSim >= 0.8) {
      reasons.push(`Very strong title match: "${existingItem.name}"`);
    } else if (nameSim >= 0.4) {
      reasons.push(`Similar item title: "${existingItem.name}"`);
    }
  }

  // 3. Location / Zone similarity (Weight: 20)
  maxPossibleScore += 20;
  const locA = (newReport.location || "").toLowerCase();
  const locB = (existingItem.location || "").toLowerCase();
  const zoneA = (newReport.zone || "").toLowerCase();
  const zoneB = (existingItem.zone || "").toLowerCase();

  let locPoints = 0;
  if (zoneA && zoneB && zoneA === zoneB) {
    locPoints += 15;
    reasons.push(`Same campus zone: ${existingItem.zone}`);
  }

  if (locA && locB) {
    const locSim = bigramSimilarity(locA, locB);
    if (locSim >= 0.6) {
      locPoints = Math.max(locPoints, 20);
      reasons.push(`Matching location: "${existingItem.location}"`);
    } else if (locSim >= 0.3) {
      locPoints = Math.max(locPoints, 12);
      reasons.push(`Nearby location match`);
    }
  }
  rawScore += locPoints;

  // 4. Description similarity (Weight: 10)
  const descA = (newReport.description || "").trim();
  const descB = (existingItem.description || "").trim();
  if (descA.length > 5 && descB.length > 5) {
    maxPossibleScore += 10;
    const descSim = bigramSimilarity(descA, descB);
    if (descSim >= 0.3) {
      const descPts = Math.round(descSim * 10);
      rawScore += descPts;
      reasons.push(`Matching description details`);
    }
  }

  // 5. Date proximity (Weight: 10)
  const dateExisting = existingItem.created_at ? new Date(existingItem.created_at) : null;
  if (dateExisting && !isNaN(dateExisting)) {
    maxPossibleScore += 10;
    const diffDays = Math.abs(Date.now() - dateExisting.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays <= 2) {
      rawScore += 10;
      reasons.push(`Reported recently (within 48 hours)`);
    } else if (diffDays <= 7) {
      rawScore += 7;
      reasons.push(`Reported within the past week`);
    } else if (diffDays <= 30) {
      rawScore += 4;
      reasons.push(`Reported within the past month`);
    }
  }

  // 6. GPS Proximity (Weight: 10, only if both provide valid coordinates)
  const hasGpsA = hasValidCoords(newReport.latitude, newReport.longitude);
  const hasGpsB = hasValidCoords(existingItem.latitude, existingItem.longitude);
  if (hasGpsA && hasGpsB) {
    maxPossibleScore += 10;
    const distKm = calculateHaversineDistance(
      newReport.latitude,
      newReport.longitude,
      existingItem.latitude,
      existingItem.longitude
    );
    if (distKm <= 0.1) {
      rawScore += 10;
      reasons.push(`Same exact coordinates (<100m away)`);
    } else if (distKm <= 0.5) {
      rawScore += 7;
      reasons.push(`GPS proximity (<500m away)`);
    } else if (distKm <= 1.0) {
      rawScore += 4;
      reasons.push(`Nearby GPS range (<1km)`);
    }
  }

  if (maxPossibleScore === 0) return null;

  const score = Math.min(100, Math.round((rawScore / maxPossibleScore) * 100));

  let confidence = "Low";
  if (score >= 75) confidence = "High";
  else if (score >= 55) confidence = "Moderate";

  return {
    existingItem,
    score,
    confidence,
    reasons,
  };
}

/**
 * Find potential duplicate reports among existing active items.
 *
 * @param {Object} newReport - The candidate report to be submitted
 * @param {Array} existingItems - Array of normalized active campus items
 * @param {number} minThreshold - Minimum similarity score to qualify as a duplicate warning (default: 55)
 * @returns {Array} List of potential duplicates sorted by score descending
 */
export function findDuplicateReports(newReport, existingItems, minThreshold = 55) {
  if (!newReport || !Array.isArray(existingItems) || existingItems.length === 0) {
    return [];
  }

  const duplicates = [];

  for (const item of existingItems) {
    const candidate = scoreDuplicateCandidate(newReport, item);
    if (candidate && candidate.score >= minThreshold) {
      duplicates.push(candidate);
    }
  }

  // Sort by score descending
  duplicates.sort((a, b) => b.score - a.score);

  return duplicates;
}
