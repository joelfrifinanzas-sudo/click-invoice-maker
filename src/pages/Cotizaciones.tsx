import { Layout } from "@/components/Layout";
import { ModuleHeader } from "@/components/ModuleHeader";

export default function Cotizaciones() {
  return (
    <Layout>
      <div className="container-responsive py-8">
        <div className="space-y-6">
          <ModuleHeader
            title="Cotizaciones"
            description="Gestiona y crea cotizaciones para tus clientes"
          />
          
          <div className="bg-card border rounded-lg p-6 text-center">
            <p className="text-muted-foreground">
              Módulo de cotizaciones en desarrollo
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}