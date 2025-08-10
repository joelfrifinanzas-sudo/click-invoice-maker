import { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";

export function RequireClient({ children }: PropsWithChildren) {
  const location = useLocation();

  // Read role from stored session (Supabase stores token in localStorage)
  const stored = (() => {
    try { return JSON.parse(localStorage.getItem('supabase.auth.token') || '{}'); } catch { return {}; }
  })();
  const rawRole = (stored?.user?.user_metadata?.role as string | undefined) || undefined;

  if (!stored?.currentSession) {
    return <Navigate to="/login" replace />;
  }
  if (rawRole !== 'cliente') {
    return <Navigate to="/acceso-denegado" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
}
