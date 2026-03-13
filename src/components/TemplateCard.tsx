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
        className="relative flex items-center justify-between px-3 py-2.5"
        style={{ backgroundColor: `${color}15` }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: color }} />
          <h3 className="text-sm font-semibold text-foreground leading-snug truncate">{template.name}</h3>
        </div>
        <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {onDelete && (
            <Button
              variant="ghost" size="sm"
              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
          {onDuplicate && (
            <Button
              variant="ghost" size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            >
              <Copy className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5 p-3 pt-2">
        <p className="text-[11px] text-muted-foreground line-clamp-2">{template.description}</p>

        {template.inputFields && (
          <p className="text-[10px] text-muted-foreground">
            {template.inputFields.length} {template.inputFields.length === 1 ? 'campo' : 'campos'}
          </p>
        )}

        <div className="mt-auto flex gap-1.5 pt-1.5">
          <Button variant="outline" size="sm" className="flex-1 text-[11px] h-8" onClick={onEdit}>
            <Pencil className="mr-1 h-3 w-3" />
            Editar
          </Button>
          <Button size="sm" className="flex-1 text-[11px] h-8" onClick={onGenerate}>
            <Play className="mr-1 h-3 w-3" />
            Gerar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TemplateCard;
