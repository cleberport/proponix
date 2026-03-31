import { useEffect, useState, useMemo } from 'react';
import FeatureGate from '@/components/FeatureGate';
import { Inbox, Search, X, Eye, CheckCircle, Clock, Send, MessageSquare, ExternalLink, User, DollarSign, CalendarDays } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

type DocStatus = 'enviado' | 'visualizado' | 'aprovado' | 'expirado' | 'negociacao';

const STATUS_CONFIG: Record<DocStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Send }> = {
  enviado: { label: 'Recebido', variant: 'secondary', icon: Send },
  visualizado: { label: 'Visualizado', variant: 'outline', icon: Eye },
  aprovado: { label: 'Aprovado', variant: 'default', icon: CheckCircle },
  negociacao: { label: 'Negociação', variant: 'outline', icon: MessageSquare },
  expirado: { label: 'Expirado', variant: 'destructive', icon: Clock },
};

const TABS = [
  { value: 'todos', label: 'Todos' },
  { value: 'visualizado', label: 'Visualizados' },
  { value: 'negociacao', label: 'Negociação' },
  { value: 'aprovado', label: 'Aprovados' },
  { value: 'expirado', label: 'Expirados' },
];

interface ReceivedProposal {
  id: string;
  proposal_link_id: string;
  document_id: string;
  sender_user_id: string;
  client_name: string;
  template_name: string;
  sender_name: string;
  sender_company: string;
  total_value: string;
  status: DocStatus;
  last_action: string;
  last_action_at: string | null;
  received_at: string;
}

const Recebidos = () => {
  const [proposals, setProposals] = useState<ReceivedProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('todos');
  const [detailProposal, setDetailProposal] = useState<ReceivedProposal | null>(null);

  useEffect(() => {
    loadProposals();

    const channel = supabase
      .channel('received-proposals-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'received_proposals' },
        () => { loadProposals(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadProposals = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('received_proposals')
      .select('*')
      .eq('user_id', user.id)
      .order('received_at', { ascending: false }) as { data: ReceivedProposal[] | null };
    if (data) setProposals(data);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    let docs = proposals;
    if (activeTab !== 'todos') {
      docs = docs.filter((d) => d.status === activeTab);
    }
    if (!search.trim()) return docs;
    const q = search.toLowerCase();
    return docs.filter(
      (d) =>
        d.client_name?.toLowerCase().includes(q) ||
        d.template_name?.toLowerCase().includes(q) ||
        d.sender_name?.toLowerCase().includes(q) ||
        d.sender_company?.toLowerCase().includes(q)
    );
  }, [proposals, search, activeTab]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { todos: proposals.length, enviado: 0, visualizado: 0, aprovado: 0, negociacao: 0, expirado: 0 };
    proposals.forEach((d) => { if (counts[d.status] !== undefined) counts[d.status]++; });
    return counts;
  }, [proposals]);

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatTimeAgo = (iso: string | null) => {
    if (!iso) return '—';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Agora';
    if (mins < 60) return `${mins}min atrás`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h atrás`;
    const days = Math.floor(hours / 24);
    return `${days}d atrás`;
  };

  const handleOpenProposal = async (p: ReceivedProposal) => {
    const { data } = await supabase
      .from('proposal_links')
      .select('token')
      .eq('id', p.proposal_link_id)
      .maybeSingle();
    if (data?.token) {
      window.open(`/p/${data.token}`, '_blank');
    }
  };

  const senderDisplay = (p: ReceivedProposal) => p.sender_company || p.sender_name || 'Remetente';

  return (
    <FeatureGate feature="received_full" featureLabel="Propostas Recebidas" description="Faça upgrade para Premium para gerenciar propostas recebidas." viewOnly>
    <div className="p-4 md:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Inbox className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Recebidos</h1>
          <p className="text-sm text-muted-foreground hidden sm:block">Propostas recebidas de outros usuários</p>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por remetente, cliente ou template..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 w-full justify-start overflow-x-auto">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs sm:text-sm">
              {tab.label}
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {statusCounts[tab.value] || 0}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="ml-3 text-sm text-muted-foreground">Carregando...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 py-16">
                <Inbox className="mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm font-medium text-muted-foreground">
                  {search ? 'Nenhum resultado encontrado' : 'Nenhuma proposta recebida'}
                </p>
                {!search && activeTab === 'todos' && (
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    Quando você abrir propostas de outros usuários, elas aparecerão aqui.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {/* Desktop header */}
                <div className="hidden lg:grid lg:grid-cols-[1fr_120px_100px_120px_140px_80px] gap-4 px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border">
                  <span>Remetente</span>
                  <span>Valor</span>
                  <span>Status</span>
                  <span>Recebido</span>
                  <span>Última ação</span>
                  <span className="text-right">Ações</span>
                </div>

                {filtered.map((p, i) => {
                  const config = STATUS_CONFIG[p.status] || STATUS_CONFIG.enviado;
                  const StatusIcon = config.icon;

                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="group rounded-lg border border-border bg-card p-3 lg:p-4 transition-colors hover:border-primary/30 cursor-pointer"
                      onClick={() => setDetailProposal(p)}
                    >
                      {/* Mobile */}
                      <div className="lg:hidden">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-base font-semibold text-foreground truncate">
                            {senderDisplay(p)}
                          </p>
                          <Badge variant={config.variant} className="text-[10px] shrink-0">
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {config.label}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {p.total_value || '—'}
                          </span>
                          <span>{formatDate(p.received_at)}</span>
                        </div>
                        {p.last_action && (
                          <p className="mt-1 text-[11px] text-muted-foreground/70">
                            {p.last_action} · {formatTimeAgo(p.last_action_at)}
                          </p>
                        )}
                      </div>

                      {/* Desktop */}
                      <div className="hidden lg:grid lg:grid-cols-[1fr_120px_100px_120px_140px_80px] gap-4 items-center">
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{senderDisplay(p)}</p>
                          <p className="text-xs text-muted-foreground truncate">{p.client_name || p.template_name || ''}</p>
                        </div>
                        <span className="text-sm font-semibold text-foreground">
                          {p.total_value || '—'}
                        </span>
                        <Badge variant={config.variant} className="text-[10px] w-fit">
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {config.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{formatDate(p.received_at)}</span>
                        <div className="text-xs text-muted-foreground">
                          <p>{p.last_action || '—'}</p>
                          <p className="text-[10px] text-muted-foreground/60">{formatTimeAgo(p.last_action_at)}</p>
                        </div>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Abrir proposta"
                            onClick={(e) => { e.stopPropagation(); handleOpenProposal(p); }}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={!!detailProposal} onOpenChange={(open) => !open && setDetailProposal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes da Proposta</DialogTitle>
            <DialogDescription>Informações sobre a proposta recebida</DialogDescription>
          </DialogHeader>
          {detailProposal && (() => {
            const config = STATUS_CONFIG[detailProposal.status] || STATUS_CONFIG.enviado;
            const StatusIcon = config.icon;
            return (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">{senderDisplay(detailProposal)}</p>
                    {detailProposal.client_name && (
                      <p className="text-xs text-muted-foreground">Cliente: {detailProposal.client_name}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border p-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <DollarSign className="h-3.5 w-3.5" />
                      <span>Valor</span>
                    </div>
                    <p className="text-lg font-bold text-foreground">{detailProposal.total_value || '—'}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <StatusIcon className="h-3.5 w-3.5" />
                      <span>Status</span>
                    </div>
                    <Badge variant={config.variant} className="text-xs">
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {config.label}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 rounded-lg border border-border p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span>Histórico</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Recebido</span>
                    <span className="text-foreground">{formatDate(detailProposal.received_at)}</span>
                  </div>
                  {detailProposal.last_action && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Última ação</span>
                      <span className="text-foreground">
                        {detailProposal.last_action} · {formatTimeAgo(detailProposal.last_action_at)}
                      </span>
                    </div>
                  )}
                  {detailProposal.template_name && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Template</span>
                      <span className="text-foreground truncate ml-4">{detailProposal.template_name}</span>
                    </div>
                  )}
                </div>

                <Button className="w-full" onClick={() => { handleOpenProposal(detailProposal); setDetailProposal(null); }}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir Proposta
                </Button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Recebidos;
