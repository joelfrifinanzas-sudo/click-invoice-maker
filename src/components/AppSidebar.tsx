import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { FileText, Receipt, Users, Package } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

const baseItems = [
  { title: "Cotizaciones", url: "/cotizaciones", icon: FileText },
  { title: "Facturas", url: "/facturas", icon: Receipt },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Inventario", url: "/inventario", icon: Package },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { role } = useUserRole();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path || currentPath.startsWith(path + "/");
  
  const getNavClassName = (path: string) => {
    return isActive(path) 
      ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium shadow-lg" 
      : "text-white hover:bg-slate-700/50 hover:text-white transition-all duration-200";
  };

  return (
    <Sidebar className={`${state === "collapsed" ? "w-16" : "w-64"} bg-slate-800 border-r-0`}>
      <SidebarContent className="bg-slate-800">
        <SidebarGroup className="px-2 py-4">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {(() => {
                if (role === 'superadmin' || role === 'admin') return baseItems;
                if (role === 'cajera') return baseItems.filter(i => i.title !== 'Inventario');
                // cliente: no sidebar
                return [] as typeof baseItems;
              })().map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-12">
                    <NavLink 
                      to={item.url} 
                      className={`${getNavClassName(item.url)} flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200`}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {state !== "collapsed" && <span className="font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}