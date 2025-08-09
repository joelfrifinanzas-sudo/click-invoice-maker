import { useEffect, useState } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AccountPanelTrigger } from "@/components/AccountPanel";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
export function Header() {
  const { toggleSidebar } = useSidebar();
  const [time, setTime] = useState<string>("");
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const isMobile = useIsMobile();
  const [appsOpen, setAppsOpen] = useState(false);

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
              <SheetContent side="bottom" className="h-[100vh] p-0">
                <SheetHeader className="px-4 py-3 border-b">
                  <SheetTitle>Módulos</SheetTitle>
                </SheetHeader>
                <div className="p-4">
                  <p className="text-sm text-muted-foreground">Launcher de módulos (placeholder)</p>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="h-14 rounded-md bg-muted" />
                    <div className="h-14 rounded-md bg-muted" />
                    <div className="h-14 rounded-md bg-muted" />
                    <div className="h-14 rounded-md bg-muted" />
                    <div className="h-14 rounded-md bg-muted" />
                    <div className="h-14 rounded-md bg-muted" />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </>
        ) : (
          <Popover open={appsOpen} onOpenChange={setAppsOpen}>
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
            <PopoverContent align="end" className="w-80 p-0">
              <div className="p-3 border-b">
                <p className="text-sm font-medium">Módulos</p>
                <p className="text-xs text-muted-foreground">Launcher (placeholder)</p>
              </div>
              <div className="p-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="h-12 rounded-md bg-muted" />
                  <div className="h-12 rounded-md bg-muted" />
                  <div className="h-12 rounded-md bg-muted" />
                  <div className="h-12 rounded-md bg-muted" />
                  <div className="h-12 rounded-md bg-muted" />
                  <div className="h-12 rounded-md bg-muted" />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}

        <AccountPanelTrigger>
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
        </AccountPanelTrigger>
      </div>
    </header>
  );
}
