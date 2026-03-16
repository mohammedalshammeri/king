import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ColorScheme = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  colorScheme: 'light' | 'dark';
  themeMode: ColorScheme;
  setThemeMode: (mode: ColorScheme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useRNColorScheme();
  const [themeMode, setThemeModeState] = useState<ColorScheme>('auto');
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(systemColorScheme || 'light');

  // Load saved theme preference
  useEffect(() => {
    loadTheme();
  }, []);

  // Update color scheme when theme mode or system preference changes
  useEffect(() => {
    if (themeMode === 'auto') {
      setColorScheme(systemColorScheme || 'light');
    } else {
      setColorScheme(themeMode);
    }
  }, [themeMode, systemColorScheme]);

  const loadTheme = async () => {
    try {
      const savedMode = await AsyncStorage.getItem('themeMode');
      if (savedMode && (savedMode === 'light' || savedMode === 'dark' || savedMode === 'auto')) {
        setThemeModeState(savedMode as ColorScheme);
      }
    } catch (error) {
      console.log('Error loading theme:', error);
    }
  };

  const setThemeMode = async (mode: ColorScheme) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem('themeMode', mode);
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        colorScheme,
        themeMode,
        setThemeMode,
        isDark: colorScheme === 'dark',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
