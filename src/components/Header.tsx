import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Settings, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function Header() {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-background border-b border-border flex items-center justify-between px-4">
      {/* Left side - Sidebar trigger */}
      <div className="flex items-center">
        <SidebarTrigger className="h-8 w-8" />
      </div>

      {/* Right side - Settings and User icons */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/configuracion')}
          className="h-8 w-8"
        >
          <Settings className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/perfil')}
          className="h-8 w-8"
        >
          <User className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}