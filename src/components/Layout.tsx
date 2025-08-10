import { ReactNode, useRef } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { BottomNavBar } from "@/components/BottomNavBar";
import { useAutoHideHeader } from "@/hooks/useAutoHideHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { BackButton } from "@/components/BackButton";

interface LayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
  hideBackButton?: boolean;
}

export function Layout({ children, showSidebar = true, hideBackButton = false }: LayoutProps) {
  const mainRef = useRef<HTMLElement | null>(null);
  useAutoHideHeader({ containerRef: mainRef });
  const isMobile = useIsMobile();
  const shouldShowSidebar = showSidebar && !isMobile;

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen w-full flex main-layout">
        {shouldShowSidebar && <AppSidebar />}
        <Header />
        {!hideBackButton && (
          <div className="fixed top-2 left-14 z-header">
            <BackButton />
          </div>
        )}
        
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
