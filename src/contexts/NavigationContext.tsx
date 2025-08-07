import { createContext, useContext, useState, ReactNode } from 'react';

interface NavigationContextType {
  isFromDashboard: boolean;
  setIsFromDashboard: (value: boolean) => void;
  markDashboardNavigation: () => void;
  clearDashboardNavigation: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [isFromDashboard, setIsFromDashboard] = useState(false);

  const markDashboardNavigation = () => {
    setIsFromDashboard(true);
  };

  const clearDashboardNavigation = () => {
    setIsFromDashboard(false);
  };

  return (
    <NavigationContext.Provider 
      value={{ 
        isFromDashboard, 
        setIsFromDashboard, 
        markDashboardNavigation, 
        clearDashboardNavigation 
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}