import { useParams, useNavigate } from 'react-router-dom';
import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getTemplateById, saveTemplate } from '@/lib/templateStorage';
import { CanvasElement, ElementType, ELEMENT_PALETTE, DEFAULT_VARIABLES, Template } from '@/types/template';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Play, Plus, Trash2, GripVertical } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { toast } from 'sonner';
import CanvasRenderer from '@/components/editor/CanvasRenderer';
import PropertiesPanel from '@/components/editor/PropertiesPanel';

const Editor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);

  const isNew = id === 'new';
  const base = isNew ? null : getTemplateById(id!);

  const [templateName, setTemplateName] = useState(base?.name || 'Untitled Template');
  const [elements, setElements] = useState<CanvasElement[]>(base?.elements || []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [variables, setVariables] = useState<string[]>(base?.variables || [...DEFAULT_VARIABLES]);
  const [newVar, setNewVar] = useState('');

  const selectedElement = elements.find((e) => e.id === selectedId) || null;

  const addElement = useCallback((type: ElementType) => {
    const newEl: CanvasElement = {
      id: uuidv4(),
      type,
      x: 40 + Math.random() * 100,
      y: 40 + Math.random() * 200,
      width: type === 'divider' ? 515 : type === 'table' ? 515 : 200,
      height: type === 'divider' ? 2 : type === 'table' ? 150 : type === 'notes' ? 80 : 30,
      content: type === 'text' ? 'New Text' : type === 'notes' ? 'Notes...' : type === 'dynamic-field' ? '' : type === 'price-field' ? 'Price:' : type === 'total-calculation' ? 'Total:' : '',
      variable: type === 'dynamic-field' ? 'client_name' : type === 'price-field' ? 'price' : type === 'total-calculation' ? 'total' : undefined,
      fontSize: 14,
      fontWeight: '400',
      fontFamily: 'Inter',
      color: '#0F172A',
      alignment: 'left',
      rows: type === 'table' ? [{ cells: ['Column 1', 'Column 2', 'Column 3'] }, { cells: ['', '', ''] }] : undefined,
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedId(newEl.id);
  }, []);

  const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    setElements((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  }, []);

  const deleteElement = useCallback((id: string) => {
    setElements((prev) => prev.filter((e) => e.id !== id));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  const handleSave = () => {
    const template: Template = {
      id: isNew ? uuidv4() : id!,
      name: templateName,
      category: base?.category || 'Custom',
      description: base?.description || 'Custom template',
      thumbnail: '',
      elements,
      variables,
      canvasWidth: 595,
      canvasHeight: 842,
    };
    const saved = saveTemplate(template);
    toast.success('Template saved!');
    if (isNew) navigate(`/editor/${saved.id}`, { replace: true });
  };

  const addVariable = () => {
    const v = newVar.trim().toLowerCase().replace(/\s+/g, '_');
    if (v && !variables.includes(v)) {
      setVariables((prev) => [...prev, v]);
      setNewVar('');
    }
  };

  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Type: LucideIcons.Type,
    Variable: LucideIcons.Variable,
    Image: LucideIcons.Image,
    Stamp: LucideIcons.Stamp,
    Minus: LucideIcons.Minus,
    Table: LucideIcons.Table,
    DollarSign: LucideIcons.DollarSign,
    Calculator: LucideIcons.Calculator,
    StickyNote: LucideIcons.StickyNote,
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="h-8 w-56 border-none bg-transparent text-sm font-semibold focus-visible:ring-1"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSave}>
            <Save className="mr-1.5 h-3.5 w-3.5" />
            Save
          </Button>
          <Button size="sm" onClick={() => { handleSave(); navigate(`/generate/${isNew ? 'new' : id}`); }}>
            <Play className="mr-1.5 h-3.5 w-3.5" />
            Generate
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - Elements */}
        <aside className="editor-sidebar flex w-56 flex-col overflow-y-auto">
          <div className="border-b border-border p-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Elements</h3>
          </div>
          <div className="flex flex-col gap-1 p-2">
            {ELEMENT_PALETTE.map((item) => {
              const Icon = iconMap[item.icon];
              return (
                <button
                  key={item.type}
                  onClick={() => addElement(item.type)}
                  className="flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent"
                >
                  {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Variables */}
          <div className="border-t border-border p-3">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Variables</h3>
            <div className="flex flex-col gap-1">
              {variables.map((v) => (
                <div
                  key={v}
                  className="drag-handle flex items-center gap-1.5 rounded bg-accent px-2 py-1 text-xs text-foreground"
                  draggable
                >
                  <GripVertical className="h-3 w-3 text-muted-foreground" />
                  <code className="font-mono">{`{{${v}}}`}</code>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-1">
              <Input
                value={newVar}
                onChange={(e) => setNewVar(e.target.value)}
                placeholder="new_variable"
                className="h-7 text-xs"
                onKeyDown={(e) => e.key === 'Enter' && addVariable()}
              />
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={addVariable}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </aside>

        {/* Canvas */}
        <main className="flex flex-1 items-center justify-center overflow-auto bg-background p-8">
          <CanvasRenderer
            ref={canvasRef}
            elements={elements}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onUpdate={updateElement}
          />
        </main>

        {/* Right sidebar - Properties */}
        <aside className="editor-sidebar w-64 overflow-y-auto">
          <PropertiesPanel
            element={selectedElement}
            variables={variables}
            onUpdate={(updates) => selectedId && updateElement(selectedId, updates)}
            onDelete={() => selectedId && deleteElement(selectedId)}
          />
        </aside>
      </div>
    </div>
  );
};

export default Editor;
