import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// Simple membership-based guard using the membership role selected for the current session
// We read it from localStorage (set during login context selection)
export function RequireMembership({ roles, children }: { roles: Array<'SUPER_ADMIN'|'ADMIN'|'SUPERVISOR'|'CAJERA'|'CLIENTE'>; children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/login?unauth=1" replace state={{ from: location.pathname }} />;

  let membershipRole: string = 'CLIENTE';
  try {
    membershipRole = (localStorage.getItem('app:membership_role') || 'CLIENTE').toUpperCase();
  } catch {}

  const allowed = roles.map(r => r.toUpperCase());
  if (!allowed.includes(membershipRole)) {
    return <Navigate to="/login?unauth=1" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
