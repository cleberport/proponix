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
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative overflow-hidden border-b border-border/70 bg-muted/20">
        <div className="transition-transform duration-300 group-hover:scale-[1.02]">
          <TemplatePreview template={template} className="w-full" />
        </div>

        <div className="absolute right-2 top-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          {onDuplicate && (
            <button
              className="rounded-md bg-background/90 p-1.5 text-muted-foreground shadow-sm backdrop-blur-sm hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              className="rounded-md bg-background/90 p-1.5 text-destructive shadow-sm backdrop-blur-sm hover:text-destructive/80"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="truncate text-sm font-semibold text-foreground">{template.name}</h3>
        <p className="line-clamp-2 text-[11px] text-muted-foreground">{template.description}</p>

        <div className="mt-auto flex items-center gap-2 pt-1">
          <Button variant="outline" size="sm" className="h-9 flex-1 text-xs" onClick={onEdit}>
            <Pencil className="mr-1 h-3 w-3" />
            Editar
          </Button>
          <Button size="sm" className="h-9 flex-1 text-xs" onClick={onGenerate}>
            <Play className="mr-1 h-3 w-3" />
            Gerar
          </Button>
        </div>
      </div>
    </article>
  );
};

export default TemplateCard;
