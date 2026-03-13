import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import MobileNav from '@/components/MobileNav';
import { useIsMobile } from '@/hooks/use-mobile';

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
          <header className="h-12 flex items-center border-b border-border bg-card px-2 md:px-4 shrink-0">
            <SidebarTrigger className="mr-2" />
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
