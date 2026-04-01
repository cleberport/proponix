import { LayoutGrid, FileText, Inbox, Settings, Sun, Moon, Monitor, DollarSign, Palette } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTheme, type ThemeMode } from '@/hooks/useTheme';
import { useState } from 'react';

const items = [
  { label: 'Início', path: '/dashboard', icon: LayoutGrid },
  { label: 'Docs', path: '/documents', icon: FileText },
  { label: 'Inbox', path: '/recebidos', icon: Inbox },
  { label: 'Fin', path: '/financas', icon: DollarSign },
];

const themeOptions: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'system', label: 'Sistema', icon: Monitor },
];

export default function MobileNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { theme, setTheme } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  return (
    <>
      {/* Theme picker overlay */}
      {showThemeMenu && (
        <div className="fixed inset-0 z-[60]" onClick={() => setShowThemeMenu(false)}>
          <div
            className="absolute bottom-16 left-1/2 -translate-x-1/2 rounded-xl border border-border/60 bg-background/95 p-1.5 shadow-xl backdrop-blur-xl safe-area-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground">Aparência</p>
            {themeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setTheme(opt.value); setShowThemeMenu(false); }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                  theme === opt.value ? 'bg-primary/10 text-primary font-medium' : 'text-foreground/80 hover:bg-muted/60'
                )}
              >
                <opt.icon className="h-4 w-4" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="flex items-stretch justify-around">
          {items.map((item) => {
            const active = pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'flex flex-1 flex-col items-center gap-0.5 py-2 pt-2.5 text-[11px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-foreground/70'
                )}
              >
                <item.icon className={cn('h-5 w-5', active && 'text-primary')} />
                <span>{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => setShowThemeMenu((v) => !v)}
            className="flex flex-1 flex-col items-center gap-0.5 py-2 pt-2.5 text-[11px] font-medium text-foreground/70 transition-colors"
          >
            <Palette className="h-5 w-5" />
            <span>Tema</span>
          </button>
          <button
            onClick={() => navigate('/settings')}
            className={cn(
              'flex flex-1 flex-col items-center gap-0.5 py-2 pt-2.5 text-[11px] font-medium transition-colors',
              pathname === '/settings' ? 'text-primary' : 'text-foreground/70'
            )}
          >
            <Settings className={cn('h-5 w-5', pathname === '/settings' && 'text-primary')} />
            <span>Config</span>
          </button>
        </div>
      </nav>
    </>
  );
}
