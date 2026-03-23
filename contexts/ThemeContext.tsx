import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export const darkColors = {
  background: '#101722',
  surface: '#182434',
  surfaceAlt: '#1e2e42',
  border: '#314868',
  borderSoft: '#243044',
  textPrimary: '#ffffff',
  textSecondary: '#90a9cb',
  textMuted: '#4a6080',
  textDim: '#64748b',
  primary: '#0d6cf2',
  chevron: '#3d5270',
  inputBg: '#101722',
  inputPlaceholder: '#90a9cb',
  badgeBg: '#182434',
  badgeBorder: '#314868',
  navBg: 'rgba(16,23,34,0.96)',
  navBorder: 'rgba(255,255,255,0.08)',
  navInactive: '#6b7280',
};

export const lightColors = {
  background: '#f5f7f8',
  surface: '#ffffff',
  surfaceAlt: '#f1f5f9',
  border: '#e2e8f0',
  borderSoft: '#cbd5e1',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  textDim: '#94a3b8',
  primary: '#0d6cf2',
  chevron: '#94a3b8',
  inputBg: '#f8fafc',
  inputPlaceholder: '#94a3b8',
  badgeBg: '#ffffff',
  badgeBorder: '#e2e8f0',
  navBg: 'rgba(255,255,255,0.96)',
  navBorder: 'rgba(0,0,0,0.08)',
  navInactive: '#94a3b8',
};

export type AppColors = typeof darkColors;

interface ThemeContextValue {
  isDark: boolean;
  colors: AppColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: true,
  colors: darkColors,
  toggleTheme: () => {},
});

const THEME_STORAGE_KEY = 'gr_theme';

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((val) => {
      if (val === 'light') setIsDark(false);
    });
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      AsyncStorage.setItem(THEME_STORAGE_KEY, next ? 'dark' : 'light');
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ isDark, colors: isDark ? darkColors : lightColors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useAppTheme = () => useContext(ThemeContext);
