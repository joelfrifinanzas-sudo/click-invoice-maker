import { Layout } from "@/components/Layout";

export default function AccessDenied() {
  return (
    <Layout>
      <div className="container-responsive py-16 text-center">
        <h1 className="text-2xl font-semibold mb-2">Acceso denegado</h1>
        <p className="text-muted-foreground">No tienes permisos para acceder a este módulo.</p>
      </div>
    </Layout>
  );
}
