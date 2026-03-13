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

const TemplateCard = ({ template, onEdit, onGenerate, onDelete, onDuplicate, isSaved }: Props) => {
  return (
    <div className="template-thumbnail group flex flex-col">
      {/* Mini preview of elements */}
      <div className="relative h-36 bg-white overflow-hidden p-2">
        <div className="relative w-full h-full" style={{ fontSize: '4px' }}>
          {template.elements.slice(0, 8).map((el) => (
            <div
              key={el.id}
              className="absolute overflow-hidden"
              style={{
                left: `${(el.x / 595) * 100}%`,
                top: `${(el.y / 842) * 100}%`,
                width: `${(el.width / 595) * 100}%`,
                height: `${(el.height / 842) * 100}%`,
              }}
            >
              {el.type === 'divider' ? (
                <div className="w-full h-px bg-border" />
              ) : el.type === 'table' ? (
                <div className="w-full h-full border border-border/50 rounded-[1px]" />
              ) : (
                <div
                  className="truncate leading-tight"
                  style={{
                    fontSize: `${Math.max(3, (el.fontSize || 14) * 0.28)}px`,
                    fontWeight: el.fontWeight,
                    textAlign: el.alignment,
                    color: '#334155',
                  }}
                >
                  {el.content || (el.variable ? `{{${el.variable}}}` : '')}
                </div>
              )}
            </div>
          ))}
        </div>
        {isSaved && (
          <span className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[9px] font-semibold text-primary-foreground">
            SALVO
          </span>
        )}
        <div className="absolute left-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-destructive hover:text-destructive bg-card/80"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDuplicate && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground bg-card/80"
              onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
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
            {template.inputFields.length} {template.inputFields.length === 1 ? 'campo' : 'campos'} para preencher
          </p>
        )}

        <div className="mt-auto flex gap-1.5 pt-2">
          <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={onEdit}>
            <Pencil className="mr-1 h-3 w-3" />
            Editar
          </Button>
          <Button size="sm" className="flex-1 text-xs" onClick={onGenerate}>
            <Play className="mr-1 h-3 w-3" />
            Gerar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TemplateCard;
