import { Template } from '@/types/template';
import { Pencil, Trash2, Copy, FileText } from 'lucide-react';
import TemplatePreview from '@/components/TemplatePreview';
import { Button } from '@/components/ui/button';

interface Props {
  template: Template;
  onEdit: () => void;
  onGenerate?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  isSaved?: boolean;
}

const TemplateCard = ({ template, onEdit, onGenerate, onDelete, onDuplicate }: Props) => {
  const handleClick = () => {
    // Mobile: go straight to generate if available, otherwise edit
    if (window.innerWidth < 768 && onGenerate) {
      onGenerate();
    } else if (window.innerWidth < 768) {
      onEdit();
    }
    // Desktop: no action on card click (buttons below handle it)
  };

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-all duration-200 hover:shadow-lg md:cursor-default cursor-pointer"
      onClick={handleClick}
    >
      {/* Preview with hover overlay */}
      <div className="relative overflow-hidden bg-muted/20">
        <TemplatePreview template={template} className="w-full" />

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

      {/* Label */}
      <div className="px-2 py-1.5">
        <h3 className="truncate text-xs font-medium text-foreground">{template.name}</h3>
      </div>

      {/* Desktop action buttons */}
      <div className="hidden md:flex gap-1.5 px-2 pb-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-7 text-[11px] gap-1"
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
        >
          <Pencil className="h-3 w-3" />
          Editar
        </Button>
        {onGenerate && (
          <Button
            size="sm"
            className="flex-1 h-7 text-[11px] gap-1"
            onClick={(e) => { e.stopPropagation(); onGenerate(); }}
          >
            <FileText className="h-3 w-3" />
            Gerar
          </Button>
        )}
      </div>
    </article>
  );
};

export default TemplateCard;
