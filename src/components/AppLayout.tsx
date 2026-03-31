import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { FinanceProvider } from '@/contexts/FinanceContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import ExpiredOverlay from '@/components/ExpiredOverlay';
import { AppSidebar } from '@/components/AppSidebar';
import MobileNav from '@/components/MobileNav';
import { useIsMobile } from '@/hooks/use-mobile';
import { Search, Bell, User, Settings, LogOut, Eye, CheckCircle, MessageSquare, Clock, ChevronDown, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useNotifications, AppNotification } from '@/hooks/useNotifications';
import { useTheme } from '@/hooks/useTheme';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';

const NOTIF_ICONS: Record<AppNotification['type'], typeof Eye> = {
  viewed: Eye,
  approved: CheckCircle,
  negotiation: MessageSquare,
  expired: Clock,
};

const NOTIF_COLORS: Record<AppNotification['type'], string> = {
  viewed: 'text-blue-400',
  approved: 'text-emerald-400',
  negotiation: 'text-amber-400',
  expired: 'text-muted-foreground',
};

function TopBar() {
  const navigate = useNavigate();
  const [profileName, setProfileName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const email = data.user.email || '';
        const name = data.user.user_metadata?.full_name || email.split('@')[0] || '';
        setProfileName(name);

        // Try Gravatar from email
        if (email) {
          // Use a simple hash approach for gravatar
          const gravatarUrl = `https://www.gravatar.com/avatar/${simpleHash(email.trim().toLowerCase())}?d=404&s=80`;
          setAvatarUrl(gravatarUrl);
        }
      }
    });
  }, []);

  const initials = profileName
    ? profileName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Você saiu da conta');
    navigate('/');
  };

  return (
    <header className="h-14 flex items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 shrink-0">
      <div className="flex items-center gap-3 flex-1">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />

        {/* Search bar */}
        <div className="relative max-w-md flex-1 hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar templates..."
            className="pl-9 h-9 bg-muted/40 border-border/50 focus:bg-muted/60"
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Theme toggle */}
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun className="h-4 w-4 text-muted-foreground" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
        </Button>
        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 relative">
              <Bell className="h-4 w-4 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#ff2e5f] text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <span className="text-sm font-semibold text-foreground">Notificações</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-primary hover:underline"
                >
                  Limpar todas
                </button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Nenhuma notificação
                </div>
              ) : (
                notifications.map((notif) => {
                  const Icon = NOTIF_ICONS[notif.type];
                  const colorClass = NOTIF_COLORS[notif.type];
                  return (
                    <button
                      key={notif.id}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border/30 last:border-0"
                      onClick={() => {
                        if (notif.documentId) navigate('/documents');
                      }}
                    >
                      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${colorClass}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground leading-tight">{notif.message}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatTimeAgo(notif.createdAt)}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 ml-1 rounded-lg px-2 py-1 hover:bg-muted/50 transition-colors outline-none">
              <AvatarDisplay avatarUrl={avatarUrl} initials={initials} />
              <span className="text-sm font-medium text-foreground hidden md:block">{profileName || 'Usuário'}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden md:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User className="mr-2 h-4 w-4" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function AvatarDisplay({ avatarUrl, initials }: { avatarUrl: string; initials: string }) {
  const [imgError, setImgError] = useState(false);

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt="Avatar"
        className="h-8 w-8 rounded-full object-cover"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
      {initials}
    </div>
  );
}

// Simple hash for gravatar (md5 alternative using Web Crypto not needed — gravatar supports SHA256)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(32, '0');
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `${diffMin}min atrás`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h atrás`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return 'ontem';
  if (diffD < 7) return `${diffD} dias atrás`;
  return date.toLocaleDateString('pt-BR');
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <FinanceProvider>
        <div className="min-h-screen flex flex-col w-full pb-14">
          <ExpiredGuard />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
          <MobileNav />
        </div>
      </FinanceProvider>
    );
  }

  return (
    <FinanceProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <TopBar />
            <ExpiredGuard />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </FinanceProvider>
  );
}

function ExpiredGuard() {
  const { isExpired } = useSubscription();
  return <ExpiredOverlay show={isExpired} />;
}
