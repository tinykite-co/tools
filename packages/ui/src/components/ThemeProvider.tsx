import React, { useEffect } from 'react';
import '../theme.css';

export interface ThemeProviderProps {
  children: React.ReactNode;
  themeOverrides?: Record<string, string>;
}

export function ThemeProvider({ children, themeOverrides }: ThemeProviderProps) {
  useEffect(() => {
    if (themeOverrides) {
      const root = document.documentElement;
      Object.entries(themeOverrides).forEach(([key, value]) => {
        root.style.setProperty(key, value);
      });
    }
  }, [themeOverrides]);

  return <>{children}</>;
}
