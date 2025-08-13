import * as React from "react";
import { Layout } from "@/components/Layout";
import { ModuleHeader } from "@/components/ModuleHeader";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { listClients, Client } from "@/data/clients";
import { useNavigate } from "react-router-dom";
import { NuevoClienteDialog } from "@/components/clientes/NuevoClienteDialog";
export default function Clientes() {
  useScrollToTop();
  const navigate = useNavigate();
  const [search, setSearch] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const [page, setPage] = React.useState(1);
  const pageSize = 20;
  const [rows, setRows] = React.useState<Client[]>([]);
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
    setLoading(true);
    listClients({ search: debounced, page, pageSize }).then(({ data, total }) => {
      if (!mounted) return;
      setRows(data);
      setTotal(total);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [debounced, page, refreshKey]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Layout>
      <div className="container-responsive py-8">
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <ModuleHeader title="Clientes" description="Administra tu base de datos de clientes" showBackButton={false} />
            <div className="flex gap-2">
              <Button onClick={() => setNuevoOpen(true)}>Nuevo cliente</Button>
              <Button onClick={() => navigate('/clientes/nuevo')}>+ Nuevo</Button>
            </div>
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
                        <div className="font-medium">{c.nombre_visualizacion}</div>
                        <div className="text-muted-foreground text-sm">{c.tipo_cliente} • {c.documento || '—'}</div>
                        <div className="text-muted-foreground text-sm">{c.email || '—'} • {c.telefono_movil || c.telefono_laboral || '—'}</div>
                      </div>
                      <Badge variant={c.activo ? 'default' : 'secondary'}>{c.activo ? 'Activo' : 'Inactivo'}</Badge>
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
                    <TableHead>Nombre de visualización</TableHead>
                    <TableHead>Tipo de cliente</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Cargando...</TableCell></TableRow>
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        <div className="py-8">
                          <p className="text-muted-foreground mb-4">No hay clientes aún</p>
                          <Button onClick={() => navigate('/clientes/nuevo')}>Crear primer cliente</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((c) => (
                      <TableRow key={c.id} className="cursor-pointer" onClick={() => navigate(`/clientes/${c.id}`)}>
                        <TableCell className="font-medium">{c.nombre_visualizacion}</TableCell>
                        <TableCell>{c.tipo_cliente}</TableCell>
                        <TableCell>{c.documento || '—'}</TableCell>
                        <TableCell>{c.email || '—'}</TableCell>
                        <TableCell>{c.telefono_movil || c.telefono_laboral || '—'}</TableCell>
                        <TableCell>
                          <Badge variant={c.activo ? 'default' : 'secondary'}>
                            {c.activo ? 'Activo' : 'Inactivo'}
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
