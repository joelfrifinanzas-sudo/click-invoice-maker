import { PropsWithChildren, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUserRole, AppRole } from "@/hooks/useUserRole";
import { canAccess, type RouteKey as GuardRouteKey } from "@/utils/accessGuard";
import { getCurrentContext } from "@/data/utils";

export type RouteKey = GuardRouteKey;

export function RequireAccess({ routeKey, children }: PropsWithChildren<{ routeKey: RouteKey }>) {
  const { role, loading } = useUserRole();
  const location = useLocation();
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const ctx = await getCurrentContext();
      if (!mounted) return;
      setCompanyId(ctx.data?.companyId ?? null);
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return null;

  // Block all non-portal routes for client role
  const storedRole = (() => {
    try { return (JSON.parse(localStorage.getItem('supabase.auth.token') || '{}')?.user?.user_metadata?.role as string | undefined) || undefined; } catch { return undefined; }
  })();
  if (storedRole === 'cliente') {
    return <Navigate to="/acceso-denegado" state={{ from: location.pathname }} replace />;
  }

  const allowed = canAccess(routeKey, { role: role as AppRole, companyId });
  if (!allowed) {
    return <Navigate to="/acceso-denegado" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
}
