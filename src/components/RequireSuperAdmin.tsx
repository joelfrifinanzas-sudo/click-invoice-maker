import { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";

export function RequireSuperAdmin({ children }: PropsWithChildren) {
  const { role, loading } = useUserRole();
  const location = useLocation();

  if (loading) return null;
  if (role !== "superadmin") {
    return <Navigate to="/acceso-denegado" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
}
