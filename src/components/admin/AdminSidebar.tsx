import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, Palette, Mail, ScrollText,
  Activity, Webhook, Zap, CreditCard, Settings, ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const sections = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { id: 'users', label: 'Usuários', icon: Users, path: '/admin/users' },
  { id: 'documents', label: 'Documentos', icon: FileText, path: '/admin/documents' },
  { id: 'templates', label: 'Templates', icon: Palette, path: '/admin/templates' },
  { id: 'emails', label: 'Emails', icon: Mail, path: '/admin/emails' },
  { id: 'email-logs', label: 'Email Logs', icon: ScrollText, path: '/admin/email-logs' },
  { id: 'events', label: 'Eventos', icon: Activity, path: '/admin/events' },
  { id: 'webhooks', label: 'Webhooks', icon: Webhook, path: '/admin/webhooks' },
  { id: 'webhook-logs', label: 'Webhook Logs', icon: ScrollText, path: '/admin/webhook-logs' },
  { id: 'automations', label: 'Automações', icon: Zap, path: '/admin/automations' },
  { id: 'plans', label: 'Planos & Billing', icon: CreditCard, path: '/admin/plans' },
  { id: 'settings', label: 'Configurações', icon: Settings, path: '/admin/settings' },
];

export default function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-card h-full">
      <div className="flex items-center gap-2 px-4 py-4 border-b border-border">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate('/dashboard')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-sm font-semibold text-foreground">Admin Panel</h2>
      </div>
      <ScrollArea className="flex-1 py-2">
        <nav className="flex flex-col gap-0.5 px-2">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => navigate(s.path)}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors text-left',
                isActive(s.path)
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <s.icon className="h-4 w-4 shrink-0" />
              {s.label}
            </button>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}
