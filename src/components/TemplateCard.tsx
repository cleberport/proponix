import { Template } from '@/types/template';
import { FileText, Pencil, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  template: Template;
  onEdit: () => void;
  onGenerate: () => void;
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
};

const TemplateCard = ({ template, onEdit, onGenerate, isSaved }: Props) => {
  return (
    <div className="template-thumbnail group flex flex-col">
      {/* Thumbnail preview */}
      <div className="relative flex h-40 items-center justify-center bg-accent/50 p-4">
        <div className="canvas-paper flex h-full w-3/4 flex-col items-center justify-center rounded p-3">
          <FileText className="mb-2 h-6 w-6 text-muted-foreground" />
          <span className="text-center text-[10px] font-medium leading-tight text-foreground">
            {template.name}
          </span>
        </div>
        {isSaved && (
          <span className="absolute left-2 top-2 rounded bg-primary px-1.5 py-0.5 text-[9px] font-semibold text-primary-foreground">
            SAVED
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-3">
        <span
          className={`mb-1.5 w-fit rounded-full px-2 py-0.5 text-[10px] font-medium ${
            categoryColors[template.category] || 'bg-muted text-muted-foreground'
          }`}
        >
          {template.category}
        </span>
        <h3 className="text-sm font-semibold text-foreground">{template.name}</h3>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{template.description}</p>
        <div className="mt-3 flex gap-2">
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
