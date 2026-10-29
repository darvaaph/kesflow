'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface NavigationContextValue {
  isNavigating: boolean;
  targetPath: string | null;
  startNavigation: (href: string) => void;
}

const NavigationContext = createContext<NavigationContextValue>({
  isNavigating: false,
  targetPath: null,
  startNavigation: () => {},
});

export function NavigationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [targetPath, setTargetPath] = useState<string | null>(null);

  // When pathname changes, navigation has completed
  useEffect(() => {
    setTargetPath(null);
  }, [pathname]);

  // Safety fallback: if navigation takes longer than 3.5s, reset state
  useEffect(() => {
    if (!targetPath) return;
    const timer = setTimeout(() => {
      setTargetPath(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, [targetPath]);

  const startNavigation = (href: string) => {
    if (href !== pathname) {
      setTargetPath(href);
    }
  };

  const isNavigating = targetPath !== null && targetPath !== pathname;

  return (
    <NavigationContext.Provider
      value={{
        isNavigating,
        targetPath,
        startNavigation,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation(): NavigationContextValue {
  return useContext(NavigationContext);
}
