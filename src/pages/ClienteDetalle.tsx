import { Layout } from "@/components/Layout";
import { ModuleHeader } from "@/components/ModuleHeader";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { ClientForm } from "@/components/clients/ClientForm";
import { useNavigate, useParams } from "react-router-dom";
import * as React from "react";
import { getClientById } from "@/data/clients";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClienteDetalle() {
  useScrollToTop();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [client, setClient] = React.useState<any>(null);

  React.useEffect(() => {
    document.title = "Clientes | Detalle";
  }, []);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) return;
      const { data, error } = await getClientById(id);
      if (!mounted) return;
      setClient(data);
      setError(error);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [id]);

  return (
    <Layout>
      <div className="container-responsive py-8">
        <div className="space-y-6">
          <ModuleHeader title="Clientes" description="Ver/editar cliente" />

          <div className="bg-card border rounded-lg p-6">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : error ? (
              <p className="text-destructive">{error}</p>
            ) : client ? (
              <ClientForm
                initialData={client}
                onSaved={(c, action) => {
                  if (action === 'save-create-invoice') {
                    navigate(`/crear-factura?clientId=${c.id}`);
                  } else {
                    // Stay on detail
                    navigate(`/clientes/${c.id}`);
                  }
                }}
              />
            ) : (
              <p className="text-muted-foreground">Cliente no encontrado</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
