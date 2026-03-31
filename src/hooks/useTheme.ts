import { useState, useCallback, useEffect } from 'react';
import { getSettings, saveSettings } from '@/lib/templateStorage';

export type ThemeMode = 'light' | 'dark' | 'system';

function getSystemPreference(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(mode: ThemeMode) {
  const resolved = mode === 'system' ? getSystemPreference() : mode;
  // The app uses inverted logic: class "dark" = light colors
  document.documentElement.classList.toggle('dark', resolved === 'light');
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(
    () => (getSettings().theme as ThemeMode) || 'light'
  );

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    saveSettings({ ...getSettings(), theme: newTheme });
    applyTheme(newTheme);
  }, []);

  // Legacy toggle for simple use cases
  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }, [theme, setTheme]);

  // Listen for system preference changes when in "system" mode
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  return { theme, setTheme, toggleTheme };
}
