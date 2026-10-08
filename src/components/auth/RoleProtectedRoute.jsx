import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const DEFAULT_ALLOWED_ROLES = ["security", "admin"];

export default function RoleProtectedRoute({
  allowedRoles,
  fallback: Fallback = <Navigate to="/dashboard" replace />,
  children,
}) {
  const { user, profile, loading } = useAuth();
  const roles = Array.isArray(allowedRoles) ? allowedRoles : DEFAULT_ALLOWED_ROLES;
  const allowed = new Set(roles.map((r) => String(r ?? "").toLowerCase().trim()));

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-6 pb-24 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const role = profile?.role || user?.role || user?.user_metadata?.role;
  const normalized = role ? String(role).toLowerCase().trim() : null;

  if (!normalized || !allowed.has(normalized)) {
    return Fallback;
  }

  return children ?? <Outlet />;
}
