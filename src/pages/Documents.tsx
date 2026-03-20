import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocumentHistory, loadDocumentHistoryFromServer, deleteDocumentFromHistory } from '@/lib/templateStorage';
import { FileText, Trash2, RefreshCw, Calendar, Pencil, Copy, Search, X, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const Documents = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState(getDocumentHistory());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  useEffect(() => {
    loadDocumentHistoryFromServer().then(setHistory);
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return history;
    const q = search.toLowerCase();
    return history.filter(
      (doc) =>
        doc.fileName?.toLowerCase().includes(q) ||
        doc.templateName?.toLowerCase().includes(q) ||
        doc.clientName?.toLowerCase().includes(q)
    );
  }, [history, search]);

  const selectionMode = selectedIds.size > 0;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((d) => d.id)));
    }
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteDocumentFromHistory(deleteId);
    setHistory(getDocumentHistory());
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(deleteId); return n; });
    toast.success('Documento removido');
    setDeleteId(null);
  };

  const handleBulkDelete = () => {
    selectedIds.forEach((id) => deleteDocumentFromHistory(id));
    setHistory(getDocumentHistory());
    toast.success(`${selectedIds.size} documento(s) removido(s)`);
    setSelectedIds(new Set());
    setBulkDeleteOpen(false);
  };

  const handleEdit = (doc: typeof history[0]) => {
    navigate(`/generate/${doc.templateId}`, { state: { documentId: doc.id, values: doc.values } });
  };

  const handleRegenerate = (doc: typeof history[0]) => {
    navigate(`/generate/${doc.templateId}`, { state: { values: doc.values } });
  };

  const handleDuplicate = (doc: typeof history[0]) => {
    navigate(`/generate/${doc.templateId}`, { state: { values: { ...doc.values } } });
    toast.info('Documento duplicado - edite e gere novamente');
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground md:text-2xl">Histórico</h1>
          <p className="text-sm text-muted-foreground">Documentos gerados anteriormente</p>
        </div>
        {selectionMode && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{selectedIds.size} selecionado(s)</span>
            <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
              <X className="mr-1 h-3.5 w-3.5" /> Cancelar
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>
              <Trash2 className="mr-1 h-3.5 w-3.5" /> Apagar
            </Button>
          </div>
        )}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, template ou cliente..."
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

      {filtered.length > 0 && (
        <div className="mb-3 flex items-center gap-2">
          <Checkbox
            checked={selectedIds.size === filtered.length && filtered.length > 0}
            onCheckedChange={toggleSelectAll}
          />
          <span className="text-xs text-muted-foreground">Selecionar todos ({filtered.length})</span>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 py-16">
          <FileText className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">
            {search ? 'Nenhum resultado encontrado' : 'Nenhum documento gerado'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {search ? 'Tente outra busca' : 'Os PDFs gerados aparecerão aqui'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doc) => (
            <div
              key={doc.id}
              className={`flex flex-col rounded-xl border bg-card p-4 transition-colors ${
                selectedIds.has(doc.id) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                <Checkbox
                  checked={selectedIds.has(doc.id)}
                  onCheckedChange={() => toggleSelect(doc.id)}
                  className="mt-1"
                />
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">{doc.fileName}</p>
                  <p className="text-xs text-muted-foreground truncate">{doc.templateName}</p>
                  {doc.clientName && <p className="text-xs text-muted-foreground">{doc.clientName}</p>}
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                <Calendar className="h-3 w-3" />
                {formatDate(doc.generatedAt)}
              </div>

              <div className="flex items-center gap-1.5 mt-auto pt-2 border-t border-border">
                <Button variant="ghost" size="sm" className="flex-1 h-9 text-xs" onClick={() => handleEdit(doc)}>
                  <Pencil className="mr-1 h-3.5 w-3.5" /> Editar
                </Button>
                <Button variant="ghost" size="sm" className="flex-1 h-9 text-xs" onClick={() => handleRegenerate(doc)}>
                  <RefreshCw className="mr-1 h-3.5 w-3.5" /> Regerar
                </Button>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => handleDuplicate(doc)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-destructive" onClick={() => setDeleteId(doc.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover do histórico?</AlertDialogTitle>
            <AlertDialogDescription>O registro será removido do histórico.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar {selectedIds.size} documento(s)?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Apagar todos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Documents;
