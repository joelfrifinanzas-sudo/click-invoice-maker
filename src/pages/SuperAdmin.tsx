import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const sections = [
  { key: "empresas", label: "Empresas" },
  { key: "usuarios", label: "Usuarios (directorio)" },
  { key: "planes", label: "Planes y Límites" },
  { key: "auditoria", label: "Auditoría" },
  { key: "sistema", label: "Configuración del sistema" },
] as const;

type SectionKey = typeof sections[number]["key"];

export default function SuperAdmin() {
  const [active, setActive] = useState<SectionKey>("empresas");

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

  const content = useMemo(() => {
    switch (active) {
      case "empresas":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Empresas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">Listado y gestión de compañías (solo visible para Super Admin).</p>
            </CardContent>
          </Card>
        );
      case "usuarios":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Directorio de Usuarios</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Búsqueda y gestión básica de usuarios.</p>
            </CardContent>
          </Card>
        );
      case "planes":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Planes y Límites</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Visión general de planes, límites y asignaciones.</p>
            </CardContent>
          </Card>
        );
      case "auditoria":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Auditoría</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Eventos clave del sistema para control y trazabilidad.</p>
            </CardContent>
          </Card>
        );
      case "sistema":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Configuración del sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Parámetros globales y mantenimiento.</p>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  }, [active]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-4">
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
