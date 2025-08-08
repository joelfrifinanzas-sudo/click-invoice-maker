import { ReactNode, useRef } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { BottomNavBar } from "@/components/BottomNavBar";
import { useAutoHideHeader } from "@/hooks/useAutoHideHeader";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export function Layout({ children, showSidebar = true }: LayoutProps) {
  const mainRef = useRef<HTMLElement | null>(null);
  useAutoHideHeader({ containerRef: mainRef });
  const isMobile = useIsMobile();
  const shouldShowSidebar = showSidebar && !isMobile;

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen w-full flex main-layout">
        {shouldShowSidebar && <AppSidebar />}
        <Header />
        
        <div className="flex-1 flex flex-col overflow-visible">
          {/* Main Content */}
          <main
            ref={mainRef as any}
            className={`flex-1 overflow-auto transition-[padding] duration-300 pt-14 ${isMobile ? "pb-24" : "pb-6"} relative sidebar-content`}
          >
            {children}
          </main>
        </div>
        {isMobile && <BottomNavBar />}
      </div>
    </SidebarProvider>
  );
}
