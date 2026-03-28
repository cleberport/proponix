import { LayoutGrid, FileText, Inbox, Settings, Sun, Moon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';

const items = [
  { label: 'Templates', path: '/dashboard', icon: LayoutGrid },
  { label: 'Documentos', path: '/documents', icon: FileText },
  { label: 'Recebidos', path: '/recebidos', icon: Inbox },
];

export default function MobileNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/90 backdrop-blur-xl safe-area-bottom md:hidden">
      <div className="flex items-stretch justify-around">
        {items.map((item) => {
          const active = pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2 pt-2.5 text-[11px] font-medium transition-colors',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5', active && 'text-primary')} />
              <span>{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={toggleTheme}
          className="flex flex-1 flex-col items-center gap-0.5 py-2 pt-2.5 text-[11px] font-medium text-muted-foreground transition-colors"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          <span>Tema</span>
        </button>
        <button
          onClick={() => navigate('/settings')}
          className={cn(
            'flex flex-1 flex-col items-center gap-0.5 py-2 pt-2.5 text-[11px] font-medium transition-colors',
            pathname === '/settings' ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          <Settings className={cn('h-5 w-5', pathname === '/settings' && 'text-primary')} />
          <span>Config</span>
        </button>
      </div>
    </nav>
  );
}
