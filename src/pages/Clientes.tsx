import { Layout } from "@/components/Layout";

export default function Clientes() {
  return (
    <Layout>
      <div className="container-responsive py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-responsive-xl font-bold">Clientes</h1>
            <p className="text-muted-foreground mt-2">
              Administra tu base de datos de clientes
            </p>
          </div>
          
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