import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocumentHistory, loadDocumentHistoryFromServer, deleteDocumentFromHistory } from '@/lib/templateStorage';
import { FileText, Trash2, Search, X, Copy, ExternalLink, Send, Link2, Eye, CheckCircle, Clock, Loader2, RefreshCw, CalendarPlus, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';

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
  { value: 'negociacao', label: 'Negociação' },
  { value: 'expirado', label: 'Expirados' },
];

interface ProposalLink {
  id: string;
  document_id: string;
  token: string;
  status: string;
  viewed_at: string | null;
  approved_at: string | null;
  approver_name: string;
  negotiation_message: string | null;
}

const Documents = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState(getDocumentHistory());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('todos');
  const [proposalLinks, setProposalLinks] = useState<Record<string, ProposalLink>>({});
  const [generatingLink, setGeneratingLink] = useState<string | null>(null);
  const [resendingLink, setResendingLink] = useState<string | null>(null);

  useEffect(() => {
    loadDocumentHistoryFromServer().then(setHistory);
    loadProposalLinks();

    // Subscribe to realtime status changes on proposal_links
    const channel = supabase
      .channel('proposal-status-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'proposal_links' },
        (payload) => {
          const updated = payload.new as any;
          setProposalLinks((prev) => ({
            ...prev,
            [updated.document_id]: {
              id: updated.id,
              document_id: updated.document_id,
              token: updated.token,
              status: updated.status,
              viewed_at: updated.viewed_at,
              approved_at: updated.approved_at,
              approver_name: updated.approver_name,
              negotiation_message: updated.negotiation_message,
            },
          }));
          // Also sync local history status
          setHistory((prev) =>
            prev.map((d) =>
              d.id === updated.document_id ? { ...d, status: updated.status } as any : d
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadProposalLinks = async () => {
    const { data } = await supabase
      .from('proposal_links')
      .select('*') as { data: ProposalLink[] | null };
    if (data) {
      const map: Record<string, ProposalLink> = {};
      // Keep only the latest link per document
      data.sort((a, b) => (a as any).created_at > (b as any).created_at ? 1 : -1);
      data.forEach((link) => { map[link.document_id] = link; });
      setProposalLinks(map);

      // Sync generated_documents status from proposal_links
      for (const link of Object.values(map)) {
        if (['visualizado', 'aprovado', 'negociacao'].includes(link.status)) {
          setHistory((prev) =>
            prev.map((d) =>
              d.id === link.document_id && (d as any).status !== link.status
                ? { ...d, status: link.status } as any
                : d
            )
          );
        }
      }
    }
  };

  const filtered = useMemo(() => {
    let docs = history;
    if (activeTab !== 'todos') {
      docs = docs.filter((doc) => {
        const s = (doc as any).status || proposalLinks[doc.id]?.status || 'enviado';
        return s === activeTab;
      });
    }
    if (!search.trim()) return docs;
    const q = search.toLowerCase();
    return docs.filter(
      (doc) =>
        doc.fileName?.toLowerCase().includes(q) ||
        doc.templateName?.toLowerCase().includes(q) ||
        doc.clientName?.toLowerCase().includes(q)
    );
  }, [history, search, activeTab, proposalLinks]);

  const getStatusCounts = useMemo(() => {
    const counts: Record<string, number> = { todos: history.length, enviado: 0, visualizado: 0, aprovado: 0, negociacao: 0, expirado: 0 };
    history.forEach((doc) => {
      const s = (doc as any).status || proposalLinks[doc.id]?.status || 'enviado';
      if (counts[s] !== undefined) counts[s]++;
    });
    return counts;
  }, [history, proposalLinks]);

  const handleDelete = () => {
    if (!deleteId) return;
    deleteDocumentFromHistory(deleteId);
    setHistory(getDocumentHistory());
    toast.success('Documento removido');
    setDeleteId(null);
  };

  const handleOpen = (doc: typeof history[0]) => {
    navigate(`/generate/${doc.templateId}`, { state: { documentId: doc.id, values: doc.values } });
  };

  const handleDuplicate = (doc: typeof history[0]) => {
    navigate(`/generate/${doc.templateId}`, { state: { values: { ...doc.values } } });
    toast.info('Documento duplicado - edite e gere novamente');
  };

  const handleGenerateLink = useCallback(async (docId: string) => {
    setGeneratingLink(docId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error('Você precisa estar logado'); return; }

      // Check if link already exists
      const existing = proposalLinks[docId];
      if (existing) {
        const url = `${window.location.origin}/p/${existing.token}`;
        await navigator.clipboard.writeText(url);
        toast.success('Link copiado!');
        return;
      }

      const { data, error } = await supabase
        .from('proposal_links')
        .insert({ user_id: session.user.id, document_id: docId } as any)
        .select()
        .single();

      if (error) throw error;

      const link = data as unknown as ProposalLink;
      setProposalLinks((prev) => ({ ...prev, [docId]: link }));

      const url = `${window.location.origin}/p/${link.token}`;
      await navigator.clipboard.writeText(url);
      toast.success('Link gerado e copiado!');

      // Update document status to 'enviado'
      await supabase
        .from('generated_documents')
        .update({ status: 'enviado' } as any)
        .eq('id', docId);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar link');
    } finally {
      setGeneratingLink(null);
    }
  }, [proposalLinks]);

  const handleCopyLink = useCallback(async (docId: string) => {
    const link = proposalLinks[docId];
    if (!link) {
      await handleGenerateLink(docId);
      return;
    }
    const url = `${window.location.origin}/p/${link.token}`;
    await navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
  }, [proposalLinks, handleGenerateLink]);

  const handleResendLink = useCallback(async (docId: string) => {
    setResendingLink(docId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error('Você precisa estar logado'); return; }

      // Invalidate old link by setting view_count = max_views
      const existing = proposalLinks[docId];
      if (existing) {
        await supabase
          .from('proposal_links')
          .update({ view_count: 999, status: 'expirado' } as any)
          .eq('id', existing.id);
      }

      // Create new link
      const { data, error } = await supabase
        .from('proposal_links')
        .insert({ user_id: session.user.id, document_id: docId } as any)
        .select()
        .single();

      if (error) throw error;

      const link = data as unknown as ProposalLink;
      setProposalLinks((prev) => ({ ...prev, [docId]: link }));

      // Reset document status to 'enviado'
      await supabase
        .from('generated_documents')
        .update({ status: 'enviado' } as any)
        .eq('id', docId);

      setHistory((prev) => prev.map((d) => d.id === docId ? { ...d, status: 'enviado' } as any : d));

      const url = `${window.location.origin}/p/${link.token}`;
      await navigator.clipboard.writeText(url);
      toast.success('Novo link gerado e copiado!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao reenviar link');
    } finally {
      setResendingLink(null);
    }
  }, [proposalLinks]);

  const handleUpdateStatus = async (docId: string, status: DocStatus) => {
    try {
      const { error } = await supabase
        .from('generated_documents')
        .update({ status } as any)
        .eq('id', docId);
      if (error) throw error;
      setHistory((prev) => prev.map((d) => d.id === docId ? { ...d, status } as any : d));
      toast.success(`Status atualizado para ${STATUS_CONFIG[status].label}`);
    } catch {
      toast.error('Erro ao atualizar status');
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getTotal = (doc: typeof history[0]) => {
    const vals = doc.values as Record<string, any>;
    if (!vals) return '—';
    // Try common total field names
    const totalKeys = ['total', 'valor_total', 'preco_total', 'subtotal', 'valor', 'price', 'preco'];
    for (const key of totalKeys) {
      const v = vals[key];
      if (v !== undefined && v !== null && v !== '') {
        const num = typeof v === 'number' ? v : parseFloat(String(v).replace(/[^\d,.-]/g, '').replace(',', '.'));
        if (!isNaN(num) && num > 0) {
          return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }
      }
    }
    return '—';
  };

  const docStatus = (doc: any): DocStatus => doc.status || proposalLinks[doc.id]?.status || 'enviado';

  const buildCalendarEvent = (doc: typeof history[0]) => {
    const vals = doc.values as Record<string, any>;
    const total = getTotal(doc);
    const link = proposalLinks[doc.id];
    const title = `${doc.templateName} - ${doc.clientName || 'Cliente'}`;
    const description = [
      `Proposta: ${doc.templateName}`,
      `Cliente: ${doc.clientName || '—'}`,
      total !== '—' ? `Valor: ${total}` : '',
      link?.approver_name ? `Aprovada por: ${link.approver_name}` : '',
    ].filter(Boolean).join('\n');
    const location = String(vals?.local || vals?.endereco || vals?.location || vals?.venue || '');
    let startDate = new Date();
    const dateVal = vals?.data_evento || vals?.data || vals?.date || vals?.event_date || null;
    if (dateVal) {
      const parts = String(dateVal).match(/(\d{2})\/(\d{2})\/(\d{4})/);
      if (parts) startDate = new Date(Number(parts[3]), Number(parts[2]) - 1, Number(parts[1]));
      else { const p = new Date(dateVal); if (!isNaN(p.getTime())) startDate = p; }
    }
    const endDate = new Date(startDate); endDate.setHours(endDate.getHours() + 2);
    return { title, description, location, startDate, endDate };
  };

  const fmtICS = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const handleAppleCalendar = (doc: typeof history[0]) => {
    const e = buildCalendarEvent(doc);
    const ics = ['BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT',
      `DTSTART:${fmtICS(e.startDate)}`,`DTEND:${fmtICS(e.endDate)}`,
      `SUMMARY:${e.title}`,`DESCRIPTION:${e.description.replace(/\n/g,'\\n')}`,
      `LOCATION:${e.location}`,'END:VEVENT','END:VCALENDAR'].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'evento.ics'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleGoogleCalendar = (doc: typeof history[0]) => {
    const e = buildCalendarEvent(doc);
    const params = new URLSearchParams({ action: 'TEMPLATE', text: e.title, details: e.description, location: e.location, dates: `${fmtICS(e.startDate)}/${fmtICS(e.endDate)}` });
    window.open(`https://calendar.google.com/calendar/render?${params}`, '_blank');
  };

  const handleOutlookCalendar = (doc: typeof history[0]) => {
    const e = buildCalendarEvent(doc);
    const params = new URLSearchParams({ path: '/calendar/action/compose', rru: 'addevent', subject: e.title, body: e.description, location: e.location, startdt: e.startDate.toISOString(), enddt: e.endDate.toISOString() });
    window.open(`https://outlook.live.com/calendar/0/deeplink/compose?${params}`, '_blank');
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground md:text-2xl">Documentos</h1>
        <p className="text-sm text-muted-foreground">Propostas geradas e seu ciclo de vida</p>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente, template ou arquivo..."
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
                {getStatusCounts[tab.value] || 0}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 py-16">
                <FileText className="mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm font-medium text-muted-foreground">
                  {search ? 'Nenhum resultado encontrado' : 'Nenhum documento nesta categoria'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Header row - desktop */}
                <div className="hidden md:grid md:grid-cols-[1fr_1fr_100px_100px_180px] gap-4 px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border">
                  <span>Cliente</span>
                  <span>Template</span>
                  <span>Valor</span>
                  <span>Status</span>
                  <span className="text-right">Ações</span>
                </div>
                {filtered.map((doc) => {
                  const status = docStatus(doc);
                  const config = STATUS_CONFIG[status];
                  const StatusIcon = config.icon;
                  const link = proposalLinks[doc.id];
                  const isGenerating = generatingLink === doc.id;

                  return (
                    <div
                      key={doc.id}
                      className="group rounded-lg border border-border bg-card p-3 md:p-4 transition-colors hover:border-primary/30 cursor-pointer"
                      onClick={() => handleOpen(doc)}
                    >
                      {/* Mobile layout */}
                      <div className="md:hidden space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {doc.clientName || doc.fileName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{doc.templateName}</p>
                          </div>
                          <Badge variant={config.variant} className="ml-2 text-[10px] shrink-0">
                            <StatusIcon className="mr-1 h-2.5 w-2.5" />
                            {config.label}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{getTotal(doc)}</span>
                          <span>{formatDate(doc.generatedAt)}</span>
                        </div>
                        {/* Tracking info */}
                        {link && (link.viewed_at || link.approved_at) && (
                          <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                            {link.viewed_at && <span>👁 Visto {formatDate(link.viewed_at)}</span>}
                            {link.approved_at && <span>✅ Aprovado {formatDate(link.approved_at)} {link.approver_name && `por ${link.approver_name}`}</span>}
                          </div>
                        )}
                        {link?.negotiation_message && status === 'negociacao' && (
                          <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 px-3 py-2">
                            <p className="text-[10px] font-medium text-amber-800 dark:text-amber-400 mb-0.5">💬 Sugestão do cliente:</p>
                            <p className="text-xs text-amber-700 dark:text-amber-300">{link.negotiation_message}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-1 pt-1 border-t border-border flex-wrap" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs flex-1"
                            onClick={() => handleGenerateLink(doc.id)}
                            disabled={isGenerating}
                          >
                            {isGenerating ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Link2 className="mr-1 h-3 w-3" />}
                            {link ? 'Copiar link' : 'Gerar link'}
                          </Button>
                          {link && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs flex-1"
                              onClick={() => handleResendLink(doc.id)}
                              disabled={resendingLink === doc.id}
                            >
                              {resendingLink === doc.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
                              Reenviar
                            </Button>
                          )}
                          {status === 'aprovado' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 text-xs flex-1" onClick={(e) => e.stopPropagation()}>
                                  <CalendarPlus className="mr-1 h-3 w-3" /> Calendário
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="center">
                                <DropdownMenuItem onClick={() => handleGoogleCalendar(doc)}>Google Calendar</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAppleCalendar(doc)}>Apple Calendar (.ics)</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOutlookCalendar(doc)}>Outlook</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          <Button variant="ghost" size="sm" className="h-8 text-xs flex-1" onClick={() => handleDuplicate(doc)}>
                            <Copy className="mr-1 h-3 w-3" /> Duplicar
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => setDeleteId(doc.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Desktop layout */}
                      <div className="hidden md:grid md:grid-cols-[1fr_1fr_100px_100px_180px] gap-4 items-center">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {doc.clientName || doc.fileName}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatDate(doc.generatedAt)}</span>
                            {link?.viewed_at && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-primary">👁</span>
                                </TooltipTrigger>
                                <TooltipContent>Visualizado em {formatDate(link.viewed_at)}</TooltipContent>
                              </Tooltip>
                            )}
                            {link?.approved_at && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-primary">✅</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Aprovado em {formatDate(link.approved_at)}
                                  {link.approver_name && ` por ${link.approver_name}`}
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {link?.negotiation_message && status === 'negociacao' && (
                              <span className="text-amber-500">💬</span>
                            )}
                          </div>
                          {link?.negotiation_message && status === 'negociacao' && (
                            <p className="mt-1 text-xs text-muted-foreground truncate max-w-[250px]" title={link.negotiation_message}>
                              💬 {link.negotiation_message}
                            </p>
                          )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{doc.templateName}</p>
                        <p className="text-sm font-medium text-foreground">{getTotal(doc)}</p>
                        <div onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button>
                                <Badge variant={config.variant} className="text-[10px] cursor-pointer hover:opacity-80">
                                  <StatusIcon className="mr-1 h-2.5 w-2.5" />
                                  {config.label}
                                </Badge>
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              {(Object.keys(STATUS_CONFIG) as DocStatus[]).map((s) => (
                                <DropdownMenuItem key={s} onClick={() => handleUpdateStatus(doc.id, s)}>
                                  {STATUS_CONFIG[s].label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleGenerateLink(doc.id)}
                                disabled={isGenerating}
                              >
                                {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{link ? 'Copiar link' : 'Gerar link de proposta'}</TooltipContent>
                          </Tooltip>
                          {link && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleResendLink(doc.id)}
                                  disabled={resendingLink === doc.id}
                                >
                                  {resendingLink === doc.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Reenviar link</TooltipContent>
                            </Tooltip>
                          )}
                          {status === 'aprovado' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <CalendarPlus className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleGoogleCalendar(doc)}>Google Calendar</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAppleCalendar(doc)}>Apple Calendar (.ics)</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOutlookCalendar(doc)}>Outlook</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpen(doc)}>
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Abrir</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDuplicate(doc)}>
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Duplicar</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(doc.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Excluir</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover documento?</AlertDialogTitle>
            <AlertDialogDescription>O registro será removido permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Documents;
