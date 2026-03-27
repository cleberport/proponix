import { LayoutDashboard, FileText, User, Settings, Clock, LogOut, FileUp, Shield } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const items = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Importar', url: '/import', icon: FileUp },
  { title: 'Documentos', url: '/documents', icon: Clock },
  
  { title: 'Perfil', url: '/profile', icon: User },
  { title: 'Configurações', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { isAdmin } = useAdminCheck();

  const isActive = (path: string) => currentPath === path;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Você saiu da conta');
    navigate('/');
  };

  const allItems = isAdmin
    ? [...items, { title: 'Admin', url: '/admin', icon: Shield }]
    : items;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {!collapsed && (
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
                  <FileText className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                <span className="text-xs font-semibold"><span className="text-xs font-semibold">Freelox</span></span>
              </div>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {allItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-muted/50"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {!collapsed && <span>Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
