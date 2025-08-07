import { useEffect } from 'react';
import { useNavigation } from '@/contexts/NavigationContext';

export function useScrollToTop() {
  const { isFromDashboard, clearDashboardNavigation } = useNavigation();

  useEffect(() => {
    if (isFromDashboard) {
      // Scroll to top immediately
      window.scrollTo(0, 0);
      // Also ensure any scrollable containers are reset
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      
      // Clear the flag after scrolling
      clearDashboardNavigation();
    }
  }, [isFromDashboard, clearDashboardNavigation]);

  return { isFromDashboard };
}