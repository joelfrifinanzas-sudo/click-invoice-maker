import { NavLink } from "react-router-dom";
import { Home, Users, Plus, Clock, Package, User } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

export function BottomNavBar() {
  const { role } = useUserRole();
  const adminItems = [
    { label: "Inicio", to: "/inicio", icon: Home, isCenter: false },
    { label: "Clientes", to: "/clientes", icon: Users, isCenter: false },
    { label: "", to: "/crear-factura", icon: Plus, isCenter: true },
    { label: "Historial", to: "/historial", icon: Clock, isCenter: false },
    { label: "Artículos", to: "/articulos", icon: Package, isCenter: false },
  ];
  const cajeraItems = adminItems.filter(i => i.label !== 'Artículos');
  const clienteItems = [
    { label: "Portal", to: "/portal", icon: User, isCenter: false },
  ];
  const navItems = role === 'superadmin' || role === 'admin' ? adminItems : role === 'cajera' ? cajeraItems : clienteItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t border-border px-4 py-2 safe-area-pb">
      <div className="flex items-center justify-around max-w-sm mx-auto">
        {navItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                item.isCenter
                  ? "w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
                  : `px-3 py-2 touch-target ${
                      isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
                    }`
              }`
            }
          >
            <item.icon className={`${item.isCenter ? "w-6 h-6" : "w-5 h-5"} flex-shrink-0`} />
            {item.label && (
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}