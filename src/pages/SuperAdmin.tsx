import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CompanyForm from "@/components/superadmin/CompanyForm";
import UsersDirectory from "@/components/superadmin/UsersDirectory";

const sections = [
  { key: "empresas", label: "Empresas" },
  { key: "usuarios", label: "Usuarios (directorio)" },
  { key: "planes", label: "Planes y Límites" },
  { key: "auditoria", label: "Auditoría" },
  { key: "sistema", label: "Configuración del sistema" },
] as const;

type SectionKey = typeof sections[number]["key"];

type Company = {
  id: string;
  name: string;
  rnc: string | null;
  phone: string | null;
  address: string | null;
  currency: string;
  itbis_rate: number;
  created_at: string;
  active: boolean;
  plan: string;
  limit_invoices_per_month: number | null;
  limit_users: number | null;
};

export default function SuperAdmin() {
  const [active, setActive] = useState<SectionKey>("empresas");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);

  // SEO basics for SPA
  useEffect(() => {
    document.title = "Super Admin | Panel";
    const desc = "Panel Super Admin: empresas, usuarios, planes, auditoría y configuración";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", desc);
    else {
      const m = document.createElement("meta");
      m.setAttribute("name", "description");
      m.setAttribute("content", desc);
      document.head.appendChild(m);
    }
    // canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.origin + "/super-admin";
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("su_companies_list");
    if (!error && data) setCompanies(data as Company[]);
    setLoading(false);
  };

  useEffect(() => {
    if (active === "empresas") {
      fetchCompanies();
    }
  }, [active]);

  const handleNew = () => {
    setEditing(null);
    setOpen(true);
  };

  const handleEdit = (c: Company) => {
    setEditing(c);
    setOpen(true);
  };

  const handleToggleActive = async (c: Company) => {
    await supabase.rpc("su_company_set_active", { _company_id: c.id, _active: !c.active });
    fetchCompanies();
  };

  const onSaved = () => {
    setOpen(false);
    fetchCompanies();
  };

  const content = useMemo(() => {
    if (active === "usuarios") {
      return <UsersDirectory />;
    }
    if (active !== "empresas") {
      return (
        <Card>
          <CardHeader>
            <CardTitle>{sections.find((s) => s.key === active)?.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Próximamente…</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Empresas</h2>
          <Button onClick={handleNew}>Nueva empresa</Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre comercial</TableHead>
                  <TableHead>RNC</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Fecha de creación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.rnc || "-"}</TableCell>
                    <TableCell>
                      <span className={"inline-flex items-center px-2 py-1 rounded text-xs " + (c.active ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300")}>{c.active ? "Activo" : "Inactivo"}</span>
                    </TableCell>
                    <TableCell>{c.plan}</TableCell>
                    <TableCell>{new Date(c.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(c)}>Ver/Editar</Button>
                      <Button variant="secondary" size="sm" onClick={() => handleToggleActive(c)}>
                        {c.active ? "Desactivar" : "Activar"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && companies.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">Sin empresas</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar empresa" : "Nueva empresa"}</DialogTitle>
            </DialogHeader>
            <CompanyForm company={editing || undefined} onSaved={onSaved} />
          </DialogContent>
        </Dialog>
      </div>
    );
  }, [active, companies, loading, open, editing]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Panel Super Admin</h1>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
        <aside className="md:sticky md:top-16 self-start">
          <nav aria-label="Super Admin" className="space-y-1">
            {sections.map((s) => (
              <button
                key={s.key}
                onClick={() => setActive(s.key)}
                aria-current={active === s.key ? "page" : undefined}
                className={
                  "w-full text-left px-3 py-2 rounded-md transition-colors border border-transparent " +
                  (active === s.key
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted")
                }
              >
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        <section>
          <div className="space-y-4">
            {content}
            <Separator />
            <p className="text-xs text-muted-foreground">
              Acceso restringido: Solo usuarios con rol global Super Admin.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
