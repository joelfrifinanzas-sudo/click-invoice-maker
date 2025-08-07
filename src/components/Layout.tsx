import { ReactNode } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";

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
      <div className="min-h-screen w-full flex main-layout">
        <AppSidebar />
        <Header />
        
        <div className="flex-1 flex flex-col overflow-visible">
          {/* Main Content */}
          <main className="flex-1 overflow-auto transition-[padding] duration-300 pt-14 relative sidebar-content">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}