import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Users, UserCheck, UserX, FileText, CheckCircle, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface Stats {
  total: number;
  active: number;
  trial: number;
  expired: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, trial: 0, expired: 0 });
  const [proposalStats, setProposalStats] = useState({ sent: 0, approved: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [statsRes, proposalsRes] = await Promise.all([
          supabase.rpc('admin_get_stats'),
          supabase.from('events').select('event_type', { count: 'exact', head: false }),
        ]);
        if (statsRes.data) setStats(statsRes.data as unknown as Stats);

        // Count proposal events
        if (proposalsRes.data) {
          const sent = proposalsRes.data.filter((e: any) => e.event_type === 'proposal_sent').length;
          const approved = proposalsRes.data.filter((e: any) => e.event_type === 'proposal_approved').length;
          setProposalStats({ sent, approved });
        }
      } catch {
        toast.error('Erro ao carregar estatísticas');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const approvalRate = proposalStats.sent > 0
    ? ((proposalStats.approved / proposalStats.sent) * 100).toFixed(1)
    : '0';

  const cards = [
    { label: 'Total de Usuários', value: stats.total, icon: Users, color: 'text-foreground' },
    { label: 'Ativos (Pro/Premium)', value: stats.active, icon: UserCheck, color: 'text-emerald-500' },
    { label: 'Trial', value: stats.trial, icon: UserCheck, color: 'text-amber-500' },
    { label: 'Expirados', value: stats.expired, icon: UserX, color: 'text-destructive' },
    { label: 'Propostas Enviadas', value: proposalStats.sent, icon: FileText, color: 'text-primary' },
    { label: 'Taxa de Aprovação', value: `${approvalRate}%`, icon: TrendingUp, color: 'text-emerald-500' },
  ];

  return (
    <AdminLayout title="Dashboard" description="Visão geral da plataforma">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c) => (
            <div key={c.label} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <c.icon className={`h-4 w-4 ${c.color}`} />
                <span className="text-xs text-muted-foreground">{c.label}</span>
              </div>
              <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
