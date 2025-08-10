import { Layout } from "@/components/Layout";
import { ModuleHeader } from "@/components/ModuleHeader";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { ClientForm } from "@/components/clients/ClientForm";
import { useNavigate } from "react-router-dom";
import * as React from "react";

export default function ClientesNuevo() {
  useScrollToTop();
  const navigate = useNavigate();

  React.useEffect(() => {
    document.title = "Clientes | Nuevo";
  }, []);

  return (
    <Layout>
      <div className="container-responsive py-8">
        <div className="space-y-6">
          <ModuleHeader title="Clientes" description="Crear nuevo cliente" />

          <div className="bg-card border rounded-lg p-6">
            <ClientForm
              onSaved={(c, action) => {
                if (action === 'save-create-invoice') {
                  navigate(`/crear-factura?clientId=${c.id}`);
                } else {
                  navigate(`/clientes/${c.id}`);
                }
              }}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
