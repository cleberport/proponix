import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocumentHistory, deleteDocumentFromHistory } from '@/lib/templateStorage';
import { FileText, Trash2, RefreshCw, Calendar, Pencil, Copy, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const Documents = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState(getDocumentHistory());
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = () => {
    if (!deleteId) return;
    deleteDocumentFromHistory(deleteId);
    setHistory(getDocumentHistory());
    toast.success('Documento removido');
    setDeleteId(null);
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
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground md:text-2xl">Histórico</h1>
        <p className="text-sm text-muted-foreground">Documentos gerados anteriormente</p>
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 py-16">
          <FileText className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">Nenhum documento gerado</p>
          <p className="mt-1 text-xs text-muted-foreground">Os PDFs gerados aparecerão aqui</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {history.map((doc) => (
            <div
              key={doc.id}
              className="flex flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30"
            >
              <div className="flex items-start gap-3 mb-3">
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
                  <Pencil className="mr-1 h-3.5 w-3.5" />
                  Editar
                </Button>
                <Button variant="ghost" size="sm" className="flex-1 h-9 text-xs" onClick={() => handleRegenerate(doc)}>
                  <RefreshCw className="mr-1 h-3.5 w-3.5" />
                  Regerar
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
    </div>
  );
};

export default Documents;
