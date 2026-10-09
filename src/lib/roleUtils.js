/**
 * Role resolution and normalization utilities for Retrivium.
 * Ensures consistent security/admin role checks across routing,
 * navigation, and page access control.
 */

/**
 * Normalize role strings into standard system roles:
 * - 'security', 'security desk', 'security_desk' -> 'security'
 * - 'admin' -> 'admin'
 * - 'student', 'staff', 'student / staff' -> 'student'
 */
export function normalizeRole(role) {
  if (!role) return null;
  const r = String(role).toLowerCase().trim();
  if (r === "security" || r === "security desk" || r === "security_desk") return "security";
  if (r === "admin") return "admin";
  if (r === "student" || r === "staff" || r === "student / staff") return "student";
  return r;
}

/**
 * Returns true if the user's role grants Security Desk or Admin access.
 */
export function isSecurityOrAdminRole(role) {
  const norm = normalizeRole(role);
  return norm === "security" || norm === "admin";
}

/**
 * Returns true if the user's normalized role is included in allowedRoles.
 * If allowedRoles is omitted/invalid, defaults to ['security', 'admin'].
 */
export function hasAllowedRole(userRole, allowedRoles) {
  const normUserRole = normalizeRole(userRole);
  if (!normUserRole) return false;
  const roles = Array.isArray(allowedRoles) ? allowedRoles : ["security", "admin"];
  const normalizedAllowed = roles.map((r) => normalizeRole(r));
  return normalizedAllowed.includes(normUserRole);
}
