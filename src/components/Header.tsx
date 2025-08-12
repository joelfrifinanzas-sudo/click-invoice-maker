import { useEffect, useState, useRef, useMemo } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Menu, FileText, FilePlus2, Users, Package, History, BarChart3, Boxes, Banknote, Building2, Palette, UserCog, CreditCard, Landmark, type LucideIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { hasPermission } from "@/utils/permissions";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentContext } from "@/data/utils";
import { getCurrentCompany } from "@/data/companyDb";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
export function Header() {
  const { toggleSidebar } = useSidebar();
  const [time, setTime] = useState<string>("");
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const isMobile = useIsMobile();
  const [appsOpen, setAppsOpen] = useState(false);

  // Empresa activa y selector de empresa
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [activeCompany, setActiveCompany] = useState<{ id: string; name: string } | null>(null);
  const [loadingCompanies, setLoadingCompanies] = useState<boolean>(true);

  const loadCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const ctx = await getCurrentContext();
      if (!ctx.data) { setLoadingCompanies(false); return; }

      const current = await getCurrentCompany();
      if (current.data) setActiveCompany({ id: current.data.id as any, name: (current.data as any).name });

      const { data: list, error } = await supabase
        .from("companies")
        .select("id,name,active")
        .order("created_at", { ascending: false });
      if (!error && list) {
        const mapped = (list as any[])
          .filter((c) => c.active !== false)
          .map((c) => ({ id: c.id, name: c.name }));
        setCompanies(mapped);
      }
    } finally {
      setLoadingCompanies(false);
    }
  };

  useEffect(() => { loadCompanies(); }, []);

  const onCompanyChange = async (companyId: string) => {
    try {
      const ctx = await getCurrentContext();
      if (!ctx.data) return;
      await supabase
        .from("users_profiles")
        .update({ company_id: companyId })
        .eq("id", ctx.data.user.id);
      const selected = companies.find((c) => c.id === companyId) || null;
      if (selected) setActiveCompany(selected);
      toast({ title: "Empresa cambiada", description: selected?.name ?? "Contexto actualizado" });
      // Refrescar toda la app para asegurar listas por contexto
      window.location.reload();
    } catch (e: any) {
      toast({ title: "Error cambiando empresa", description: e?.message ?? "Intenta de nuevo", variant: "destructive" });
    }
  };

  const modules: { label: string; Icon: LucideIcon }[] = useMemo(() => [
    { label: "Cotizaciones", Icon: FileText },
    { label: "Nueva factura", Icon: FilePlus2 },
    { label: "Clientes", Icon: Users },
    { label: "Productos", Icon: Package },
    { label: "Historial", Icon: History },
    { label: "Reportes", Icon: BarChart3 },
    { label: "Inventario", Icon: Boxes },
    { label: "Pagos", Icon: Banknote },
    { label: "Perfil del negocio", Icon: Landmark },
    { label: "Perfil de la empresa", Icon: Building2 },
    { label: "Marca y preferencias", Icon: Palette },
    { label: "Gestión de usuarios", Icon: UserCog },
    { label: "Métodos de pago", Icon: CreditCard },
  ], []);

  const { role } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut } = useAuth();
  const goUsers = () =>
    toast({
      title: "Conecta Supabase para gestionar usuarios",
      description: "Esta sección se habilitará al conectar tu proyecto de Supabase.",
    });
  const handleLogout = async () => {
    try { await signOut(); } catch {}
    navigate('/login', { replace: true });
  };
  const routesByLabel: Record<string, string | null> = {
    "Cotizaciones": "/cotizaciones",
    "Nueva factura": "/crear-factura",
    "Clientes": "/clientes",
    "Productos": "/articulos",
    "Historial": "/historial",
    "Reportes": null,
    "Inventario": "/inventario",
    "Pagos": "/pagos",
    "Perfil del negocio": "/perfil-negocio",
    "Perfil de la empresa": "/perfil-empresa",
    "Marca y preferencias": "/configuracion",
    "Gestión de usuarios": null,
    "Métodos de pago": null,
  };
  const visibleModules = useMemo(() => {
    if (!appsOpen) return [] as typeof modules;
    if (role === 'superadmin' || role === 'admin') return modules.filter((m) => routesByLabel[m.label]);
    if (role === 'cajera') return modules.filter((m) => !['Perfil del negocio','Perfil de la empresa','Marca y preferencias','Gestión de usuarios','Métodos de pago','Reportes'].includes(m.label));
    return [{ label: 'Clientes', Icon: Users }] as any; // show minimal for cliente
  }, [appsOpen, modules, role]);
  const onModuleClick = (label: string) => {
    const path = routesByLabel[label];
    if (!path) return;
    setAppsOpen(false);
    navigate(path);
  };

  const desktopGridRef = useRef<HTMLDivElement | null>(null);
  const mobileGridRef = useRef<HTMLDivElement | null>(null);

  const getColumns = (container: HTMLElement) => {
    const style = getComputedStyle(container);
    const cols = style.gridTemplateColumns?.split(" ").filter(Boolean).length || 1;
    return cols || 1;
  };

  const focusFirstItem = (container: HTMLElement | null | undefined) => {
    const firstBtn = container?.querySelector<HTMLButtonElement>('button[data-module-item="true"]');
    firstBtn?.focus();
  };

  const handleGridKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    const container = e.currentTarget as HTMLElement;
    const items = Array.from(container.querySelectorAll<HTMLButtonElement>('button[data-module-item="true"]'));
    if (!items.length) return;
    const active = document.activeElement as HTMLElement | null;
    let idx = items.findIndex((b) => b === active || (active ? b.contains(active) : false));
    if (idx < 0) idx = 0;

    const cols = getColumns(container);
    let next = idx;

    switch (e.key) {
      case 'ArrowRight':
        next = Math.min(idx + 1, items.length - 1);
        break;
      case 'ArrowLeft':
        next = Math.max(idx - 1, 0);
        break;
      case 'ArrowDown':
        next = Math.min(idx + cols, items.length - 1);
        break;
      case 'ArrowUp':
        next = Math.max(idx - cols, 0);
        break;
      case 'Enter':
        if (active && 'click' in active) (active as any).click?.();
        e.preventDefault();
        return;
      case 'Escape':
        setAppsOpen(false);
        return;
      default:
        return; // do not prevent default for other keys
    }

    items[next]?.focus();
    e.preventDefault();
  };

  useEffect(() => {
    const formatTime = (d: Date) =>
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    setTime(formatTime(new Date()));
    const id = setInterval(() => setTime(formatTime(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", update, { passive: true } as any);
    window.addEventListener("offline", update, { passive: true } as any);
    return () => {
      window.removeEventListener("online", update as any);
      window.removeEventListener("offline", update as any);
    };
  }, []);

  // Lock body scroll on mobile when launcher is open
  useEffect(() => {
    if (!isMobile) return;
    document.body.style.overflow = appsOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [appsOpen, isMobile]);

  const statusRingClass = isOnline
    ? "ring-[hsl(var(--status-online))]"
    : "ring-[hsl(var(--status-offline))]";

  return (
    <header
      data-app-header="true"
      className={"fixed top-0 left-0 right-0 z-header h-14 bg-background/95 backdrop-blur-sm border-b border-border flex items-center justify-between px-4 header-container transition-transform duration-200 header--visible"}
    >
      {/* Izquierda: Botón hamburguesa */}
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-9 w-9 text-[hsl(var(--header-hamburger))]"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Centro: Hora en tiempo real, centrada visualmente */}
      <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none select-none">
        <time className="text-sm font-medium tracking-tight" aria-live="polite">
          {time}
        </time>
      </div>

      {/* Derecha: Controles del header */}
      <div className="flex items-center gap-1.5">
        {isMobile ? (
          <>
            <Button
              id="testid:hdr-apps"
              variant="ghost"
              size="icon"
              aria-label="Módulos"
              title="Módulos"
              type="button"
              onClick={() => setAppsOpen(true)}
              className="h-9 w-9 text-[hsl(var(--header-hamburger))]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <circle cx="5" cy="5" r="1.5" />
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="19" cy="5" r="1.5" />
                <circle cx="5" cy="12" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="19" cy="12" r="1.5" />
                <circle cx="5" cy="19" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
                <circle cx="19" cy="19" r="1.5" />
              </svg>
            </Button>

            <Sheet open={appsOpen} onOpenChange={setAppsOpen}>
              <SheetContent side="bottom" className="h-[100vh] p-0 duration-200 data-[state=open]:duration-200 data-[state=closed]:duration-200" onOpenAutoFocus={(e) => { e.preventDefault(); focusFirstItem(mobileGridRef.current); }}>
                <div className="flex h-full flex-col">
                  <SheetHeader className="px-4 py-3 border-b">
                    <SheetTitle>Módulos</SheetTitle>
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto p-4">
                    <div
                      ref={mobileGridRef as any}
                      role="grid"
                      aria-label="Launcher de módulos"
                      onKeyDown={handleGridKeyDown}
                      className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-12 gap-3 animate-fade-in"
                    >
                      {visibleModules.map(({ label, Icon }) => (
                        <button
                          key={label}
                          type="button"
                          aria-label={label}
                          data-module-item="true"
                          onClick={() => onModuleClick(label)}
                           className="col-span-1 xl:col-span-3 rounded-md border bg-card hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 p-4 flex flex-col items-center justify-center gap-2 transition-colors duration-200 hover-scale"
                        >
                          <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                          <span className="text-sm text-foreground text-center">{label === 'Clientes' ? 'Clientes (facturación)' : label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </>
        ) : (
          <Popover open={appsOpen} onOpenChange={setAppsOpen} modal>
            <PopoverTrigger asChild>
              <Button
                id="testid:hdr-apps"
                variant="ghost"
                size="icon"
                aria-label="Módulos"
                title="Módulos"
                type="button"
                className="h-9 w-9 text-[hsl(var(--header-hamburger))]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <circle cx="5" cy="5" r="1.5" />
                  <circle cx="12" cy="5" r="1.5" />
                  <circle cx="19" cy="5" r="1.5" />
                  <circle cx="5" cy="12" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="19" cy="12" r="1.5" />
                  <circle cx="5" cy="19" r="1.5" />
                  <circle cx="12" cy="19" r="1.5" />
                  <circle cx="19" cy="19" r="1.5" />
                </svg>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[560px] max-h-[70vh] p-0" onOpenAutoFocus={(e) => { e.preventDefault(); focusFirstItem(desktopGridRef.current); }}>
              <div className="p-3 border-b">
                <p className="text-sm font-medium">Módulos</p>
                <p className="text-xs text-muted-foreground">Launcher (placeholder)</p>
              </div>
              <div className="p-3 overflow-y-auto">
                <div
                  ref={desktopGridRef as any}
                  role="grid"
                  aria-label="Launcher de módulos"
                  onKeyDown={handleGridKeyDown}
                  className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-12 gap-3 animate-fade-in"
                >
                    {visibleModules.map(({ label, Icon }) => (
                      <button
                        key={label}
                        type="button"
                        aria-label={label}
                        data-module-item="true"
                        onClick={() => onModuleClick(label)}
                        className="col-span-1 xl:col-span-3 rounded-md border bg-card hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 p-4 flex flex-col items-center justify-center gap-2 transition-colors duration-200 hover-scale"
                      >
                        <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                        <span className="text-sm text-foreground text-center">{label === 'Clientes' ? 'Clientes (facturación)' : label}</span>
                      </button>
                    ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
)}

        {/* Empresa activa: texto/selector */}
        <div className="hidden sm:flex items-center gap-2 mr-2">
          <span className="text-xs text-muted-foreground">Empresa activa:</span>
          {companies.length > 1 ? (
            <Select value={activeCompany?.id ?? undefined} onValueChange={onCompanyChange}>
              <SelectTrigger className="h-8 w-[220px]">
                <SelectValue placeholder={loadingCompanies ? "Cargando..." : "Selecciona empresa"} />
              </SelectTrigger>
              <SelectContent className="z-[1000]">
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="text-sm font-medium truncate max-w-[220px]">{activeCompany?.name ?? "—"}</span>
          )}
        </div>
        <div className="flex sm:hidden items-center mr-1">
          {companies.length > 1 ? (
            <Select value={activeCompany?.id ?? undefined} onValueChange={onCompanyChange}>
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder={loadingCompanies ? "Cargando..." : "Empresa"} />
              </SelectTrigger>
              <SelectContent className="z-[1000]">
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="text-xs font-medium truncate max-w-[140px]">{activeCompany?.name ?? ""}</span>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              id="testid:hdr-user"
              className={`rounded-full p-0.5 ring-2 ${statusRingClass} shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
              aria-label={isOnline ? "Conectado" : "Sin conexión"}
              title={isOnline ? "Conectado" : "Sin conexión"}
              type="button"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg" alt="Foto de perfil" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuItem onSelect={() => navigate('/perfil')}>Perfil</DropdownMenuItem>
            {(role === 'superadmin' || role === 'admin') && (
              <>
                <DropdownMenuItem onSelect={() => navigate('/perfil-empresa')}>Perfil de la empresa</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate('/configuracion')}>Marca y preferencias</DropdownMenuItem>
              </>
            )}
            {(role === 'superadmin' || role === 'admin') && (
              <>
                <DropdownMenuItem onSelect={goUsers}>Gestión de usuarios</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate('/pagos')}>Métodos de pago</DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate('/login')} >Cambiar contraseña</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout} className="text-destructive focus:text-destructive">Cerrar sesión</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
