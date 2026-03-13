import { Template } from '@/types/template';
import { FileText, Pencil, Play, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  template: Template;
  onEdit: () => void;
  onGenerate: () => void;
  onDelete?: () => void;
  isSaved?: boolean;
}

const categoryColors: Record<string, string> = {
  Corporate: 'bg-primary/10 text-primary',
  Events: 'bg-warning/10 text-warning',
  Freelance: 'bg-success/10 text-success',
  Creative: 'bg-destructive/10 text-destructive',
  General: 'bg-muted text-muted-foreground',
  Entertainment: 'bg-primary/10 text-primary',
  Production: 'bg-accent text-accent-foreground',
  Agency: 'bg-primary/10 text-primary',
  Custom: 'bg-accent text-accent-foreground',
};

const TemplateCard = ({ template, onEdit, onGenerate, onDelete, isSaved }: Props) => {
  return (
    <div className="template-thumbnail group flex flex-col">
      {/* Thumbnail preview */}
      <div className="relative flex h-36 items-center justify-center bg-accent/30 p-4">
        <div className="flex flex-col items-center gap-1.5">
          <FileText className="h-8 w-8 text-muted-foreground/50" />
          <span className="text-xs font-medium text-muted-foreground">{template.name}</span>
        </div>
        {isSaved && (
          <span className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[9px] font-semibold text-primary-foreground">
            SAVED
          </span>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-2 top-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-1">
          <h3 className="text-sm font-semibold text-foreground leading-snug">{template.name}</h3>
          <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${categoryColors[template.category] || categoryColors.General}`}>
            {template.category}
          </span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>

        {template.inputFields && (
          <p className="text-[10px] text-muted-foreground">
            {template.inputFields.length} fields to fill
          </p>
        )}

        <div className="mt-auto flex gap-1.5 pt-2">
          <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={onEdit}>
            <Pencil className="mr-1 h-3 w-3" />
            Edit
          </Button>
          <Button size="sm" className="flex-1 text-xs" onClick={onGenerate}>
            <Play className="mr-1 h-3 w-3" />
            Generate
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TemplateCard;
