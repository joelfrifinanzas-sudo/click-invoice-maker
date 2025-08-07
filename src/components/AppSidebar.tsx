import { useState } from "react";
import { 
  Building2, 
  Settings, 
  History, 
  Printer, 
  FileText, 
  HelpCircle,
  Download,
  Palette,
  User
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { 
    title: "Perfil de Empresa", 
    url: "/perfil-empresa", 
    icon: Building2,
    description: "Configurar datos del negocio"
  },
  { 
    title: "Historial de Facturas", 
    url: "/history", 
    icon: History,
    description: "Ver facturas anteriores"
  },
  { 
    title: "Configuración de Impresora", 
    url: "/printer-config", 
    icon: Printer,
    description: "Ajustar opciones de impresión"
  },
  { 
    title: "Diseño del Ticket", 
    url: "/ticket-design", 
    icon: Palette,
    description: "Personalizar apariencia del PDF"
  },
  { 
    title: "Parámetros del Sistema", 
    url: "/system-settings", 
    icon: Settings,
    description: "Configuración general"
  },
  { 
    title: "Respaldo de Datos", 
    url: "/backup", 
    icon: Download,
    description: "Exportar historial"
  },
];

const supportItems = [
  { 
    title: "Ayuda y Soporte", 
    url: "#", 
    icon: HelpCircle,
    description: "Obtener asistencia"
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  const getNavClassName = (path: string) => {
    return isActive(path) 
      ? "bg-primary text-primary-foreground font-medium shadow-sm" 
      : "hover:bg-accent hover:text-accent-foreground transition-colors";
  };

  return (
    <Sidebar className={state === "collapsed" ? "w-16" : "w-80"}>
      <SidebarHeader className="p-6 border-b border-sidebar-border">
        {state !== "collapsed" && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-sidebar-foreground">
                Click Invoice Maker
              </h2>
              <p className="text-sm text-sidebar-foreground/60">
                Facturas Digitales RD
              </p>
            </div>
          </div>
        )}
        {state === "collapsed" && (
          <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto">
            <FileText className="w-5 h-5 text-white" />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-4 py-6">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/80 font-medium mb-2">
            {state !== "collapsed" ? "Gestión" : ""}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <NavLink 
                    to={item.url} 
                    className={`${getNavClassName(item.url)} flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200`}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {state !== "collapsed" && (
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {item.title}
                        </div>
                        <div className="text-xs opacity-60 truncate">
                          {item.description}
                        </div>
                      </div>
                    )}
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-8">
          <SidebarGroupLabel className="text-sidebar-foreground/80 font-medium mb-2">
            {state !== "collapsed" ? "Soporte" : ""}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {supportItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <a 
                    href={item.url}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 hover:bg-accent hover:text-accent-foreground"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {state !== "collapsed" && (
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {item.title}
                        </div>
                        <div className="text-xs opacity-60 truncate">
                          {item.description}
                        </div>
                      </div>
                    )}
                  </a>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}