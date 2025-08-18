import { useState, useEffect, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

interface Member {
  user_id: string;
  email: string;
  full_name: string | null;
  role: string;
  status: string;
  company_id: string;
}

interface MembersTableProps {
  companyId: string;
  canEditRoles: boolean;
  refreshTrigger?: number;
}

export function MembersTable({ companyId, canEditRoles, refreshTrigger }: MembersTableProps) {
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);

  const fetchMembers = async () => {
    if (!companyId) return;
    
    setLoading(true);
    try {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('user_company')
        .select(`
          user_id,
          role,
          profiles!inner(email, full_name)
        `, { count: 'exact' })
        .eq('company_id', companyId)
        .order('profiles.email')
        .range(from, to);

      if (search.trim()) {
        query = query.ilike('profiles.email', `%${search.trim()}%`);
      }

      const { data, error, count } = await query;
      
      if (error) throw error;

      const formattedData = (data || []).map((item: any) => ({
        user_id: item.user_id,
        email: item.profiles?.email || '',
        full_name: item.profiles?.full_name || null,
        role: item.role,
        status: 'active',
        company_id: companyId
      }));
      setMembers(formattedData);
      setTotal(count || 0);
    } catch (error: any) {
      toast({
        title: "Error al cargar miembros",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [companyId, page, search, refreshTrigger]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!canEditRoles) return;

    try {
      const { error } = await supabase
        .from('user_company')
        .update({ role: newRole })
        .eq('user_id', userId)
        .eq('company_id', companyId);

      if (error) throw error;

      toast({
        title: "Rol actualizado",
        description: "El cambio se ha guardado exitosamente"
      });

      // Update local state optimistically
      setMembers(prev => 
        prev.map(member => 
          member.user_id === userId ? { ...member, role: newRole } : member
        )
      );
    } catch (error: any) {
      toast({
        title: "Error al actualizar rol",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(0); // Reset to first page when searching
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'default';
      case 'cajera': return 'secondary';
      case 'cliente': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'default';
      case 'invited': return 'secondary';
      case 'disabled': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Miembros de la empresa</CardTitle>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar por email..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Cargando miembros...
                  </TableCell>
                </TableRow>
              ) : members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {search ? 'No se encontraron miembros con ese criterio' : 'No hay miembros en esta empresa'}
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow key={member.user_id}>
                    <TableCell className="font-medium">{member.email}</TableCell>
                    <TableCell>{member.full_name || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={getRoleBadgeVariant(member.role)}>
                          {member.role}
                        </Badge>
                        {canEditRoles && (
                          <Select
                            value={member.role}
                            onValueChange={(value) => handleRoleChange(member.user_id, value)}
                          >
                            <SelectTrigger className="w-24 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="cajera">Cajera</SelectItem>
                              <SelectItem value="cliente">Cliente</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(member.status)}>
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {/* Future actions can be added here */}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {total > pageSize && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {page * pageSize + 1} a {Math.min((page + 1) * pageSize, total)} de {total} miembros
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {page + 1} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page + 1 >= totalPages}
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}