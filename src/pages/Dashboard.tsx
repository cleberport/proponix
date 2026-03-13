import { useNavigate } from 'react-router-dom';
import { Template } from '@/types/template';
import { getStarterTemplates, getSavedTemplates, deleteTemplate, duplicateTemplate, getSettings } from '@/lib/templateStorage';
import { useState } from 'react';
import { Plus, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import TemplateCard from '@/components/TemplateCard';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const Dashboard = () => {
  const navigate = useNavigate();
  const starters = getStarterTemplates();
  const [saved, setSaved] = useState(getSavedTemplates());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const settings = getSettings();

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
      {/* Mobile quick action */}
      {settings.defaultTemplateId && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 md:hidden"
        >
          <Button
            onClick={() => navigate(`/generate/${settings.defaultTemplateId}`)}
            className="w-full h-14 text-base font-semibold gap-2"
            size="lg"
          >
            <Zap className="h-5 w-5" />
            Criar Orçamento Rápido
          </Button>
        </motion.div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground md:text-2xl">Painel</h1>
          <p className="text-sm text-muted-foreground hidden sm:block">Crie e gerencie seus templates de orçamento</p>
        </div>
        <Button onClick={() => navigate('/editor/new')} size="sm" className="h-10 md:h-9">
          <Plus className="mr-1.5 h-4 w-4" />
          <span className="hidden sm:inline">Novo Template</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </div>

      {saved.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Seus Templates</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {saved.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <TemplateCard
                  template={t}
                  onEdit={() => navigate(`/editor/${t.id}`)}
                  onGenerate={() => navigate(`/generate/${t.id}`)}
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
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Templates Iniciais</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {starters.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <TemplateCard template={t} onEdit={() => navigate(`/editor/${t.id}`)} onGenerate={() => navigate(`/generate/${t.id}`)} onDuplicate={() => handleDuplicate(t.id)} />
            </motion.div>
          ))}
        </div>
      </section>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja apagar este template?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Apagar template</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;
