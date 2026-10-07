// ──────────────────────────────────────────────
// Retrivium — coordinate helpers
// Tiny validation utilities shared by the report form (capture),
// the item service (persistence) and the map (rendering).
// Coordinates are optional everywhere: NULL means "unknown position"
// and the caller must never fabricate a value.
// ──────────────────────────────────────────────

export const LAT_MIN = -90;
export const LAT_MAX = 90;
export const LNG_MIN = -180;
export const LNG_MAX = 180;

/** Numeric + finite + within the legal latitude range. */
export function isValidLatitude(lat) {
  const n = Number(lat);
  return Number.isFinite(n) && n >= LAT_MIN && n <= LAT_MAX;
}

/** Numeric + finite + within the legal longitude range. */
export function isValidLongitude(lng) {
  const n = Number(lng);
  return Number.isFinite(n) && n >= LNG_MIN && n <= LNG_MAX;
}

/**
 * True only when BOTH coordinates are present and in range.
 * Guards against half-set positions (lat without lng, NaN, undefined).
 */
export function hasValidCoords(lat, lng) {
  if (lat === null || lat === undefined || lat === "") return false;
  if (lng === null || lng === undefined || lng === "") return false;
  return isValidLatitude(lat) && isValidLongitude(lng);
}
