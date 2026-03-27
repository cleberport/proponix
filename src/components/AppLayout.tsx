import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import MobileNav from '@/components/MobileNav';
import { useIsMobile } from '@/hooks/use-mobile';
import { Search, Bell, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function TopBar() {
  const [profileName, setProfileName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setEmail(data.user.email || '');
        setProfileName(data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || '');
      }
    });
  }, []);

  const initials = profileName
    ? profileName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : email?.[0]?.toUpperCase() || 'U';

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

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#ff2e5f] text-[10px] font-bold text-white">
            2
          </span>
        </Button>

        {/* Profile avatar */}
        <div className="flex items-center gap-2 ml-1 cursor-pointer rounded-lg px-2 py-1 hover:bg-muted/50 transition-colors">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {initials}
          </div>
          <span className="text-sm font-medium text-foreground hidden md:block">{profileName || 'Usuário'}</span>
        </div>
      </div>
    </header>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col w-full pb-14">
        <main className="flex-1 overflow-auto">
          {children}
        </main>
        <MobileNav />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
