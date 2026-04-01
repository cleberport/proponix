import { LayoutGrid, FileText, Inbox, LogOut, Shield, Sun, Moon, Monitor, Users, Mail, Zap, ScrollText, Palette } from 'lucide-react';
import freeloxLogo from '@/assets/freelox_logo.webp';
import { NavLink } from '@/components/NavLink';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useTheme, type ThemeMode } from '@/hooks/useTheme';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import FinanceSidebarSection from '@/components/financas/FinanceSidebarSection';

const items = [
  { title: 'Templates', url: '/dashboard', icon: LayoutGrid },
  { title: 'Documentos', url: '/documents', icon: FileText },
  { title: 'Recebidos', url: '/recebidos', icon: Inbox },
];


export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const { theme, setTheme } = useTheme();

  const themeOptions: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'system', label: 'Sistema', icon: Monitor },
  ];

  const isActive = (path: string) => currentPath === path;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Você saiu da conta');
    navigate('/');
  };

  const adminItems = (!adminLoading && isAdmin)
    ? [{ title: 'Admin', url: '/admin', icon: Shield }]
    : [];

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarContent>
        {/* Logo */}
        <div className={`flex items-center gap-2.5 px-4 pt-6 pb-6 ${collapsed ? 'justify-center px-2' : ''}`}>
          <img src={freeloxLogo} alt="Freelox" className="h-8 w-8 shrink-0 rounded-lg" />
          {!collapsed && (
            <span className="text-xl font-bold tracking-tight text-foreground">Freelox</span>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end className="hover:bg-muted/50" activeClassName="bg-muted text-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Finanças section with nested folders/tables */}
        <FinanceSidebarSection />

        {!adminLoading && isAdmin && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={currentPath.startsWith('/admin')}>
                    <NavLink to="/admin" end={false} className="hover:bg-muted/50" activeClassName="bg-muted text-primary font-medium">
                      <Shield className="mr-2 h-4 w-4" />
                      {!collapsed && <span>Admin</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size={collapsed ? "icon" : "default"}
              className={collapsed ? "w-full justify-center text-muted-foreground" : "w-full justify-start text-muted-foreground"}
            >
              <Palette className="h-4 w-4" />
              {!collapsed && <span className="ml-2">Aparência</span>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-40">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Aparência</DropdownMenuLabel>
            {themeOptions.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={theme === opt.value ? 'bg-primary/10 text-primary font-medium' : ''}
              >
                <opt.icon className="mr-2 h-4 w-4" />
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
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
