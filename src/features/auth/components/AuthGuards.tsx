import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import type { Permission } from "../types";

export function ProtectedRoute() {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const location = useLocation();

  if (!isInitialized) return null; // Can be replaced with a full-page skeleton/spinner

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export function GuestRoute() {
  const { isAuthenticated, isInitialized } = useAuthStore();

  if (!isInitialized) return null;

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export function PermissionGuard({ requiredPermission }: { requiredPermission: Permission }) {
  const { hasPermission, isInitialized } = useAuthStore();

  if (!isInitialized) return null;

  if (!hasPermission(requiredPermission)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
