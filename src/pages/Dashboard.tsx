import { useNavigate } from 'react-router-dom';
import { Template } from '@/types/template';
import { getStarterTemplates, getSavedTemplates, deleteTemplate, duplicateTemplate } from '@/lib/templateStorage';
import { useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
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

const Dashboard = () => {
  const navigate = useNavigate();
  const starters = getStarterTemplates();
  const [saved, setSaved] = useState(getSavedTemplates());
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleSelect = (template: Template) => {
    navigate(`/editor/${template.id}`);
  };

  const handleGenerate = (template: Template) => {
    navigate(`/generate/${template.id}`);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteTemplate(deleteId);
    setSaved(getSavedTemplates());
    toast.success('Template excluído');
    setDeleteId(null);
  };

  const handleDuplicate = (id: string) => {
    const dup = duplicateTemplate(id);
    if (dup) {
      setSaved(getSavedTemplates());
      toast.success('Template duplicado');
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground md:text-2xl">Painel</h1>
          <p className="text-sm text-muted-foreground">Crie e gerencie seus templates de orçamento</p>
        </div>
        <Button onClick={() => navigate('/editor/new')} size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          Novo Template
        </Button>
      </div>

      {saved.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Seus Templates
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {saved.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <TemplateCard
                  template={t}
                  onEdit={() => handleSelect(t)}
                  onGenerate={() => handleGenerate(t)}
                  onDelete={() => setDeleteId(t.id)}
                  onDuplicate={() => handleDuplicate(t.id)}
                  isSaved
                />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Templates Iniciais
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {starters.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <TemplateCard
                template={t}
                onEdit={() => handleSelect(t)}
                onGenerate={() => handleGenerate(t)}
                onDuplicate={() => handleDuplicate(t.id)}
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
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Apagar template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;
