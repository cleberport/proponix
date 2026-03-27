import { LayoutDashboard, FileText, Settings, LogOut, FileUp } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const items = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Importar', path: '/import', icon: FileUp },
  { label: 'Docs', path: '/documents', icon: FileText },
  { label: 'Config', path: '/settings', icon: Settings },
];

export default function MobileNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Você saiu da conta');
    navigate('/');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md safe-area-bottom md:hidden">
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
          onClick={handleLogout}
          className="flex flex-1 flex-col items-center gap-0.5 py-2 pt-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-destructive"
        >
          <LogOut className="h-5 w-5" />
          <span>Sair</span>
        </button>
      </div>
    </nav>
  );
}
