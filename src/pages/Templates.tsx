import { useNavigate } from 'react-router-dom';
import { getStarterTemplates, getSavedTemplates, deleteTemplate, duplicateTemplate } from '@/lib/templateStorage';
import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import TemplateCard from '@/components/TemplateCard';
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

const Templates = () => {
  const navigate = useNavigate();
  const starters = getStarterTemplates();
  const [saved, setSaved] = useState<Awaited<ReturnType<typeof getSavedTemplates>>>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const refreshSaved = useCallback(async () => {
    const templates = await getSavedTemplates();
    setSaved(templates);
  }, []);

  useEffect(() => {
    void refreshSaved();
  }, [refreshSaved]);

  const confirmDelete = async () => {
    if (!deleteId) return;

    const idToDelete = deleteId;
    setSaved((prev) => prev.filter((template) => template.id !== idToDelete));
    setDeleteId(null);

    try {
      await deleteTemplate(idToDelete);
      toast.success('Template excluído');
    } catch (err) {
      console.error('Erro ao excluir template:', err);
      await refreshSaved();
      toast.error('Erro ao excluir template');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const dup = await duplicateTemplate(id);
      if (dup) {
        setSaved((prev) => [dup, ...prev.filter((template) => template.id !== dup.id)]);
        toast.success('Template duplicado');
        void refreshSaved();
      } else {
        toast.error('Template original não encontrado');
      }
    } catch (err) {
      console.error('Erro ao duplicar template:', err);
      toast.error('Erro ao duplicar template');
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground md:text-2xl">Templates</h1>
          <p className="text-sm text-muted-foreground">Todos os templates disponíveis</p>
        </div>
        <Button onClick={() => navigate('/editor/new')} size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          Novo Template
        </Button>
      </div>

      {saved.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Templates Personalizados</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:gap-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {saved.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <TemplateCard
                  template={t}
                  onEdit={() => navigate(`/editor/${t.id}`)}
                  onGenerate={() => navigate(`/generate/${t.id}`)}
                  onDelete={() => setDeleteId(t.id)}
                  onDuplicate={() => { void handleDuplicate(t.id); }}
                  isSaved
                />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Modelos Prontos</h2>
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {starters.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <TemplateCard
                template={t}
                onEdit={() => navigate(`/editor/${t.id}`)}
                onGenerate={() => navigate(`/generate/${t.id}`)}
                onDuplicate={() => { void handleDuplicate(t.id); }}
              />
            </motion.div>
          ))}
        </div>
      </section>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja apagar este template?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O template será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { void confirmDelete(); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Apagar template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Templates;
