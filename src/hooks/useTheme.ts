import { useState, useCallback } from 'react';
import { getSettings, saveSettings } from '@/lib/templateStorage';

export function useTheme() {
  const [theme, setThemeState] = useState<'light' | 'dark'>(
    () => (getSettings().theme as 'light' | 'dark') || 'light'
  );

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setThemeState(newTheme);
    saveSettings({ ...getSettings(), theme: newTheme });
    document.documentElement.classList.toggle('dark', newTheme === 'light');
  }, [theme]);

  return { theme, toggleTheme };
}
