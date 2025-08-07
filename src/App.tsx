import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppConfigProvider } from "./contexts/AppConfigContext";
import Index from "./pages/Index";
import Inicio from "./pages/Inicio";
import History from "./pages/History";
import { CompanyProfilePage } from "./pages/CompanyProfile";
import PlanPro from "./pages/PlanPro";
import Contactos from "./pages/Contactos";
import Configuracion from "./pages/Configuracion";
import Perfil from "./pages/Perfil";
import Cotizaciones from "./pages/Cotizaciones";
import Facturas from "./pages/Facturas";
import CrearFactura from "./pages/CrearFactura";
import Clientes from "./pages/Clientes";
import Inventario from "./pages/Inventario";
import Articulos from "./pages/Articulos";
import Creditos from "./pages/Creditos";
import Pagos from "./pages/Pagos";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppConfigProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/inicio" element={<Inicio />} />
            <Route path="/cotizaciones" element={<Cotizaciones />} />
            <Route path="/facturas" element={<Facturas />} />
            <Route path="/crear-factura" element={<CrearFactura />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/inventario" element={<Inventario />} />
            <Route path="/articulos" element={<Articulos />} />
            <Route path="/creditos" element={<Creditos />} />
            <Route path="/pagos" element={<Pagos />} />
            <Route path="/plan-pro" element={<PlanPro />} />
            <Route path="/contactos" element={<Contactos />} />
            <Route path="/perfil-empresa" element={<CompanyProfilePage />} />
            <Route path="/configuracion" element={<Configuracion />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/historial" element={<History />} />
            <Route path="/history" element={<History />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AppConfigProvider>
  </QueryClientProvider>
);

export default App;
