import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Building2, Users } from "lucide-react";

interface Membership {
  company_id: string;
  company_name: string;
  role: string;
}

interface CompanyRoleSelectorProps {
  memberships: Membership[];
  selectedCompany: string;
  selectedRole: string;
  onCompanyChange: (companyId: string) => void;
  onRoleChange: (role: string) => void;
  onContinue: () => void;
  loading?: boolean;
}

export function CompanyRoleSelector({
  memberships,
  selectedCompany,
  selectedRole,
  onCompanyChange,
  onRoleChange,
  onContinue,
  loading = false
}: CompanyRoleSelectorProps) {
  const selectedMembership = memberships.find(m => m.company_id === selectedCompany);
  
  const getAvailableRoles = (membershipRole: string): Array<{ value: string; label: string; description: string }> => {
    const role = membershipRole.toLowerCase();
    
    const allRoles = [
      { value: 'admin', label: 'Administrador', description: 'Acceso completo a la gestión empresarial' },
      { value: 'cajera', label: 'Cajera', description: 'Facturación y cobros' },
      { value: 'cliente', label: 'Cliente', description: 'Acceso limitado solo a información personal' }
    ];

    // Filter roles based on membership permissions
    if (role === 'admin' || role === 'owner') {
      return allRoles;
    } else if (role === 'cajera') {
      return allRoles.filter(r => ['cajera', 'cliente'].includes(r.value));
    } else {
      return allRoles.filter(r => r.value === 'cliente');
    }
  };

  const availableRoles = selectedMembership ? getAvailableRoles(selectedMembership.role) : [];

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Building2 className="w-5 h-5" />
          Seleccionar contexto
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Elige la empresa y rol para continuar
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="company">Empresa</Label>
          <Select value={selectedCompany} onValueChange={onCompanyChange}>
            <SelectTrigger id="company">
              <SelectValue placeholder="Selecciona una empresa" />
            </SelectTrigger>
            <SelectContent>
              {memberships.map((membership) => (
                <SelectItem key={membership.company_id} value={membership.company_id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{membership.company_name}</span>
                    <Badge variant="secondary" className="ml-2">
                      {membership.role}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedMembership && (
          <div className="space-y-2">
            <Label htmlFor="role">Rol de acceso</Label>
            <Select value={selectedRole} onValueChange={onRoleChange}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    <div className="space-y-1">
                      <div className="font-medium">{role.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {role.description}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {selectedMembership && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4" />
              <span className="font-medium">Permisos del rol {selectedRole}:</span>
            </div>
            <ul className="mt-2 text-xs text-muted-foreground space-y-1">
              {selectedRole === 'admin' && (
                <>
                  <li>• Gestión completa de usuarios y configuración</li>
                  <li>• Acceso a todos los módulos empresariales</li>
                  <li>• Reportes y estadísticas avanzadas</li>
                </>
              )}
              {selectedRole === 'cajera' && (
                <>
                  <li>• Crear y gestionar facturas</li>
                  <li>• Registrar pagos y cobros</li>
                  <li>• Consultar información de clientes</li>
                </>
              )}
              {selectedRole === 'cliente' && (
                <>
                  <li>• Ver sus propias facturas y pagos</li>
                  <li>• Actualizar información de contacto</li>
                  <li>• Acceso limitado solo a datos personales</li>
                </>
              )}
            </ul>
          </div>
        )}

        <Button 
          onClick={onContinue}
          disabled={!selectedCompany || !selectedRole || loading}
          className="w-full"
        >
          {loading ? "Cargando..." : "Continuar"}
        </Button>
      </CardContent>
    </Card>
  );
}