import { Layout } from "@/components/Layout";
import { ModuleHeader } from "@/components/ModuleHeader";

export default function Pagos() {
  return (
    <Layout>
      <div className="container-responsive py-8">
        <div className="space-y-6">
          <ModuleHeader
            title="Pagos"
            description="Registra y gestiona los pagos recibidos"
          />
          
          <div className="bg-card border rounded-lg p-6 text-center">
            <p className="text-muted-foreground">
              Módulo de pagos en desarrollo
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}