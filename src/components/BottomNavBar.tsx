import { NavLink } from "react-router-dom";
import { Home, Users, Plus, Clock, Package } from "lucide-react";

interface BottomNavBarProps {
  onCreateInvoice?: () => void;
}

export function BottomNavBar({ onCreateInvoice }: BottomNavBarProps) {
  const navItems = [
    {
      label: "Inicio",
      to: "/",
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
      to: "",
      icon: Plus,
      isCenter: true,
      action: onCreateInvoice,
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
          item.isCenter ? (
            <button
              key={index}
              onClick={item.action}
              className="flex flex-col items-center justify-center transition-colors duration-200 w-14 h-14 bg-[#007bff] rounded-full text-white shadow-lg hover:bg-[#0056b3]"
            >
              <item.icon className="w-6 h-6 flex-shrink-0" />
            </button>
          ) : (
            <NavLink
              key={index}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center transition-colors duration-200 px-3 py-2 ${
                  isActive
                    ? "text-[#007bff]"
                    : "text-gray-500 hover:text-[#007bff]"
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.label && (
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              )}
            </NavLink>
          )
        ))}
      </div>
    </nav>
  );
}