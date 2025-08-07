import { Layout } from "@/components/Layout";
import { ModuleHeader } from "@/components/ModuleHeader";

export default function Inventario() {
  return (
    <Layout>
      <div className="container-responsive py-8">
        <div className="space-y-6">
          <ModuleHeader
            title="Inventario"
            description="Controla tu inventario y productos"
          />
          
          <div className="bg-card border rounded-lg p-6 text-center">
            <p className="text-muted-foreground">
              Módulo de inventario en desarrollo
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}