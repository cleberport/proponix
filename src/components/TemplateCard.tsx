import { Template } from '@/types/template';
import { Pencil, Play, Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  template: Template;
  onEdit: () => void;
  onGenerate: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  isSaved?: boolean;
}

const TemplateCard = ({ template, onEdit, onGenerate, onDelete, onDuplicate, isSaved }: Props) => {
  const color = template.color || '#6366F1';

  return (
    <div className="template-thumbnail group flex flex-col overflow-hidden">
      {/* Color bar header */}
      <div
        className="relative flex items-center justify-between gap-1 px-2.5 py-2"
        style={{ backgroundColor: `${color}15` }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
          <h3 className="text-xs font-semibold text-foreground leading-tight truncate">{template.name}</h3>
        </div>
        <div className="flex shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {onDelete && (
            <button
              className="p-1 text-destructive hover:text-destructive/80"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
          {onDuplicate && (
            <button
              className="p-1 text-muted-foreground hover:text-foreground"
              onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            >
              <Copy className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1 p-2.5 pt-1.5">
        <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">{template.description}</p>

        {template.inputFields && (
          <p className="text-[9px] text-muted-foreground">
            {template.inputFields.length} {template.inputFields.length === 1 ? 'campo' : 'campos'}
          </p>
        )}

        <div className="mt-auto flex flex-col gap-1 pt-1.5">
          <Button size="sm" className="w-full text-[10px] h-7 px-2" onClick={onGenerate}>
            <Play className="mr-1 h-2.5 w-2.5" />
            Gerar
          </Button>
          <Button variant="outline" size="sm" className="w-full text-[10px] h-7 px-2" onClick={onEdit}>
            <Pencil className="mr-1 h-2.5 w-2.5" />
            Editar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TemplateCard;
