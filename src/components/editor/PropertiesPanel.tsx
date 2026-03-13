import { CanvasElement } from '@/types/template';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Plus, Upload, X } from 'lucide-react';
import { useRef } from 'react';

interface Props {
  element: CanvasElement | null;
  variables: string[];
  onUpdate: (updates: Partial<CanvasElement>) => void;
  onDelete: () => void;
}

const PropertiesPanel = ({ element, variables, onUpdate, onDelete }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onUpdate({ imageUrl: ev.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  if (!element) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-center text-sm text-muted-foreground">
          Select an element to edit its properties
        </p>
      </div>
    );
  }

  const addRow = () => {
    if (!element.rows) return;
    const cols = element.rows[0]?.cells.length || 3;
    onUpdate({ rows: [...element.rows, { cells: Array(cols).fill('') }] });
  };

  const updateCell = (ri: number, ci: number, value: string) => {
    if (!element.rows) return;
    const newRows = element.rows.map((r, i) =>
      i === ri ? { cells: r.cells.map((c, j) => (j === ci ? value : c)) } : r
    );
    onUpdate({ rows: newRows });
  };

  const removeRow = (ri: number) => {
    if (!element.rows || element.rows.length <= 1) return;
    onUpdate({ rows: element.rows.filter((_, i) => i !== ri) });
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Properties
        </h3>
        <Button variant="ghost" size="sm" className="h-7 text-destructive" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="rounded-md bg-accent/50 px-2 py-1">
        <span className="text-xs font-medium capitalize text-foreground">{element.type.replace('-', ' ')}</span>
      </div>

      {/* Position */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-muted-foreground">X</Label>
          <Input type="number" value={element.x} onChange={(e) => onUpdate({ x: +e.target.value })} className="h-7 text-xs" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Y</Label>
          <Input type="number" value={element.y} onChange={(e) => onUpdate({ y: +e.target.value })} className="h-7 text-xs" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Width</Label>
          <Input type="number" value={element.width} onChange={(e) => onUpdate({ width: +e.target.value })} className="h-7 text-xs" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Height</Label>
          <Input type="number" value={element.height} onChange={(e) => onUpdate({ height: +e.target.value })} className="h-7 text-xs" />
        </div>
      </div>

      {/* Content */}
      {element.type !== 'divider' && element.type !== 'image' && element.type !== 'logo' && element.type !== 'table' && (
        <div>
          <Label className="text-xs text-muted-foreground">Content</Label>
          {element.type === 'notes' ? (
            <Textarea value={element.content} onChange={(e) => onUpdate({ content: e.target.value })} className="text-xs" rows={3} />
          ) : (
            <Input value={element.content} onChange={(e) => onUpdate({ content: e.target.value })} className="h-7 text-xs" />
          )}
        </div>
      )}

      {/* Variable */}
      {(element.type === 'dynamic-field' || element.type === 'price-field' || element.type === 'total-calculation') && (
        <div>
          <Label className="text-xs text-muted-foreground">Variable</Label>
          <Select value={element.variable || ''} onValueChange={(v) => onUpdate({ variable: v })}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {variables.map((v) => (
                <SelectItem key={v} value={v} className="text-xs">
                  {`{{${v}}}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Typography */}
      {element.type !== 'divider' && (
        <>
          <div>
            <Label className="text-xs text-muted-foreground">Font Size</Label>
            <Input type="number" value={element.fontSize || 14} onChange={(e) => onUpdate({ fontSize: +e.target.value })} className="h-7 text-xs" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Font Weight</Label>
            <Select value={element.fontWeight || '400'} onValueChange={(v) => onUpdate({ fontWeight: v })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="300">Light</SelectItem>
                <SelectItem value="400">Regular</SelectItem>
                <SelectItem value="500">Medium</SelectItem>
                <SelectItem value="600">Semibold</SelectItem>
                <SelectItem value="700">Bold</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Font Family</Label>
            <Select value={element.fontFamily || 'Inter'} onValueChange={(v) => onUpdate({ fontFamily: v })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Inter">Inter</SelectItem>
                <SelectItem value="Roboto">Roboto</SelectItem>
                <SelectItem value="Merriweather">Merriweather</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Alignment</Label>
            <Select value={element.alignment || 'left'} onValueChange={(v) => onUpdate({ alignment: v as 'left' | 'center' | 'right' })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Color</Label>
            <div className="flex gap-2">
              <input type="color" value={element.color || '#0F172A'} onChange={(e) => onUpdate({ color: e.target.value })} className="h-7 w-7 cursor-pointer rounded border border-border" />
              <Input value={element.color || '#0F172A'} onChange={(e) => onUpdate({ color: e.target.value })} className="h-7 flex-1 text-xs" />
            </div>
          </div>
        </>
      )}

      {/* Table editor */}
      {element.type === 'table' && element.rows && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Table Cells</Label>
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={addRow}>
              <Plus className="mr-1 h-3 w-3" /> Row
            </Button>
          </div>
          <div className="flex flex-col gap-1.5">
            {element.rows.map((row, ri) => (
              <div key={ri} className="flex items-center gap-1">
                <div className="flex flex-1 gap-1">
                  {row.cells.map((cell, ci) => (
                    <Input
                      key={ci}
                      value={cell}
                      onChange={(e) => updateCell(ri, ci, e.target.value)}
                      className="h-6 text-[10px]"
                      placeholder={ri === 0 ? 'Header' : 'Cell'}
                    />
                  ))}
                </div>
                {ri > 0 && (
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeRow(ri)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertiesPanel;
