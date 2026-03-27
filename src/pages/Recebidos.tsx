import { useEffect, useState, useMemo } from 'react';
import { Inbox, Search, X, Eye, CheckCircle, Clock, Send, MessageSquare, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

type DocStatus = 'enviado' | 'visualizado' | 'aprovado' | 'expirado' | 'negociacao';

const STATUS_CONFIG: Record<DocStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Send }> = {
  enviado: { label: 'Enviado', variant: 'secondary', icon: Send },
  visualizado: { label: 'Visualizado', variant: 'outline', icon: Eye },
  aprovado: { label: 'Aprovado', variant: 'default', icon: CheckCircle },
  negociacao: { label: 'Negociação', variant: 'outline', icon: MessageSquare },
  expirado: { label: 'Expirado', variant: 'destructive', icon: Clock },
};

const TABS = [
  { value: 'todos', label: 'Todos' },
  { value: 'enviado', label: 'Enviados' },
  { value: 'visualizado', label: 'Visualizados' },
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
  status: DocStatus;
  received_at: string;
}

const Recebidos = () => {
  const [proposals, setProposals] = useState<ReceivedProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('todos');

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
    const { data } = await supabase
      .from('received_proposals')
      .select('*')
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
      (d) => d.client_name?.toLowerCase().includes(q) || d.template_name?.toLowerCase().includes(q)
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

  const handleOpenProposal = async (p: ReceivedProposal) => {
    // Find the token from proposal_links to open the public view
    const { data } = await supabase
      .from('proposal_links')
      .select('token')
      .eq('id', p.proposal_link_id)
      .maybeSingle();
    if (data?.token) {
      window.open(`/p/${data.token}`, '_blank');
    }
  };

  return (
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
          placeholder="Buscar por cliente ou template..."
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
                <div className="hidden lg:grid lg:grid-cols-[1fr_1fr_120px_160px_80px] gap-4 px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border">
                  <span>Cliente</span>
                  <span>Template</span>
                  <span>Status</span>
                  <span>Recebido em</span>
                  <span className="text-right">Ação</span>
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
                      onClick={() => handleOpenProposal(p)}
                    >
                      {/* Mobile */}
                      <div className="lg:hidden">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-base font-semibold text-foreground truncate">
                            {p.client_name || 'Cliente'}
                          </p>
                          <Badge variant={config.variant} className="text-[10px] shrink-0">
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {config.label}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="truncate">{p.template_name || 'Template'}</span>
                          <span>{formatDate(p.received_at)}</span>
                        </div>
                      </div>

                      {/* Desktop */}
                      <div className="hidden lg:grid lg:grid-cols-[1fr_1fr_120px_160px_80px] gap-4 items-center">
                        <p className="font-medium text-foreground truncate">{p.client_name || 'Cliente'}</p>
                        <p className="text-sm text-muted-foreground truncate">{p.template_name || 'Template'}</p>
                        <Badge variant={config.variant} className="text-[10px] w-fit">
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {config.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{formatDate(p.received_at)}</span>
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
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
    </div>
  );
};

export default Recebidos;
