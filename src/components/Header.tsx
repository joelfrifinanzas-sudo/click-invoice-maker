import { useEffect, useState } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AccountPanelTrigger } from "@/components/AccountPanel";
export function Header() {
  const { toggleSidebar } = useSidebar();
  const [time, setTime] = useState<string>("");
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

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

      {/* Derecha: Avatar con aro de estado */}
      <AccountPanelTrigger>
        <button
          className={`rounded-full p-0.5 ring-2 ${statusRingClass} shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
          aria-label={isOnline ? "Conectado" : "Sin conexión"}
          title={isOnline ? "Conectado" : "Sin conexión"}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder.svg" alt="Foto de perfil" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </button>
      </AccountPanelTrigger>
    </header>
  );
}
