import { useParams, useNavigate } from 'react-router-dom';
import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getTemplateById, saveTemplate } from '@/lib/templateStorage';
import { CanvasElement, ElementType, ELEMENT_PALETTE, DEFAULT_VARIABLES, Template, TemplateSettings, DEFAULT_TEMPLATE_VALUES, DEFAULT_CALCULATED_FIELDS } from '@/types/template';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Play, Plus, GripVertical, Settings2 } from 'lucide-react';
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
  const [defaultValues, setDefaultValues] = useState<Record<string, string>>(base?.defaultValues || { ...DEFAULT_TEMPLATE_VALUES });
  const [inputFields, setInputFields] = useState<string[]>(base?.inputFields || ['client_name', 'event_name', 'location', 'event_date']);
  const [calculatedFields, setCalculatedFields] = useState<Record<string, string>>(base?.calculatedFields || { ...DEFAULT_CALCULATED_FIELDS });
  const [settings, setSettings] = useState<TemplateSettings>(base?.settings || { taxRate: 0.10, showTax: true });

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
      isVisible: true,
      fieldCategory: type === 'dynamic-field' ? 'input' : type === 'price-field' || type === 'total-calculation' ? 'calculated' : 'default',
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
      defaultValues,
      inputFields,
      calculatedFields,
      settings,
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

  const toggleInputField = (v: string) => {
    setInputFields((prev) =>
      prev.includes(v) ? prev.filter((f) => f !== v) : [...prev, v]
    );
  };

  const updateDefaultValue = (key: string, value: string) => {
    setDefaultValues((prev) => ({ ...prev, [key]: value }));
  };

  const updateCalculatedFormula = (field: string, formula: string) => {
    setCalculatedFields((prev) => ({ ...prev, [field]: formula }));
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

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Left sidebar */}
        <aside className="editor-sidebar flex w-full md:w-64 flex-col overflow-y-auto max-h-[40vh] md:max-h-none">
          <Tabs defaultValue="elements" className="flex flex-1 flex-col">
            <TabsList className="mx-2 mt-2 grid w-auto grid-cols-3">
              <TabsTrigger value="elements" className="text-xs">Elements</TabsTrigger>
              <TabsTrigger value="data" className="text-xs">Data</TabsTrigger>
              <TabsTrigger value="settings" className="text-xs">
                <Settings2 className="h-3 w-3" />
              </TabsTrigger>
            </TabsList>

            {/* Elements tab */}
            <TabsContent value="elements" className="flex-1 overflow-y-auto">
              <div className="border-b border-border p-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add Elements</h3>
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
            </TabsContent>

            {/* Data tab - defaults, inputs, formulas */}
            <TabsContent value="data" className="flex-1 overflow-y-auto">
              {/* Input Fields Selection */}
              <div className="border-b border-border p-3">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Input Fields
                </h3>
                <p className="mb-3 text-[10px] text-muted-foreground">
                  Fields users must fill when generating a document
                </p>
                <div className="flex flex-col gap-1.5">
                  {variables.map((v) => (
                    <label key={v} className="flex items-center gap-2 rounded px-2 py-1 text-xs hover:bg-accent/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={inputFields.includes(v)}
                        onChange={() => toggleInputField(v)}
                        className="h-3 w-3 rounded border-border"
                      />
                      <span className="text-foreground">{v.replace(/_/g, ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Default Values */}
              <div className="border-b border-border p-3">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Default Values
                </h3>
                <p className="mb-3 text-[10px] text-muted-foreground">
                  Pre-filled values saved with the template
                </p>
                <div className="flex flex-col gap-2">
                  {variables
                    .filter((v) => !inputFields.includes(v) && !Object.keys(calculatedFields).includes(v))
                    .map((v) => (
                      <div key={v}>
                        <Label className="text-[10px] text-muted-foreground">{v.replace(/_/g, ' ')}</Label>
                        <Input
                          value={defaultValues[v] || ''}
                          onChange={(e) => updateDefaultValue(v, e.target.value)}
                          placeholder={`Default for ${v}`}
                          className="h-7 text-xs"
                        />
                      </div>
                    ))}
                </div>
              </div>

              {/* Calculated Fields */}
              <div className="p-3">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Calculated Fields
                </h3>
                <p className="mb-3 text-[10px] text-muted-foreground">
                  Auto-calculated from other values (e.g. price * tax_rate)
                </p>
                <div className="flex flex-col gap-2">
                  {Object.entries(calculatedFields).map(([field, formula]) => (
                    <div key={field}>
                      <Label className="text-[10px] text-muted-foreground">{field}</Label>
                      <Input
                        value={formula}
                        onChange={(e) => updateCalculatedFormula(field, e.target.value)}
                        placeholder="e.g. price * tax_rate"
                        className="h-7 font-mono text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Settings tab */}
            <TabsContent value="settings" className="flex-1 overflow-y-auto p-3">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Template Settings
              </h3>

              <div className="flex flex-col gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Default Tax Rate</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={settings.taxRate}
                    onChange={(e) => {
                      const rate = parseFloat(e.target.value) || 0;
                      setSettings((prev) => ({ ...prev, taxRate: rate }));
                      updateDefaultValue('tax_rate', String(rate));
                    }}
                    className="h-7 text-xs"
                  />
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    e.g. 0.10 = 10%
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                  <span className="text-xs font-medium text-foreground">Show tax on document</span>
                  <Switch
                    checked={settings.showTax}
                    onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, showTax: checked }))}
                  />
                </div>
                {!settings.showTax && (
                  <p className="text-[10px] text-muted-foreground">
                    Tax will be hidden from the document but still included in the total.
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
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
