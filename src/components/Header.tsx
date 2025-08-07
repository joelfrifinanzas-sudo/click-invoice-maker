import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Settings, User, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const navigate = useNavigate();
  const { open } = useSidebar();

  return (
    <header className={`fixed top-0 left-0 right-0 z-header h-14 bg-background/95 backdrop-blur-sm border-b border-border flex items-center justify-between px-4 header-container transition-transform duration-300 ${
      open ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
    }`}>
      {/* Left side - Sidebar trigger (visually swapped when open) */}
      <div className="flex items-center">
        <div className={`transition-transform duration-300 ${open ? 'translate-x-[calc(100vw-8rem)]' : 'translate-x-0'}`}>
          <SidebarTrigger className="h-8 w-8" />
        </div>
      </div>

      {/* Right side - Menu dropdown (visually swapped when open) */}
      <div className="flex items-center">
        <div className={`transition-transform duration-300 ${open ? '-translate-x-[calc(100vw-8rem)]' : 'translate-x-0'}`}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              sideOffset={8}
              className="w-48 z-dropdown bg-popover border border-border shadow-lg"
            >
              <DropdownMenuItem 
                onClick={() => navigate('/configuracion')}
                className="cursor-pointer flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                <span>Configuración</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => navigate('/perfil')}
                className="cursor-pointer flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                <span>Mi Perfil</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}