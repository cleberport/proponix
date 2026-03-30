import { useNavigate } from 'react-router-dom';
import { getStarterTemplates, getSavedTemplates, deleteTemplate, duplicateTemplate, getSettings, hideStarterTemplate, hideAllStarterTemplates, saveSettings } from '@/lib/templateStorage';
import { useCallback, useEffect, useState } from 'react';
import { Plus, Sparkles, Zap, Trash2, LayoutDashboard, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import TemplateCard from '@/components/TemplateCard';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SavedTemplate } from '@/types/template';
import OnboardingTour from '@/components/OnboardingTour';


const Dashboard = () => {
  const navigate = useNavigate();
  const [starters, setStarters] = useState(getStarterTemplates());
  const [saved, setSaved] = useState<SavedTemplate[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'saved' | 'starter' | 'all-starters'>('saved');
  const settings = getSettings();

  const refreshSaved = useCallback(async () => {
    setLoadingSaved(true);
    try {
      const templates = await getSavedTemplates();
      setSaved(templates);
    } catch (err) {
      console.error('Erro ao carregar templates:', err);
      toast.error('Não foi possível carregar templates agora');
    } finally {
      setLoadingSaved(false);
    }
  }, []);

  useEffect(() => {
    void refreshSaved();
  }, [refreshSaved]);

  const confirmDelete = async () => {
    if (deleteType === 'all-starters') {
      hideAllStarterTemplates();
      setStarters([]);
      toast.success('Templates iniciais removidos');
      setDeleteId(null);
      return;
    }

    if (!deleteId) return;

    if (deleteType === 'starter') {
      hideStarterTemplate(deleteId);
      setStarters(getStarterTemplates());
      toast.success('Template removido');
      setDeleteId(null);
      return;
    }

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
      <OnboardingTour />
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
            Criar Proposta Rápida
          </Button>
        </motion.div>
      )}

      <div className="mb-8 flex items-center justify-between" data-tour="tour-dashboard-header">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <LayoutDashboard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Dashboard</h1>
            <p className="text-sm text-muted-foreground hidden sm:block">Crie e gerencie seus templates de proposta</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/import')}
            className="hidden md:inline-flex h-9 px-3"
          >
            <Sparkles className="h-4 w-4 mr-1.5" />
            Importar com IA
          </Button>
          <div data-tour="tour-new-template">
            <Button onClick={() => navigate('/editor/new')} size="icon" className="h-9 w-9 md:w-auto md:px-3">
              <Plus className="h-4 w-4 md:mr-1.5" />
              <span className="hidden md:inline">Novo Template</span>
            </Button>
          </div>
        </div>
      </div>

      {loadingSaved && saved.length === 0 && (
        <div className="mb-8 flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="ml-3 text-sm text-muted-foreground">Carregando templates...</span>
        </div>
      )}

      {saved.length > 0 && (
        <section className="mb-8 rounded-xl border-2 border-primary/20 bg-primary/5 p-3 md:p-4" data-tour="tour-template-cards">
          <div className="mb-3 flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Seus Templates</h2>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:gap-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
            {saved.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <TemplateCard
                  template={t}
                  onEdit={() => navigate(`/editor/${t.id}`)}
                  onGenerate={() => navigate(`/generate/${t.id}`)}
                  onDelete={() => { setDeleteType('saved'); setDeleteId(t.id); }}
                  onDuplicate={() => { void handleDuplicate(t.id); }}
                  isSaved
                />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {starters.length > 0 && (
        <section data-tour="tour-starter-templates">
          <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Modelos Prontos</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-[11px] text-muted-foreground hover:text-destructive"
              onClick={() => { setDeleteType('all-starters'); setDeleteId('all'); }}
            >
              <Trash2 className="mr-1 h-3 w-3" />
              Remover todos
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:gap-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
            {starters.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <TemplateCard
                  template={t}
                  onEdit={() => navigate(`/editor/${t.id}`)}
                  onGenerate={() => navigate(`/generate/${t.id}`)}
                  onDelete={() => { setDeleteType('starter'); setDeleteId(t.id); }}
                  onDuplicate={() => { void handleDuplicate(t.id); }}
                />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteType === 'all-starters' ? 'Remover todos os templates iniciais?' : 'Tem certeza que deseja apagar este template?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteType === 'all-starters'
                ? 'Você pode restaurá-los a qualquer momento nas Configurações.'
                : deleteType === 'starter'
                  ? 'Você pode restaurá-lo nas Configurações.'
                  : 'Esta ação não pode ser desfeita.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { void confirmDelete(); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteType === 'all-starters' ? 'Remover todos' : 'Apagar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;
