import { NavLink } from "react-router-dom";
import { Home, Users, Plus, Clock, Package } from "lucide-react";

export function BottomNavBar() {
  const navItems = [
    {
      label: "Inicio",
      to: "/inicio",
      icon: Home,
      isCenter: false,
    },
    {
      label: "Clientes",
      to: "/clientes",
      icon: Users,
      isCenter: false,
    },
    {
      label: "",
      to: "/crear-factura",
      icon: Plus,
      isCenter: true,
    },
    {
      label: "Historial",
      to: "/historial",
      icon: Clock,
      isCenter: false,
    },
    {
      label: "Artículos",
      to: "/articulos",
      icon: Package,
      isCenter: false,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-4 py-2 safe-area-pb">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center transition-colors duration-200 ${
                item.isCenter
                  ? "w-14 h-14 bg-[#007bff] rounded-full text-white shadow-lg hover:bg-[#0056b3]"
                  : `px-3 py-2 ${
                      isActive
                        ? "text-[#007bff]"
                        : "text-gray-500 hover:text-[#007bff]"
                    }`
              }`
            }
          >
            <item.icon
              className={`${
                item.isCenter ? "w-6 h-6" : "w-5 h-5"
              } flex-shrink-0`}
            />
            {item.label && (
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}