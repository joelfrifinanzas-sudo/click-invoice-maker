// Centralized access guard
// Keep minimal logic and avoid blocking: Super Admin always allowed, admin has broad access, cajera limitada.

export type AppRole = 'superadmin' | 'admin' | 'cajera';
export type RouteKey =
  | 'inicio'
  | 'cotizaciones'
  | 'facturas'
  | 'factura-detalle'
  | 'crear-factura'
  | 'clientes'
  | 'clientes-nuevo'
  | 'clientes-detalle'
  | 'inventario'
  | 'articulos'
  | 'creditos'
  | 'pagos'
  | 'plan-pro'
  | 'contactos'
  | 'perfil-empresa'
  | 'perfil-negocio'
  | 'configuracion'
  | 'perfil'
  | 'historial';

export type UserContext = {
  role: AppRole; // from useUserRole
  companyId?: string | null; // if route requires company, presence implies membership context
};

// Route metadata: which routes are company-scoped and required minimum role
const companyRoutes = new Set<RouteKey>([
  'crear-factura', 'facturas', 'clientes', 'clientes-nuevo', 'clientes-detalle', 'articulos', 'pagos', 'historial', 'perfil-empresa', 'perfil-negocio', 'configuracion'
]);

const adminOnly = new Set<RouteKey>(['perfil-empresa', 'perfil-negocio', 'configuracion', 'clientes-nuevo', 'clientes-detalle']);

export function canAccess(route: RouteKey, user: UserContext): boolean {
  // 1) Global superadmin override
  if (user.role === 'superadmin') return true;

  // 2) If route is company-scoped but we lack company context, do not block hard: allow admins, restrict cajera
  const requiresCompany = companyRoutes.has(route);

  // 3) Admins can access everything except future superadmin-only areas (none here)
  if (user.role === 'admin') return true;

  // 4) Cajera: limited modules only
  if (user.role === 'cajera') {
    if (adminOnly.has(route)) return false; // cannot access settings
    return ['crear-factura', 'clientes', 'articulos', 'historial', 'pagos'].includes(route);
  }

  // default deny
  return false;
}
