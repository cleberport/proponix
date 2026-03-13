import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocumentHistory, deleteDocumentFromHistory } from '@/lib/templateStorage';
import { FileText, Trash2, RefreshCw, Calendar, Pencil, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const Documents = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState(getDocumentHistory());
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = () => {
    if (!deleteId) return;
    deleteDocumentFromHistory(deleteId);
    setHistory(getDocumentHistory());
    toast.success('Documento removido do histórico');
    setDeleteId(null);
  };

  const handleEdit = (doc: typeof history[0]) => {
    navigate(`/generate/${doc.templateId}`, {
      state: { documentId: doc.id, values: doc.values },
    });
  };

  const handleRegenerate = (doc: typeof history[0]) => {
    navigate(`/generate/${doc.templateId}`, {
      state: { values: doc.values },
    });
  };

  const handleDuplicate = (doc: typeof history[0]) => {
    navigate(`/generate/${doc.templateId}`, {
      state: { values: { ...doc.values } },
    });
    toast.info('Documento duplicado - edite os campos e gere novamente');
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-foreground md:text-2xl">Histórico</h1>
        <p className="text-sm text-muted-foreground">Documentos gerados anteriormente</p>
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 py-20">
          <FileText className="mb-4 h-12 w-12 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">Nenhum documento gerado ainda</p>
          <p className="mt-1 text-xs text-muted-foreground">Os PDFs gerados aparecerão aqui</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {history.map((doc) => (
            <div
              key={doc.id}
              className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/30 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{doc.fileName}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{doc.templateName}</span>
                    {doc.clientName && (
                      <span className="text-xs text-muted-foreground">• {doc.clientName}</span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(doc.generatedAt)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 text-xs md:h-8"
                  onClick={() => handleEdit(doc)}
                >
                  <Pencil className="mr-1 h-3 w-3" />
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 text-xs md:h-8"
                  onClick={() => handleRegenerate(doc)}
                >
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Regerar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 text-xs md:h-8"
                  onClick={() => handleDuplicate(doc)}
                >
                  <Copy className="mr-1 h-3 w-3" />
                  Duplicar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 text-destructive md:h-8 md:w-8"
                  onClick={() => setDeleteId(doc.id)}
                >
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
            <AlertDialogDescription>
              O registro será removido do histórico. O arquivo PDF já baixado não será afetado.
            </AlertDialogDescription>
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
