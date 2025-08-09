import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";

export default function AccessDenied() {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <Layout>
      <div className="container-responsive py-16 text-center space-y-4">
        <h1 className="text-2xl font-semibold">Acceso denegado</h1>
        <p className="text-muted-foreground">No tienes permisos para acceder a este módulo.</p>
        <div>
          <Button onClick={() => navigate('/inicio')} size="sm">Volver al inicio</Button>
        </div>
        {location.state?.from && (
          <p className="text-xs text-muted-foreground">Ruta solicitada: {location.state.from}</p>
        )}
      </div>
    </Layout>
  );
}

