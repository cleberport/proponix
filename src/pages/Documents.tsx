import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocumentHistory, deleteDocumentFromHistory } from '@/lib/templateStorage';
import { FileText, Trash2, RefreshCw, Calendar } from 'lucide-react';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const Documents = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState(getDocumentHistory());

  const handleDelete = (id: string) => {
    deleteDocumentFromHistory(id);
    setHistory(getDocumentHistory());
    toast.success('Documento removido do histórico');
  };

  const handleRegenerate = (doc: typeof history[0]) => {
    navigate(`/generate/${doc.templateId}`);
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
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/30"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{doc.fileName}</p>
                  <div className="flex items-center gap-3 mt-0.5">
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
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => handleRegenerate(doc)}
                >
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Regerar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remover do histórico?</AlertDialogTitle>
                      <AlertDialogDescription>
                        O registro será removido do histórico. O arquivo PDF já baixado não será afetado.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(doc.id)}>Remover</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Documents;
