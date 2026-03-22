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

      <div className="flex flex-1 flex-col gap-1 p-2 md:gap-2 md:p-3">
        <h3 className="truncate text-xs font-semibold text-foreground md:text-sm">{template.name}</h3>
        <p className="line-clamp-1 text-[10px] text-muted-foreground md:line-clamp-2 md:text-[11px]">{template.description}</p>

        <div className="mt-auto flex items-center gap-1 pt-0.5 md:gap-1.5 md:pt-1">
          <Button variant="outline" size="sm" className="h-7 flex-1 text-[11px] px-1.5 md:h-8 md:px-2" onClick={onEdit}>
            <Pencil className="mr-1 h-3 w-3 shrink-0 hidden md:inline-block" />
            Editar
          </Button>
          <Button size="sm" className="h-7 flex-1 text-[11px] px-1.5 md:h-8 md:px-2" onClick={onGenerate}>
            <Play className="mr-1 h-3 w-3 shrink-0 hidden md:inline-block" />
            Gerar
          </Button>
        </div>
      </div>
    </article>
  );
};

export default TemplateCard;
