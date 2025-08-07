import { Layout } from "@/components/Layout";
import { ModuleHeader } from "@/components/ModuleHeader";
import { useScrollToTop } from "@/hooks/useScrollToTop";

export default function Creditos() {
  useScrollToTop();
  
  return (
    <Layout>
      <div className="container-responsive py-8">
        <div className="space-y-6">
          <ModuleHeader
            title="Créditos"
            description="Gestiona facturas a crédito y saldos pendientes"
          />
          
          <div className="bg-card border rounded-lg p-6 text-center">
            <p className="text-muted-foreground">
              Módulo de créditos en desarrollo
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}