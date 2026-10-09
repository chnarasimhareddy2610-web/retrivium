import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { hasAllowedRole } from "../../lib/roleUtils";

export default function RoleProtectedRoute({
  allowedRoles,
  fallback: Fallback = <Navigate to="/dashboard" replace />,
  children,
}) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-6 pb-24 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const userRole = profile?.role || user?.role || user?.user_metadata?.role;

  if (!hasAllowedRole(userRole, allowedRoles)) {
    return Fallback;
  }

  return children ?? <Outlet />;
}
