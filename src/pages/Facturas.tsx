import { Layout } from "@/components/Layout";
import { ModuleHeader } from "@/components/ModuleHeader";

export default function Facturas() {
  return (
    <Layout>
      <div className="container-responsive py-8">
        <div className="space-y-6">
          <ModuleHeader
            title="Facturas"
            description="Gestiona todas tus facturas emitidas"
          />
          
          <div className="bg-card border rounded-lg p-6 text-center">
            <p className="text-muted-foreground">
              Módulo de facturas en desarrollo
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}