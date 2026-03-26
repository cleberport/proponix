import { Template } from '@/types/template';
import { Pencil, Trash2, Copy } from 'lucide-react';
import TemplatePreview from '@/components/TemplatePreview';

interface Props {
  template: Template;
  onEdit: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  isSaved?: boolean;
}

const TemplateCard = ({ template, onEdit, onDelete, onDuplicate }: Props) => {
  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card cursor-pointer transition-all duration-200 hover:shadow-lg"
      onClick={onEdit}
    >
      {/* Preview with hover overlay */}
      <div className="relative overflow-hidden bg-muted/20">
        <TemplatePreview template={template} className="w-full" />

        {/* Dark overlay + edit icon on hover */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/50 group-hover:opacity-100">
          <Pencil className="h-5 w-5 text-white drop-shadow-md" />
          <span className="text-xs font-semibold text-white drop-shadow-md">Editar</span>
        </div>

        {/* Action icons top-right */}
        <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {onDuplicate && (
            <button
              className="rounded-md bg-background/90 p-1.5 text-foreground shadow-sm backdrop-blur-sm hover:text-primary border border-border/50"
              onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            >
              <Copy className="h-3 w-3" />
            </button>
          )}
          {onDelete && (
            <button
              className="rounded-md bg-background/90 p-1.5 text-destructive shadow-sm backdrop-blur-sm hover:text-destructive/80 border border-border/50"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Compact label */}
      <div className="px-2 py-1.5">
        <h3 className="truncate text-xs font-medium text-foreground">{template.name}</h3>
      </div>
    </article>
  );
};

export default TemplateCard;
