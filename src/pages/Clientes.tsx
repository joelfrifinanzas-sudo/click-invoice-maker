import * as React from "react";
import { Layout } from "@/components/Layout";
import { ModuleHeader } from "@/components/ModuleHeader";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentContext } from "@/data/utils";
import { useNavigate } from "react-router-dom";
import { NuevoClienteDialog } from "@/components/clientes/NuevoClienteDialog";
type Cliente = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  archived: boolean;
  created_at: string;
};

export default function Clientes() {
  useScrollToTop();
  const navigate = useNavigate();
  const [search, setSearch] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const [page, setPage] = React.useState(1);
  const pageSize = 20;
  const [rows, setRows] = React.useState<Cliente[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [nuevoOpen, setNuevoOpen] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  React.useEffect(() => {
    document.title = "Clientes";
  }, []);

  React.useEffect(() => {
    let mounted = true;
    
    const fetchClientes = async () => {
      setLoading(true);
      try {
        const ctx = await getCurrentContext();
        if (!ctx.data || !mounted) return;

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
          .from("clients")
          .select("*", { count: "exact" })
          .eq("company_id", ctx.data.companyId)
          .eq("status", "active")
          .eq("archived", false)
          .order("created_at", { ascending: false })
          .range(from, to);

        if (debounced.trim()) {
          const term = `%${debounced.trim()}%`;
          query = query.or(`name.ilike.${term},email.ilike.${term},phone.ilike.${term}`);
        }

        const { data, error, count } = await query;
        if (error) throw error;
        
        if (mounted) {
          setRows((data as Cliente[]) || []);
          setTotal(count || 0);
        }
      } catch (error) {
        console.error("Error fetching clientes:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchClientes();
    return () => { mounted = false; };
  }, [debounced, page, refreshKey]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Layout>
      <div className="container-responsive py-8">
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <ModuleHeader title="Clientes" description="Administra tu base de datos de clientes" showBackButton={false} />
            <Button onClick={() => setNuevoOpen(true)}>+ Nuevo</Button>
          </div>

          <div className="bg-card border rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
              <Input
                placeholder="Buscar por nombre, RNC/Cédula o correo"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>

            {/* Mobile list */}
            <div className="sm:hidden space-y-3">
              {loading ? (
                <p className="text-muted-foreground">Cargando...</p>
              ) : rows.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-muted-foreground mb-4">No hay clientes aún</p>
                  <Button onClick={() => navigate('/clientes/nuevo')}>Crear primer cliente</Button>
                </div>
              ) : (
                rows.map((c) => (
                     <button key={c.id} onClick={() => navigate(`/clientes/${c.id}`)} className="w-full text-left border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                     <div className="flex items-center justify-between">
                       <div>
                         <div className="font-medium">{c.name}</div>
                         <div className="text-muted-foreground text-sm">—</div>
                         <div className="text-muted-foreground text-sm">{c.email || '—'} • {c.phone || '—'}</div>
                       </div>
                       <Badge variant={c.status === 'active' && !c.archived ? 'default' : 'secondary'}>{c.status === 'active' && !c.archived ? 'Activo' : 'Inactivo'}</Badge>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block">
              <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Nombre</TableHead>
                     <TableHead>Documento</TableHead>
                     <TableHead>Correo</TableHead>
                     <TableHead>Teléfono</TableHead>
                     <TableHead>Estado</TableHead>
                   </TableRow>
                 </TableHeader>
                <TableBody>
                   {loading ? (
                     <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Cargando...</TableCell></TableRow>
                   ) : rows.length === 0 ? (
                     <TableRow>
                       <TableCell colSpan={5} className="text-center">
                         <div className="py-8">
                           <p className="text-muted-foreground mb-4">No hay clientes aún</p>
                           <Button onClick={() => setNuevoOpen(true)}>Crear primer cliente</Button>
                         </div>
                       </TableCell>
                     </TableRow>
                  ) : (
                      rows.map((c) => (
                        <TableRow key={c.id} className="cursor-pointer" onClick={() => navigate(`/clientes/${c.id}`)}>
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell>—</TableCell>
                          <TableCell>{c.email || '—'}</TableCell>
                          <TableCell>{c.phone || '—'}</TableCell>
                          <TableCell>
                            <Badge variant={c.status === 'active' && !c.archived ? 'default' : 'secondary'}>
                              {c.status === 'active' && !c.archived ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)); }} />
                  </PaginationItem>
                  {Array.from({ length: totalPages }).slice(0, 5).map((_, i) => {
                    const p = i + 1;
                    return (
                      <PaginationItem key={p}>
                        <PaginationLink href="#" isActive={p === page} onClick={(e) => { e.preventDefault(); setPage(p); }}>
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(totalPages, p + 1)); }} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </div>
      </div>
      <NuevoClienteDialog open={nuevoOpen} onOpenChange={setNuevoOpen} onCreated={() => setRefreshKey((k) => k + 1)} />
    </Layout>
  );
}
