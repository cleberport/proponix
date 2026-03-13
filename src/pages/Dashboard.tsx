import { useNavigate } from 'react-router-dom';
import { Template } from '@/types/template';
import { getStarterTemplates, getSavedTemplates } from '@/lib/templateStorage';
import { useState } from 'react';
import { Plus, FileText, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import TemplateCard from '@/components/TemplateCard';

const Dashboard = () => {
  const navigate = useNavigate();
  const starters = getStarterTemplates();
  const [saved] = useState(getSavedTemplates());

  const handleSelect = (template: Template) => {
    navigate(`/editor/${template.id}`);
  };

  const handleGenerate = (template: Template) => {
    navigate(`/generate/${template.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Budget Template Builder</h1>
              <p className="text-xs text-muted-foreground">Create professional budget PDFs</p>
            </div>
          </div>
          <Button onClick={() => navigate('/editor/new')} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            New Template
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Saved templates */}
        {saved.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Your Templates
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
      </main>
    </div>
  );
};

export default Dashboard;
