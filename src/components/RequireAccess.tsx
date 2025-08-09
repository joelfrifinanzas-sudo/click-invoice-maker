import { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUserRole, AppRole } from "@/hooks/useUserRole";

export type RouteKey =
  | "inicio"
  | "cotizaciones"
  | "facturas"
  | "factura-detalle"
  | "crear-factura"
  | "clientes"
  | "inventario"
  | "articulos"
  | "creditos"
  | "pagos"
  | "plan-pro"
  | "contactos"
  | "perfil-empresa"
  | "configuracion"
  | "perfil"
  | "historial";

function canAccess(role: AppRole, route: RouteKey): boolean {
  if (role === "superadmin") return true;
  if (role === "admin") return true; // todo: restringir solo gestión de superadmins cuando exista
  if (role === "cajera") {
    return [
      "crear-factura",
      "clientes",
      "articulos",
      "historial",
      "pagos",
    ].includes(route);
  }
  return false;
}

export function RequireAccess({ routeKey, children }: PropsWithChildren<{ routeKey: RouteKey }>) {
  const { role, loading } = useUserRole();
  const location = useLocation();

  if (loading) return null; // could add a spinner
  if (!canAccess(role, routeKey)) {
    return <Navigate to="/acceso-denegado" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
}
