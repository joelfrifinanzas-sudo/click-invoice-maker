import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { CreateUserModal } from "@/components/users/CreateUserModal";
import { MembersTable } from "@/components/users/MembersTable";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users } from "lucide-react";

export default function UsuariosPermisos() {
  const { companyId, memberRole } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const canEditRoles = memberRole === 'ADMIN' || memberRole === 'SUPER_ADMIN';
  const canCreateUsers = memberRole === 'ADMIN' || memberRole === 'SUPER_ADMIN';

  useEffect(() => {
    document.title = "Usuarios y permisos | Gestión de miembros";
  }, []);

  const handleUserCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (!companyId) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay empresa seleccionada</h3>
                <p className="text-muted-foreground">
                  Debes tener una empresa configurada para gestionar usuarios.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Usuarios y Permisos</h1>
            <p className="text-muted-foreground mt-1">
              Gestiona los miembros de tu empresa y sus roles de acceso
            </p>
          </div>
          
          {canCreateUsers && (
            <CreateUserModal
              companyId={companyId}
              onUserCreated={handleUserCreated}
              disabled={!canCreateUsers}
            />
          )}
        </div>

        <MembersTable
          companyId={companyId}
          canEditRoles={canEditRoles}
          refreshTrigger={refreshTrigger}
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Información sobre roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-green-700 mb-2">Admin</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Gestión completa de usuarios</li>
                  <li>• Acceso a configuración empresarial</li>
                  <li>• Reportes y estadísticas</li>
                  <li>• Todas las funciones del sistema</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-blue-700 mb-2">Cajera</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Crear y editar facturas</li>
                  <li>• Gestionar pagos y cobros</li>
                  <li>• Consultar información de clientes</li>
                  <li>• Acceso a inventario básico</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2">Cliente</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Ver sus propias facturas</li>
                  <li>• Consultar estado de pagos</li>
                  <li>• Actualizar información personal</li>
                  <li>• Acceso limitado a datos propios</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

