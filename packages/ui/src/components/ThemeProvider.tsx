import React, { useEffect } from 'react';
import '../theme.css';

export interface ThemeProviderProps {
  children: React.ReactNode;
  themeOverrides?: Record<string, string>;
}

export function ThemeProvider({ children, themeOverrides }: ThemeProviderProps): JSX.Element {
  useEffect(() => {
    if (themeOverrides) {
      const root = globalThis.document?.documentElement;
      if (!root) return;
      Object.entries(themeOverrides).forEach(([key, value]) => {
        root.style.setProperty(key, value);
      });
    }
  }, [themeOverrides]);

  return <>{children}</>;
}
