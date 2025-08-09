export type UserRole = 'admin' | 'supervisor' | 'cajero';

const ROLE_STORAGE_KEY = 'user-role';

export const getUserRole = (): UserRole => {
  try {
    const stored = localStorage.getItem(ROLE_STORAGE_KEY) as UserRole | null;
    return stored ?? 'admin';
  } catch {
    return 'admin';
  }
};

export const setUserRole = (role: UserRole) => {
  try {
    localStorage.setItem(ROLE_STORAGE_KEY, role);
  } catch {
    // noop
  }
};

// Allowed modules by role (labels must match the launcher labels exactly)
const SUPERVISOR_ALLOWED = new Set<string>([
  'Cotizaciones',
  'Nueva factura',
  'Clientes',
  'Productos',
  'Historial',
  'Reportes',
  'Inventario',
  'Pagos',
  'Perfil de la empresa',
  'Marca y preferencias',
  // Excluye: 'Gestión de usuarios', 'Métodos de pago'
]);

const CAJERO_ALLOWED = new Set<string>([
  'Cotizaciones',
  'Nueva factura',
  'Clientes',
  'Productos',
  'Historial',
  'Pagos',
]);

export const hasPermission = (label: string): boolean => {
  const role = getUserRole();
  if (role === 'admin') return true;
  if (role === 'supervisor') return SUPERVISOR_ALLOWED.has(label);
  return CAJERO_ALLOWED.has(label);
};
