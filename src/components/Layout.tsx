import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { FileText, Menu } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export function Layout({ children, showSidebar = true }: LayoutProps) {
  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen w-full flex">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 bg-white/95 backdrop-blur-sm border-b border-border flex items-center justify-between px-6 shadow-soft sticky top-0 z-50">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="h-10 w-10 p-0 flex flex-col items-center justify-center gap-1 hover:bg-muted rounded-lg transition-colors">
                <div className="w-4 h-0.5 bg-current rounded-full transition-all"></div>
                <div className="w-4 h-0.5 bg-current rounded-full transition-all"></div>
                <div className="w-4 h-0.5 bg-current rounded-full transition-all"></div>
              </SidebarTrigger>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-md">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-foreground">
                    Click Invoice Maker
                  </h1>
                  <p className="text-sm text-muted-foreground font-medium">
                    Facturas Digitales República Dominicana
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  <p className="text-sm font-semibold text-foreground">Sistema DGII Conectado</p>
                </div>
                <p className="text-xs text-muted-foreground">NCF Automático • República Dominicana</p>
              </div>
              
              <div className="sm:hidden flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-success">DGII</span>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}