import { useNavigate } from 'react-router-dom';
import { getStarterTemplates, getSavedTemplates, deleteTemplate, duplicateTemplate } from '@/lib/templateStorage';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import TemplateCard from '@/components/TemplateCard';

const Templates = () => {
  const navigate = useNavigate();
  const starters = getStarterTemplates();
  const [saved, setSaved] = useState(getSavedTemplates());

  const handleDelete = (id: string) => {
    deleteTemplate(id);
    setSaved(getSavedTemplates());
    toast.success('Template excluído');
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {saved.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <TemplateCard
                  template={t}
                  onEdit={() => navigate(`/editor/${t.id}`)}
                  onGenerate={() => navigate(`/generate/${t.id}`)}
                  onDelete={() => handleDelete(t.id)}
                  onDuplicate={() => handleDuplicate(t.id)}
                  isSaved
                />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Templates Iniciais</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {starters.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <TemplateCard
                template={t}
                onEdit={() => navigate(`/editor/${t.id}`)}
                onGenerate={() => navigate(`/generate/${t.id}`)}
                onDuplicate={() => handleDuplicate(t.id)}
              />
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Templates;
