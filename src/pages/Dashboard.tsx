import { useNavigate } from 'react-router-dom';
import { Template } from '@/types/template';
import { getStarterTemplates, getSavedTemplates, deleteTemplate, restoreDefaultTemplates } from '@/lib/templateStorage';
import { useState } from 'react';
import { Plus, Sparkles, Trash2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import TemplateCard from '@/components/TemplateCard';

const Dashboard = () => {
  const navigate = useNavigate();
  const starters = getStarterTemplates();
  const [saved, setSaved] = useState(getSavedTemplates());

  const handleSelect = (template: Template) => {
    navigate(`/editor/${template.id}`);
  };

  const handleGenerate = (template: Template) => {
    navigate(`/generate/${template.id}`);
  };

  const handleDelete = (id: string) => {
    deleteTemplate(id);
    setSaved(getSavedTemplates());
    toast.success('Template deleted');
  };

  const handleRestore = () => {
    restoreDefaultTemplates();
    setSaved(getSavedTemplates());
    toast.success('Default templates restored');
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground md:text-2xl">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Create and manage your budget templates</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRestore}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Restore Defaults
          </Button>
          <Button onClick={() => navigate('/editor/new')} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            New Template
          </Button>
        </div>
      </div>

      {/* Saved templates */}
      {saved.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Your Templates
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
                  onDelete={() => handleDelete(t.id)}
                  isSaved
                />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Starter templates */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Starter Templates
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
              />
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
