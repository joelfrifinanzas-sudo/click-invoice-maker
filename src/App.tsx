import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AppConfigProvider } from "./contexts/AppConfigContext";
import { NavigationProvider } from "./contexts/NavigationContext";
import { useRoutePersistence } from "./hooks/useRoutePersistence";
import { useEffect } from "react";
import Index from "./pages/Index";
import Inicio from "./pages/Inicio";
import History from "./pages/History";
import { CompanyProfilePage } from "./pages/CompanyProfile";
import { BusinessProfilePage } from "./pages/PerfilNegocio";
import PlanPro from "./pages/PlanPro";
import Contactos from "./pages/Contactos";
import Configuracion from "./pages/Configuracion";
import Perfil from "./pages/Perfil";
import Cotizaciones from "./pages/Cotizaciones";
import CotizacionPublic from "./pages/CotizacionPublic";
import Facturas from "./pages/Facturas";
import CrearFactura from "./pages/CrearFactura";
import Clientes from "./pages/Clientes";
import ClientesNuevo from "./pages/ClientesNuevo";
import ClienteDetalle from "./pages/ClienteDetalle";
import Inventario from "./pages/Inventario";
import Articulos from "./pages/Articulos";
import Creditos from "./pages/Creditos";
import Pagos from "./pages/Pagos";
import NotFound from "./pages/NotFound";
import FacturaDetalle from "./pages/FacturaDetalle";
import UsuariosPermisos from "./pages/UsuariosPermisos";
import { useIsMobile } from "./hooks/use-mobile";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { RequireAccess } from "./components/RequireAccess";
import AccessDenied from "./pages/AccessDenied";
import { RequireSuperAdmin } from "./components/RequireSuperAdmin";
import SuperAdmin from "./pages/SuperAdmin";

import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import { RequireClient } from "./components/RequireClient";
import { InactivityLogout } from "./components/security/InactivityLogout";

const queryClient = new QueryClient();

function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function AppRoutes() {
  const { restoreLastRoute } = useRoutePersistence();

  useEffect(() => {
    // Restore last route on app initialization
    restoreLastRoute();
  }, [restoreLastRoute]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Protected app area */}
      <Route path="/app" element={<ProtectedRoute />}>
        <Route path="inicio" element={<Inicio />} />
      </Route>

      {/* Public & RBAC routes */}
      <Route path="/" element={<Index />} />
      <Route path="/inicio" element={<RequireAccess routeKey="inicio"><Inicio /></RequireAccess>} />
      <Route path="/cotizaciones" element={<RequireAccess routeKey="cotizaciones"><Cotizaciones /></RequireAccess>} />
      <Route path="/c/:publicId" element={<CotizacionPublic />} />
      <Route path="/facturas" element={<RequireAccess routeKey="facturas"><Facturas /></RequireAccess>} />
      <Route path="/crear-factura" element={<RequireAccess routeKey="crear-factura"><CrearFactura /></RequireAccess>} />
      <Route path="/clientes" element={<RequireAccess routeKey="clientes"><Clientes /></RequireAccess>} />
      <Route path="/clientes/nuevo" element={<RequireAccess routeKey="clientes-nuevo"><ClientesNuevo /></RequireAccess>} />
      <Route path="/clientes/:id" element={<RequireAccess routeKey="clientes-detalle"><ClienteDetalle /></RequireAccess>} />
      <Route path="/inventario" element={<RequireAccess routeKey="inventario"><Inventario /></RequireAccess>} />
      <Route path="/articulos" element={<RequireAccess routeKey="articulos"><Articulos /></RequireAccess>} />
      <Route path="/creditos" element={<RequireAccess routeKey="creditos"><Creditos /></RequireAccess>} />
      <Route path="/pagos" element={<RequireAccess routeKey="pagos"><Pagos /></RequireAccess>} />
      <Route path="/usuarios" element={<RequireAccess routeKey="configuracion"><UsuariosPermisos /></RequireAccess>} />
      <Route path="/plan-pro" element={<RequireAccess routeKey="plan-pro"><PlanPro /></RequireAccess>} />
      <Route path="/contactos" element={<RequireAccess routeKey="contactos"><Contactos /></RequireAccess>} />
      <Route path="/perfil-empresa" element={<RequireAccess routeKey="perfil-empresa"><CompanyProfilePage /></RequireAccess>} />
      <Route path="/perfil-negocio" element={<RequireAccess routeKey="perfil-negocio"><BusinessProfilePage /></RequireAccess>} />
      <Route path="/configuracion" element={<RequireAccess routeKey="configuracion"><Configuracion /></RequireAccess>} />
      <Route path="/perfil" element={<RequireAccess routeKey="perfil"><Perfil /></RequireAccess>} />
      <Route path="/historial" element={<RequireAccess routeKey="historial"><History /></RequireAccess>} />
      <Route path="/history" element={<RequireAccess routeKey="historial"><History /></RequireAccess>} />

      {/* Super Admin area */}
      <Route path="/super-admin" element={<RequireSuperAdmin><SuperAdmin /></RequireSuperAdmin>} />
      <Route path="/admin/tenants" element={<RequireSuperAdmin><SuperAdmin /></RequireSuperAdmin>} />

      {/* Client portal */}
      <Route path="/portal" element={<RequireClient><div style={{padding:'4rem 1rem'}}><h1 className="text-2xl font-semibold">Portal del cliente</h1><p className="text-muted-foreground mt-2">Aquí verás tus facturas, cotizaciones y pagos.</p></div></RequireClient>} />

      <Route path="/acceso-denegado" element={<AccessDenied />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function MobileDetector() {
  useIsMobile();
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppConfigProvider>
      <NavigationProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <MobileDetector />
          <ErrorBoundary>
            <AuthProvider>
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </AuthProvider>
          </ErrorBoundary>
        </TooltipProvider>
      </NavigationProvider>
    </AppConfigProvider>
  </QueryClientProvider>
);

export default App;
