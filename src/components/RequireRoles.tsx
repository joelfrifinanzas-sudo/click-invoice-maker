import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function RequireRoles({ roles, children }: { roles: Array<'SUPER_ADMIN' | 'ADMIN' | 'SUPERVISOR' | 'CAJERA' | 'CLIENTE'>; children: ReactNode }) {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!hasRole(...roles)) return <Navigate to="/acceso-denegado" replace />;
  return <>{children}</>;
}
