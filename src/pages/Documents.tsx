import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocumentHistory, loadDocumentHistoryFromServer, deleteDocumentFromHistory } from '@/lib/templateStorage';
import { FileText, Trash2, RefreshCw, Search, X, Copy, ExternalLink, History, Send } from 'lucide-react';
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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';

type DocStatus = 'enviado' | 'visualizado' | 'aprovado' | 'expirado';

const STATUS_CONFIG: Record<DocStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  enviado: { label: 'Enviado', variant: 'secondary' },
  visualizado: { label: 'Visualizado', variant: 'outline' },
  aprovado: { label: 'Aprovado', variant: 'default' },
  expirado: { label: 'Expirado', variant: 'destructive' },
};

const TABS = [
  { value: 'todos', label: 'Todos' },
  { value: 'enviado', label: 'Enviados' },
  { value: 'visualizado', label: 'Visualizados' },
  { value: 'aprovado', label: 'Aprovados' },
  { value: 'expirado', label: 'Expirados' },
];

const Documents = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState(getDocumentHistory());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('todos');

  useEffect(() => {
    loadDocumentHistoryFromServer().then(setHistory);
  }, []);

  const filtered = useMemo(() => {
    let docs = history;
    if (activeTab !== 'todos') {
      docs = docs.filter((doc) => (doc as any).status === activeTab || (!((doc as any).status) && activeTab === 'enviado'));
    }
    if (!search.trim()) return docs;
    const q = search.toLowerCase();
    return docs.filter(
      (doc) =>
        doc.fileName?.toLowerCase().includes(q) ||
        doc.templateName?.toLowerCase().includes(q) ||
        doc.clientName?.toLowerCase().includes(q)
    );
  }, [history, search, activeTab]);

  const getStatusCounts = useMemo(() => {
    const counts: Record<string, number> = { todos: history.length, enviado: 0, visualizado: 0, aprovado: 0, expirado: 0 };
    history.forEach((doc) => {
      const s = (doc as any).status || 'enviado';
      if (counts[s] !== undefined) counts[s]++;
    });
    return counts;
  }, [history]);

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

  const handleResend = (doc: typeof history[0]) => {
    toast.info('Link reenviado (funcionalidade em breve)');
  };

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
    const total = vals?.total || vals?.subtotal || '';
    return total ? `R$ ${total}` : '—';
  };

  const docStatus = (doc: any): DocStatus => doc.status || 'enviado';

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground md:text-2xl">Documentos</h1>
        <p className="text-sm text-muted-foreground">Propostas geradas e seu status</p>
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
                <div className="hidden md:grid md:grid-cols-[1fr_1fr_120px_100px_140px] gap-4 px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border">
                  <span>Cliente</span>
                  <span>Template</span>
                  <span>Valor</span>
                  <span>Status</span>
                  <span className="text-right">Ações</span>
                </div>
                {filtered.map((doc) => {
                  const status = docStatus(doc);
                  const config = STATUS_CONFIG[status];
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
                            {config.label}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{getTotal(doc)}</span>
                          <span>{formatDate(doc.generatedAt)}</span>
                        </div>
                        <div className="flex items-center gap-1 pt-1 border-t border-border" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-8 text-xs flex-1" onClick={() => handleResend(doc)}>
                            <Send className="mr-1 h-3 w-3" /> Reenviar
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 text-xs flex-1" onClick={() => handleDuplicate(doc)}>
                            <Copy className="mr-1 h-3 w-3" /> Duplicar
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => setDeleteId(doc.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Desktop layout */}
                      <div className="hidden md:grid md:grid-cols-[1fr_1fr_120px_100px_140px] gap-4 items-center">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {doc.clientName || doc.fileName}
                          </p>
                          <p className="text-xs text-muted-foreground">{formatDate(doc.generatedAt)}</p>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{doc.templateName}</p>
                        <p className="text-sm font-medium text-foreground">{getTotal(doc)}</p>
                        <div onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button>
                                <Badge variant={config.variant} className="text-[10px] cursor-pointer hover:opacity-80">
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
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Abrir" onClick={() => handleOpen(doc)}>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Reenviar" onClick={() => handleResend(doc)}>
                            <Send className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Duplicar" onClick={() => handleDuplicate(doc)}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Excluir" onClick={() => setDeleteId(doc.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
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
