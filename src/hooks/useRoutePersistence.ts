import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ROUTE_STORAGE_KEY = 'facturaclick_last_route';

export function useRoutePersistence() {
  const location = useLocation();
  const navigate = useNavigate();

  // Save current route to localStorage
  useEffect(() => {
    // Don't save the root route or NotFound routes
    if (location.pathname !== '/' && location.pathname !== '*') {
      localStorage.setItem(ROUTE_STORAGE_KEY, location.pathname);
    }
  }, [location.pathname]);

  // Restore last route on app initialization
  const restoreLastRoute = () => {
    const lastRoute = localStorage.getItem(ROUTE_STORAGE_KEY);
    if (lastRoute && lastRoute !== '/' && location.pathname === '/') {
      navigate(lastRoute, { replace: true });
    }
  };

  return { restoreLastRoute };
}