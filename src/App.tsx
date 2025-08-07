import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import History from "./pages/History";
import { CompanyProfilePage } from "./pages/CompanyProfile";
import NotFound from "./pages/NotFound";

// Placeholder pages for the sidebar routes
const PrinterConfig = () => <div className="p-8"><h1 className="text-2xl font-bold">Configuración de Impresora</h1><p>Funcionalidad en desarrollo...</p></div>;
const TicketDesign = () => <div className="p-8"><h1 className="text-2xl font-bold">Diseño del Ticket</h1><p>Funcionalidad en desarrollo...</p></div>;
const SystemSettings = () => <div className="p-8"><h1 className="text-2xl font-bold">Parámetros del Sistema</h1><p>Funcionalidad en desarrollo...</p></div>;
const Backup = () => <div className="p-8"><h1 className="text-2xl font-bold">Respaldo de Datos</h1><p>Funcionalidad en desarrollo...</p></div>;

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/history" element={<History />} />
          <Route path="/perfil-empresa" element={<CompanyProfilePage />} />
          <Route path="/printer-config" element={<PrinterConfig />} />
          <Route path="/ticket-design" element={<TicketDesign />} />
          <Route path="/system-settings" element={<SystemSettings />} />
          <Route path="/backup" element={<Backup />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
