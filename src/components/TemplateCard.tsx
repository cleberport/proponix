import { Template } from '@/types/template';
import { Pencil, Play, Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TemplatePreview from '@/components/TemplatePreview';

interface Props {
  template: Template;
  onEdit: () => void;
  onGenerate: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  isSaved?: boolean;
}

const TemplateCard = ({ template, onEdit, onGenerate, onDelete, onDuplicate }: Props) => {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
      {/* Preview */}
      <div className="relative overflow-hidden bg-muted/30">
        <div className="transition-transform duration-300 group-hover:scale-[1.03]">
          <TemplatePreview template={template} className="w-full" />
        </div>

        {/* Floating actions (delete / duplicate) */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onDuplicate && (
            <button
              className="rounded-md bg-background/80 backdrop-blur-sm p-1.5 text-muted-foreground hover:text-foreground shadow-sm"
              onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              className="rounded-md bg-background/80 backdrop-blur-sm p-1.5 text-destructive hover:text-destructive/80 shadow-sm"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-2 p-3">
        <h3 className="text-sm font-semibold text-foreground truncate">{template.name}</h3>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={onEdit}>
            <Pencil className="mr-1 h-3 w-3" />
            Editar
          </Button>
          <Button size="sm" className="flex-1 text-xs h-8" onClick={onGenerate}>
            <Play className="mr-1 h-3 w-3" />
            Gerar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TemplateCard;
