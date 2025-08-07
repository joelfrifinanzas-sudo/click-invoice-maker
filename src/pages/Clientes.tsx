import { Layout } from "@/components/Layout";
import { ModuleHeader } from "@/components/ModuleHeader";
import { useScrollToTop } from "@/hooks/useScrollToTop";

export default function Clientes() {
  useScrollToTop();
  
  return (
    <Layout>
      <div className="container-responsive py-8">
        <div className="space-y-6">
          <ModuleHeader
            title="Clientes"
            description="Administra tu base de datos de clientes"
          />
          
          <div className="bg-card border rounded-lg p-6 text-center">
            <p className="text-muted-foreground">
              Módulo de clientes en desarrollo
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}